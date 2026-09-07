import { NextResponse } from "next/server";
import { getPayload } from "payload";
import config from "@payload-config";
import { log } from "@/lib/logger";
import { recordError, recordHttpStatus } from "@/lib/metrics";
import {
  NEWSLETTER_CONSENT_VERSION,
  newsletterConsentTextHash,
  validateNewsletterInput,
} from "@/lib/newsletter-intake";
import { issueFormToken, requestOriginAllowed, verifyFormToken } from "@/lib/lead-intake";

const ipAttempts = new Map<string, { count: number; windowStart: number }>();
const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX = 10;

function clientIp(request: Request): string {
  const cf = request.headers.get("cf-connecting-ip");
  if (cf) return cf.trim() || "unknown";
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

const genericError = () =>
  NextResponse.json({ ok: false, error: "Não foi possível concluir. Revise o e-mail e tente novamente." }, { status: 400 });

export async function GET() {
  const token = issueFormToken();
  if (!token) return NextResponse.json({ ok: false, error: "Indisponível temporariamente." }, { status: 503 });
  return NextResponse.json(
    { ok: true, token, consentVersion: NEWSLETTER_CONSENT_VERSION, consentTextHash: newsletterConsentTextHash() },
    { headers: { "Cache-Control": "no-store" } },
  );
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
    log("error", "newsletter_unexpected_error", { route: "newsletter", message: error instanceof Error ? error.message : String(error) });
    return NextResponse.json({ ok: false, error: "Não foi possível concluir. Tente novamente em instantes." }, { status: 500 });
  }
}

async function handlePost(request: Request) {
  if (isRateLimited(clientIp(request))) {
    return NextResponse.json({ ok: false, error: "Muitas tentativas. Aguarde um instante." }, { status: 429 });
  }
  const length = Number(request.headers.get("content-length") || 0);
  if (length > 10000 || !request.headers.get("content-type")?.includes("application/json") || !requestOriginAllowed(request)) {
    return genericError();
  }
  let input: Record<string, unknown>;
  try {
    input = await request.json();
  } catch {
    return genericError();
  }
  if (!verifyFormToken(input.formToken)) return genericError();
  const checked = validateNewsletterInput(input);
  if ("error" in checked) return genericError();
  const { email, idempotencyKey } = checked.value;

  const payload = await getPayload({ config });
  const existing = await payload.find({
    collection: "newsletter-subscribers",
    where: { email: { equals: email } },
    limit: 1,
    overrideAccess: true,
  });
  if (existing.docs[0]) {
    return NextResponse.json({ ok: true, message: "Inscrição já registrada." });
  }
  await payload.create({
    collection: "newsletter-subscribers",
    data: {
      email,
      consentVersion: checked.value.consentVersion,
      consentTextHash: checked.value.consentTextHash,
      consentedAt: new Date().toISOString(),
      status: "subscribed",
      source: "site",
      idempotencyKey,
    } as never,
    overrideAccess: true,
    context: { newsletterIntake: true },
  });
  log("info", "newsletter_subscribed", { route: "newsletter" });
  return NextResponse.json({ ok: true, message: "Inscrição confirmada." });
}
