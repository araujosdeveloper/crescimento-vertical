/**
 * Utilitários de segurança para links.
 *
 * Todo link externo renderizado na interface pública deve passar por estas
 * verificações: somente http/https (ou mailto/tel) são permitidos; protocolos
 * como `javascript:` ou `data:` são recusados.
 */

export function isSafeExternalUrl(value: unknown): value is string {
  if (typeof value !== "string" || value.trim().length === 0) {
    return false;
  }
  const candidate = value.trim();
  if (candidate.startsWith("mailto:") || candidate.startsWith("tel:")) {
    return true;
  }
  try {
    const url = new URL(candidate);
    return url.protocol === "https:" || url.protocol === "http:";
  } catch {
    return false;
  }
}

export interface ExternalLinkProps {
  target?: "_blank";
  rel?: string;
}

/**
 * Devolve `target`/`rel` apenas para links externos seguros. Links internos
 * (mesmo host) ou inválidos não recebem `target`/`rel`.
 */
export function safeExternalLinkProps(href: string): ExternalLinkProps {
  if (!isSafeExternalUrl(href)) {
    return {};
  }

  let host: string | null = null;
  try {
    host = new URL(href).host;
  } catch {
    host = null;
  }

  let siteHost: string | null = null;
  try {
    siteHost = new URL(
      process.env.NEXT_PUBLIC_SITE_URL || "https://crescimentovertical.com",
    ).host;
  } catch {
    siteHost = null;
  }

  if (host === null || host === siteHost) {
    return {};
  }

  return { target: "_blank", rel: "noopener noreferrer" };
}

/** Sanitiza uma URL de conteúdo editorial, garantindo protocolo seguro. */
export function sanitizeContentUrl(value: unknown): string {
  if (typeof value !== "string") {
    return "#";
  }
  if (value.startsWith("mailto:") || value.startsWith("tel:")) {
    return value;
  }
  return isSafeExternalUrl(value) ? value : "#";
}
