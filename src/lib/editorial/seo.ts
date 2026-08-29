import type { Metadata } from "next";

import {
  SEO_META_DESCRIPTION_MAX,
  SEO_META_TITLE_MAX,
} from "./constants";
import type {
  ArticleDetail,
  PublicAuthor,
  PublicCategory,
} from "./types";
import type { BreadcrumbItem } from "@/types/public";

const DEFAULT_SITE_URL = "https://crescimentovertical.com";
const SITE_NAME = "Crescimento Vertical";
export const ORGANIZATION_ID = `${DEFAULT_SITE_URL}/#organization`;
export const WEBSITE_ID = `${DEFAULT_SITE_URL}/#website`;
export const SOCIAL_IMAGE_PATH = "/hero-final-crescimento-vertical.webp";
const DEFAULT_TITLE =
  "Crescimento Vertical | Estratégia Digital, Automação e Performance";
const DEFAULT_DESCRIPTION =
  "Sites, automações, tráfego pago e estruturas digitais para empresas que querem crescer com previsibilidade.";

function envSiteUrl(): string {
  const configured = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  return configured || DEFAULT_SITE_URL;
}

export function isNoindexEnabled(): boolean {
  return process.env.SITE_NOINDEX === "true";
}

export function absoluteUrl(path: string): string {
  const base = envSiteUrl().replace(/\/+$/, "");
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return `${base}${normalized}`;
}

/** Canonical explícito (se https) ou o caminho canônico padrão. */
export function resolveCanonical(
  defaultPath: string,
  explicitUrl?: string | null,
): string {
  if (explicitUrl) {
    try {
      const candidate = new URL(explicitUrl, DEFAULT_SITE_URL);
      if (candidate.protocol === "https:" && candidate.hostname === "crescimentovertical.com") {
        candidate.search = "";
        candidate.hash = "";
        return candidate.toString().replace(/\/$/, candidate.pathname === "/" ? "/" : "");
      }
    } catch { /* usa o caminho canônico seguro */ }
  }
  return absoluteUrl(defaultPath);
}

export function truncateMetaTitle(value: string): string {
  const text = value.trim();
  if (text.length <= SEO_META_TITLE_MAX) {
    return text;
  }
  return `${text.slice(0, SEO_META_TITLE_MAX - 1).trimEnd()}…`;
}

export function truncateMetaDescription(value: string): string {
  const text = value.trim();
  if (text.length <= SEO_META_DESCRIPTION_MAX) {
    return text;
  }
  return `${text.slice(0, SEO_META_DESCRIPTION_MAX - 1).trimEnd()}…`;
}

export function robotsMetadata(): NonNullable<Metadata["robots"]> {
  if (isNoindexEnabled()) {
    return {
      index: false,
      follow: false,
      noarchive: true,
      nosnippet: true,
      nocache: true,
      googleBot: {
        index: false,
        follow: false,
        noarchive: true,
        nosnippet: true,
        nocache: true,
      },
    };
  }
  return { index: true, follow: true };
}

export function noindexRobotsMetadata(): NonNullable<Metadata["robots"]> {
  return isNoindexEnabled()
    ? robotsMetadata()
    : { index: false, follow: true, noarchive: true };
}

export function paginatedCanonical(path: string, page = 1): string {
  return page > 1 ? `${absoluteUrl(path)}?page=${page}` : absoluteUrl(path);
}

export function articleCanonicalPath(slug: string): string {
  return `/conteudos/${slug}`;
}

export function categoryCanonicalPath(slug: string): string {
  return `/categorias/${slug}`;
}

export function authorCanonicalPath(slug: string): string {
  return `/autores/${slug}`;
}

