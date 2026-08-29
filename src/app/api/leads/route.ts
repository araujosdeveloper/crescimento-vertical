import { NextResponse } from "next/server";
import { getPayload } from "payload";
import config from "@payload-config";
import { CONSENT_VERSION, consentTextHash, issueFormToken, requestOriginAllowed, validateLeadInput, verifyFormToken } from "@/lib/lead-intake";

const attempts = new Map<string, { count: number; at: number }>();
const genericError = () => NextResponse.json({ ok: false, error: "Não foi possível enviar agora. Revise os campos ou tente novamente." }, { status: 400 });

export async function GET() {
  const token = issueFormToken();
  if (!token) return NextResponse.json({ ok: false, error: "Formulário temporariamente indisponível." }, { status: 503 });
  return NextResponse.json({ ok: true, token, consentVersion: CONSENT_VERSION, consentTextHash: consentTextHash() }, { headers: { "Cache-Control": "no-store" } });
}

export async function POST(request: Request) {
  const length = Number(request.headers.get("content-length") || 0); if (length > 20000 || !request.headers.get("content-type")?.includes("application/json") || !requestOriginAllowed(request)) return genericError();
  let input: Record<string, unknown>; try { input = await request.json(); } catch { return genericError(); }
  if (!verifyFormToken(input.formToken) || !validateLeadInput(input).value) return genericError();
  const checked = validateLeadInput(input); if ("error" in checked) return genericError();
  const key = checked.value.idempotencyKey; if (!key || key.length < 16) return genericError();
  const now = Date.now(); const attempt = attempts.get(key); if (attempt && now - attempt.at < 3600000) return NextResponse.json({ ok: true, message: "Solicitação recebida." }); attempts.set(key, { count: 1, at: now });
  try {
    const payload = await getPayload({ config });
    const existing = await payload.find({ collection: "leads", where: { idempotencyKey: { equals: key } }, limit: 1, overrideAccess: true });
    if (existing.docs[0]) return NextResponse.json({ ok: true, message: "Solicitação recebida." });
    const transactionID = await payload.db.beginTransaction();
    if (!transactionID) throw new Error("transaction-unavailable");
    const transactionReq = { payload, transactionID } as never;
    try {
      const lead = await payload.create({ collection: "leads", data: { ...checked.value, consentedAt: new Date().toISOString(), retentionUntil: new Date(Date.now() + 180 * 86400000).toISOString(), notificationStatus: "pending", notificationAttempts: 0 } as never, overrideAccess: true, req: transactionReq, disableTransaction: true });
      await payload.create({ collection: "lead-outbox", data: { lead: lead.id, type: "commercial_notification", state: "pending", attempts: 0 } as never, overrideAccess: true, req: transactionReq, disableTransaction: true });
      await payload.db.commitTransaction(transactionID);
    } catch (error) {
      await payload.db.rollbackTransaction(transactionID);
      throw error;
    }
    return NextResponse.json({ ok: true, message: "Solicitação recebida." });
  } catch { attempts.delete(key); return NextResponse.json({ ok: false, error: "Não foi possível enviar agora. Tente novamente em instantes." }, { status: 503 }); }
}
