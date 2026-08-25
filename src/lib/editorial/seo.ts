import type { Metadata } from "next";

import {
  SEO_META_DESCRIPTION_MAX,
  SEO_META_TITLE_MAX,
} from "./constants";
import type {
  ArticleDetail,
  Crumb,
  PublicAuthor,
  PublicCategory,
} from "./types";

const DEFAULT_SITE_URL = "https://crescimentovertical.com";
const SITE_NAME = "Crescimento Vertical";
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
  if (explicitUrl && /^https?:\/\//i.test(explicitUrl)) {
    return explicitUrl;
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
    : undefined;

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
      images: imageUrl
        ? [{ url: imageUrl, alt: article.featuredImage?.alt }]
        : undefined,
    },
    twitter: {
      card: imageUrl ? "summary_large_image" : "summary",
      title,
      description,
      images: imageUrl ? [imageUrl] : undefined,
    },
  };
}

export function categoryMetadata(category: PublicCategory): Metadata {
  const title = truncateMetaTitle(`${category.name} | ${SITE_NAME}`);
  const description = truncateMetaDescription(
    category.description ||
      `Conteúdos de ${category.name} sobre IA, automação e tecnologia para negócios.`,
  );
  const canonical = resolveCanonical(categoryCanonicalPath(category.slug));

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

export function authorMetadata(author: PublicAuthor): Metadata {
  const title = truncateMetaTitle(`${author.name} | ${SITE_NAME}`);
  const description = truncateMetaDescription(
    author.biography ||
      `Perfil público de ${author.name} na Crescimento Vertical.`,
  );
  const canonical = resolveCanonical(authorCanonicalPath(author.slug));

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

export function hubMetadata(): Metadata {
  return {
    title: DEFAULT_TITLE,
    description: DEFAULT_DESCRIPTION,
    alternates: { canonical: absoluteUrl("/conteudos") },
    robots: robotsMetadata(),
    openGraph: {
      title: DEFAULT_TITLE,
      description: DEFAULT_DESCRIPTION,
      url: absoluteUrl("/conteudos"),
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
    "@type": "Article",
    headline: article.title,
    description: article.summary ?? undefined,
    image: article.featuredImage?.url
      ? [absoluteUrl(article.featuredImage.url)]
      : undefined,
    datePublished: article.publishedAt ?? undefined,
    dateModified: article.updatedAt ?? undefined,
    mainEntityOfPage: absoluteUrl(articleCanonicalPath(article.slug)),
    author: article.author
      ? {
          "@type": "Person",
          name: article.author.name,
          url: absoluteUrl(authorCanonicalPath(article.author.slug)),
        }
      : undefined,
    publisher: {
      "@type": "Organization",
      name: SITE_NAME,
    },
  };
}

export function breadcrumbJsonLd(items: Crumb[]): Record<string, unknown> {
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
