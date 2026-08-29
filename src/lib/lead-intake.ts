import { createHash, createHmac, randomUUID, timingSafeEqual } from "node:crypto";

export const CONSENT_VERSION = "2026-08-29.v1";
export const CONSENT_TEXT = "Autorizo o contato da Crescimento Vertical para tratar esta solicitação de diagnóstico, usando os dados enviados pelo prazo informado na política de privacidade.";
const MAX = { name: 120, email: 180, phone: 40, company: 160, serviceInterest: 80, operationalContext: 1000, challenge: 2000, preference: 20, source: 80, page: 200, content: 120, utm: 100, referrer: 200 };

export function normalize(value: unknown, max: number) {
  return typeof value === "string" ? value.normalize("NFKC").trim().replace(/[\u0000-\u001f\u007f]/g, "").slice(0, max) : "";
}
export function consentTextHash() { return createHash("sha256").update(CONSENT_TEXT).digest("hex"); }
export function idempotencyKey(value: unknown) { return normalize(value, 100).toLowerCase(); }
export function formSecret() { return process.env.LEADS_FORM_SECRET || process.env.PAYLOAD_SECRET || ""; }
export function issueFormToken(now = Date.now()) {
  const secret = formSecret(); if (!secret) return null;
  const payload = `${Math.floor(now / 1000)}.${randomUUID()}`;
  return `${payload}.${createHmac("sha256", secret).update(payload).digest("base64url")}`;
}
export function verifyFormToken(token: unknown, now = Date.now()) {
  const value = normalize(token, 300); const parts = value.split("."); if (parts.length !== 3 || !formSecret()) return false;
  const timestamp = Number(parts[0]); const signature = parts[2]; if (!Number.isInteger(timestamp) || Math.abs(now / 1000 - timestamp) > 1800) return false;
  const expected = createHmac("sha256", formSecret()).update(`${parts[0]}.${parts[1]}`).digest("base64url");
  return signature.length === expected.length && timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
}
export function requestOriginAllowed(request: Request) {
  const origin = request.headers.get("origin"); if (!origin) return true;
  try { const url = new URL(origin); const allowed = new Set([new URL(process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000").origin, `https://${process.env.STAGING_HOST || "staging.crescimentovertical.com"}`]); return allowed.has(url.origin); } catch { return false; }
}
export function normalizeUtm(value: unknown) { return normalize(value, MAX.utm).replace(/[^\p{L}\p{N}._~-]/gu, ""); }
export function validateLeadInput(input: Record<string, unknown>) {
  const allowed = new Set(["name","email","phone","company","serviceInterest","operationalContext","challenge","contactPreference","source","sourcePage","sourceContent","utmSource","utmMedium","utmCampaign","utmTerm","utmContent","referrer","consent","consentVersion","consentTextHash","idempotencyKey","formToken","startedAt","website"]);
  if (Object.keys(input).some((key) => !allowed.has(key))) return { error: "invalid" as const };
  const name=normalize(input.name,MAX.name), email=normalize(input.email,MAX.email).toLowerCase(), serviceInterest=normalize(input.serviceInterest,MAX.serviceInterest), challenge=normalize(input.challenge,MAX.challenge), preference=normalize(input.contactPreference,MAX.preference);
  if (!name || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || !serviceInterest || !challenge || !["email","phone","whatsapp"].includes(preference) || input.consent !== true || normalize(input.consentVersion,40)!==CONSENT_VERSION || normalize(input.consentTextHash,100)!==consentTextHash()) return { error: "invalid" as const };
  const startedAt=Number(input.startedAt); if (!Number.isFinite(startedAt) || Date.now()-startedAt < 2500 || Date.now()-startedAt > 86400000) return { error: "invalid" as const };
  if (normalize(input.website,100)) return { error: "spam" as const };
  return { value: { name,email,phone:normalize(input.phone,MAX.phone),company:normalize(input.company,MAX.company),serviceInterest,operationalContext:normalize(input.operationalContext,MAX.operationalContext),challenge,contactPreference:preference,source:normalize(input.source,MAX.source),sourcePage:normalize(input.sourcePage,MAX.page).replace(/[?#].*$/, ""),sourceContent:normalize(input.sourceContent,MAX.content),utmSource:normalizeUtm(input.utmSource),utmMedium:normalizeUtm(input.utmMedium),utmCampaign:normalizeUtm(input.utmCampaign),utmTerm:normalizeUtm(input.utmTerm),utmContent:normalizeUtm(input.utmContent),referrer:normalize(input.referrer,MAX.referrer).replace(/[?#].*$/, ""),idempotencyKey:idempotencyKey(input.idempotencyKey)} };
}