export function articleMetadata(article: ArticleDetail): Metadata {
  const title = truncateMetaTitle(
    (article.seo.metaTitle || article.title).trim(),
  );
  const description = truncateMetaDescription(
    (article.seo.metaDescription || article.summary || "").trim(),
  );
  const canonical = resolveCanonical(
    articleCanonicalPath(article.slug),
    article.seo.canonicalUrl,
  );
  const imageUrl = article.featuredImage?.url
    ? absoluteUrl(article.featuredImage.url)
    : absoluteUrl(SOCIAL_IMAGE_PATH);

  return {
    title,
    description,
    alternates: { canonical },
    robots: robotsMetadata(),
    openGraph: {
      title,
      description,
      url: canonical,
      type: "article",
      locale: "pt_BR",
      siteName: SITE_NAME,
      publishedTime: article.publishedAt ?? undefined,
      modifiedTime: article.updatedAt ?? undefined,
      images: [{ url: imageUrl, alt: article.featuredImage?.alt || SITE_NAME }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [imageUrl],
    },
  };
}

export function categoryMetadata(category: PublicCategory, page = 1): Metadata {
  const title = truncateMetaTitle(`${category.name} | ${SITE_NAME}`);
  const description = truncateMetaDescription(
    category.description ||
      `Conteúdos de ${category.name} sobre IA, automação e tecnologia para negócios.`,
  );
  const canonical = paginatedCanonical(categoryCanonicalPath(category.slug), page);

  return {
    title,
    description,
    alternates: { canonical },
    robots: robotsMetadata(),
    openGraph: {
      title,
      description,
      url: canonical,
      type: "website",
      locale: "pt_BR",
      siteName: SITE_NAME,
    },
    twitter: { card: "summary", title, description },
  };
}

export function authorMetadata(author: PublicAuthor, page = 1): Metadata {
  const title = truncateMetaTitle(`${author.name} | ${SITE_NAME}`);
  const description = truncateMetaDescription(
    author.biography ||
      `Perfil público de ${author.name} na Crescimento Vertical.`,
  );
  const canonical = paginatedCanonical(authorCanonicalPath(author.slug), page);

  return {
    title,
    description,
    alternates: { canonical },
    robots: robotsMetadata(),
    openGraph: {
      title,
      description,
      url: canonical,
      type: "profile",
      locale: "pt_BR",
      siteName: SITE_NAME,
    },
    twitter: { card: "summary", title, description },
  };
}

export function hubMetadata(page = 1, filtered = false): Metadata {
  const canonical = paginatedCanonical("/conteudos", page);
  return {
    title: DEFAULT_TITLE,
    description: DEFAULT_DESCRIPTION,
    alternates: { canonical },
    robots: filtered ? noindexRobotsMetadata() : robotsMetadata(),
    openGraph: {
      title: DEFAULT_TITLE,
      description: DEFAULT_DESCRIPTION,
      url: canonical,
      type: "website",
      locale: "pt_BR",
      siteName: SITE_NAME,
    },
    twitter: { card: "summary", title: DEFAULT_TITLE, description: DEFAULT_DESCRIPTION },
  };
}

export function articleJsonLd(article: ArticleDetail): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": article.contentType === "news" ? "NewsArticle" : "Article",
    "@id": `${absoluteUrl(articleCanonicalPath(article.slug))}#article`,
    headline: article.title,
    description: article.summary ?? undefined,
    image: article.featuredImage?.url
      ? [absoluteUrl(article.featuredImage.url)]
      : undefined,
    datePublished: article.publishedAt ?? undefined,
    dateModified: article.updatedAt ?? undefined,
    mainEntityOfPage: { "@type": "WebPage", "@id": absoluteUrl(articleCanonicalPath(article.slug)) },
    author: article.author
      ? {
          "@type": "Person",
          name: article.author.name,
          url: absoluteUrl(authorCanonicalPath(article.author.slug)),
        }
      : undefined,
    publisher: {
      "@id": ORGANIZATION_ID,
    },
  };
}

export function organizationJsonLd(): Record<string, unknown> {
  return { "@context": "https://schema.org", "@type": "Organization", "@id": ORGANIZATION_ID, name: SITE_NAME, url: DEFAULT_SITE_URL, logo: absoluteUrl("/logo-crescimento-vertical.png") };
}

export function websiteJsonLd(): Record<string, unknown> {
  return { "@context": "https://schema.org", "@type": "WebSite", "@id": WEBSITE_ID, name: SITE_NAME, url: DEFAULT_SITE_URL, publisher: { "@id": ORGANIZATION_ID }, inLanguage: "pt-BR" };
}

export function profilePageJsonLd(author: PublicAuthor): Record<string, unknown> {
  const url = absoluteUrl(authorCanonicalPath(author.slug));
  return { "@context": "https://schema.org", "@type": "ProfilePage", "@id": `${url}#profile`, url, mainEntity: { "@type": "Person", "@id": `${url}#person`, name: author.name, description: author.biography || undefined, image: author.photo?.url ? absoluteUrl(author.photo.url) : undefined } };
}

export function breadcrumbJsonLd(items: BreadcrumbItem[]): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: absoluteUrl(item.href),
    })),
  };
}
