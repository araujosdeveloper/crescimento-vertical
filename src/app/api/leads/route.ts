import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { getPayload } from "payload";
import config from "@payload-config";
import { CONSENT_VERSION, consentTextHash, issueFormToken, requestOriginAllowed, validateLeadInput, verifyFormToken } from "@/lib/lead-intake";
import { log } from "@/lib/logger";
import { recordError, recordHttpStatus } from "@/lib/metrics";

const attempts = new Map<string, { count: number; at: number }>();
const ipAttempts = new Map<string, { count: number; windowStart: number }>();
const genericError = () => NextResponse.json({ ok: false, error: "Não foi possível enviar agora. Revise os campos ou tente novamente." }, { status: 400 });
const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX = 10;

function clientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0]?.trim() || "unknown";
  return request.headers.get("x-real-ip") || "unknown";
}

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const entry = ipAttempts.get(ip);
  if (!entry || now - entry.windowStart > RATE_LIMIT_WINDOW_MS) {
    ipAttempts.set(ip, { count: 1, windowStart: now });
    return false;
  }
  entry.count += 1;
  return entry.count > RATE_LIMIT_MAX;
}

export async function GET() {
  const token = issueFormToken();
  if (!token) return NextResponse.json({ ok: false, error: "Formulário temporariamente indisponível." }, { status: 503 });
  return NextResponse.json({ ok: true, token, consentVersion: CONSENT_VERSION, consentTextHash: consentTextHash() }, { headers: { "Cache-Control": "no-store" } });
}

export async function POST(request: Request) {
  const startedAt = Date.now();
  try {
    const response = await handlePost(request);
    recordHttpStatus(response.status, Date.now() - startedAt);
    return response;
  } catch (error) {
    recordError();
    recordHttpStatus(500, Date.now() - startedAt);
    log("error", "lead_unexpected_error", { route: "leads", message: error instanceof Error ? error.message : String(error) });
    return NextResponse.json({ ok: false, error: "Não foi possível enviar agora. Tente novamente em instantes." }, { status: 500 });
  }
}

async function handlePost(request: Request) {
  const requestId = randomUUID();
  if (isRateLimited(clientIp(request))) {
    log("warn", "lead_rate_limited", { route: "leads" }, requestId);
    return NextResponse.json({ ok: false, error: "Muitas tentativas. Aguarde um instante e tente novamente." }, { status: 429 });
  }
  const length = Number(request.headers.get("content-length") || 0); if (length > 20000 || !request.headers.get("content-type")?.includes("application/json") || !requestOriginAllowed(request)) return genericError();
  let input: Record<string, unknown>; try { input = await request.json(); } catch { return genericError(); }
  if (!verifyFormToken(input.formToken) || !validateLeadInput(input).value) return genericError();
  const checked = validateLeadInput(input); if ("error" in checked) return genericError();
  const key = checked.value.idempotencyKey; if (!key || key.length < 16) return genericError();
  const now = Date.now(); const attempt = attempts.get(key); if (attempt && now - attempt.at < 3600000) return NextResponse.json({ ok: true, message: "Solicitação recebida." }); attempts.set(key, { count: 1, at: now });
  try {
    const payload = await getPayload({ config });
    const existing = await payload.find({ collection: "leads", where: { idempotencyKey: { equals: key } }, limit: 1, overrideAccess: true });
    if (existing.docs[0]) {
      log("info", "lead_duplicate_idempotent", { route: "leads" }, requestId);
      return NextResponse.json({ ok: true, message: "Solicitação recebida." });
    }
    const transactionID = await payload.db.beginTransaction();
    if (!transactionID) throw new Error("transaction-unavailable");
    const transactionReq = { payload, transactionID } as never;
    let leadId: number | string | undefined;
    try {
      const lead = await payload.create({ collection: "leads", data: { ...checked.value, consentedAt: new Date().toISOString(), retentionUntil: new Date(Date.now() + 180 * 86400000).toISOString(), notificationStatus: "pending", notificationAttempts: 0 } as never, overrideAccess: true, req: transactionReq, disableTransaction: true });
      leadId = lead.id;
      await payload.create({ collection: "lead-outbox", data: { lead: lead.id, type: "commercial_notification", state: "pending", attempts: 0, notificationKey: randomUUID() } as never, overrideAccess: true, req: transactionReq, disableTransaction: true });
      await payload.db.commitTransaction(transactionID);
    } catch (error) {
      await payload.db.rollbackTransaction(transactionID);
      throw error;
    }
    log("info", "lead_created", { route: "leads", leadId }, requestId);
    return NextResponse.json({ ok: true, message: "Solicitação recebida." });
  } catch { attempts.delete(key); log("error", "lead_create_failed", { route: "leads" }, requestId); return NextResponse.json({ ok: false, error: "Não foi possível enviar agora. Tente novamente em instantes." }, { status: 503 }); }
}
