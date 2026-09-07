import { createHash } from "node:crypto";

import {
  issueFormToken,
  normalize,
  requestOriginAllowed,
  verifyFormToken,
} from "./lead-intake";

export const NEWSLETTER_CONSENT_VERSION = "2026-09-07.v1";
export const NEWSLETTER_CONSENT_TEXT =
  "Autorizo o envio de conteúdos e comunicações da Crescimento Vertical para este e-mail, podendo cancelar a qualquer momento.";

export function newsletterConsentTextHash(): string {
  return createHash("sha256").update(NEWSLETTER_CONSENT_TEXT).digest("hex");
}

export function validateNewsletterInput(input: Record<string, unknown>) {
  const allowed = new Set([
    "email",
    "consent",
    "consentVersion",
    "consentTextHash",
    "idempotencyKey",
    "formToken",
    "startedAt",
    "website",
  ]);
  if (Object.keys(input).some((key) => !allowed.has(key))) {
    return { error: "invalid" as const };
  }
  const email = normalize(input.email, 180).toLowerCase();
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { error: "invalid" as const };
  }
  if (
    input.consent !== true ||
    normalize(input.consentVersion, 40) !== NEWSLETTER_CONSENT_VERSION ||
    normalize(input.consentTextHash, 100) !== newsletterConsentTextHash()
  ) {
    return { error: "invalid" as const };
  }
  const startedAt = Number(input.startedAt);
  if (!Number.isFinite(startedAt) || Date.now() - startedAt < 2500 || Date.now() - startedAt > 86400000) {
    return { error: "invalid" as const };
  }
  if (normalize(input.website, 100)) {
    return { error: "spam" as const };
  }
  const idempotencyKey = normalize(input.idempotencyKey, 100).toLowerCase();
  if (!idempotencyKey || idempotencyKey.length < 16) {
    return { error: "invalid" as const };
  }
  return {
    value: {
      email,
      idempotencyKey,
      consentVersion: NEWSLETTER_CONSENT_VERSION,
      consentTextHash: newsletterConsentTextHash(),
    },
  };
}

export { issueFormToken, requestOriginAllowed, verifyFormToken };
