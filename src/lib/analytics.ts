export const GA_MEASUREMENT_ID = (
  process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID || ""
).trim();

export const ANALYTICS_CONSENT_VERSION = "2026-09-06.v1";
export const ANALYTICS_CONSENT_KEY = "cv_analytics_consent";

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}

/**
 * Dispara um evento GA4. No-op quando o usuário não consentiu ou o GA4 não
 * está habilitado (nunca envia PII).
 */
export function track(event: string, params?: Record<string, unknown>): void {
  if (typeof window !== "undefined" && typeof window.gtag === "function") {
    window.gtag("event", event, params);
  }
}
