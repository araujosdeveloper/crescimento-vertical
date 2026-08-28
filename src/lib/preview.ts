import { slugify } from "./slugify";

export function normalizePreviewSlug(value: unknown): string | null {
  if (typeof value !== "string" || value.length > 200) {
    return null;
  }
  const normalized = slugify(value);
  return normalized && normalized === value ? normalized : null;
}

export function configuredSiteOrigin(): URL {
  const configured = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
  return new URL(configured);
}

export function previewURLForArticle(value: unknown): string | null {
  const slug = normalizePreviewSlug(value);
  if (!slug) {
    return null;
  }
  const url = new URL("/api/preview", configuredSiteOrigin());
  url.searchParams.set("slug", slug);
  return url.toString();
}

export function safeSameOriginPath(
  value: string | null,
  fallback: string,
  origin = configuredSiteOrigin(),
): string {
  if (!value || !value.startsWith("/")) {
    return fallback;
  }
  try {
    const candidate = new URL(value, origin);
    return candidate.origin === origin.origin
      ? `${candidate.pathname}${candidate.search}${candidate.hash}`
      : fallback;
  } catch {
    return fallback;
  }
}
