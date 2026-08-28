import type {
  ArticleDetail,
  ArticleFeedEntry,
  ArticleListItem,
  PublicAuthor,
  PublicAuthorCard,
  PublicCategory,
  PublicCategoryCard,
  SafeImage,
  PublicTag,
} from "./types";
import { CONTENT_TYPE_LABELS, CONTENT_TYPES, type ContentType } from "../editorial";

type UnknownRecord = Record<string, unknown>;

function asRecord(value: unknown): UnknownRecord | null {
  return value && typeof value === "object" ? (value as UnknownRecord) : null;
}

function asString(value: unknown): string | null {
  return typeof value === "string" && value.trim().length > 0 ? value : null;
}

function asNumber(value: unknown): number | undefined {
  return typeof value === "number" && Number.isFinite(value) ? value : undefined;
}

function preferredImageUrl(media: UnknownRecord): string | null {
  const sizes = asRecord(media.sizes);
  const preferred = ["feature", "card", "thumbnail"];
  for (const key of preferred) {
    const size = asRecord(sizes?.[key]);
    const url = asString(size?.url);
    if (url) {
      return url;
    }
  }
  return asString(media.url);
}

/**
 * Constrói uma imagem segura e estritamente pública. Exige `url` e `alt`
 * (mídia sem texto alternativo é ignorada, como exige o modelo editorial).
 */
export function toSafeImage(value: unknown): SafeImage | null {
  const media = asRecord(value);
  if (!media) {
    return null;
  }
  const url = preferredImageUrl(media);
  const alt = asString(media.alt);
  if (!url || !alt) {
    return null;
  }
  return {
    url,
    alt,
    width: asNumber(media.width),
    height: asNumber(media.height),
  };
}

export function toPublicAuthorCard(value: unknown): PublicAuthorCard | null {
  const author = asRecord(value);
  if (!author) {
    return null;
  }
  const name = asString(author.name);
  const slug = asString(author.slug);
  if (!name || !slug) {
    return null;
  }
  return { name, slug };
}

export function toPublicAuthor(value: unknown): PublicAuthor | null {
  const card = toPublicAuthorCard(value);
  if (!card) {
    return null;
  }
  const author = asRecord(value) ?? {};
  return {
    ...card,
    biography: asString(author.biography),
    photo: toSafeImage(author.photo),
  };
}

export function toPublicCategoryCard(value: unknown): PublicCategoryCard | null {
  const category = asRecord(value);
  if (!category) {
    return null;
  }
  const name = asString(category.name);
  const slug = asString(category.slug);
  if (!name || !slug) {
    return null;
  }
  return { name, slug };
}

export function toPublicCategory(value: unknown): PublicCategory | null {
  const card = toPublicCategoryCard(value);
  if (!card) {
    return null;
  }
  const category = asRecord(value) ?? {};
  return {
    ...card,
    description: asString(category.description),
  };
}
export function toPublicTag(value: unknown): PublicTag | null { const tag=asRecord(value); if(!tag) return null; const name=asString(tag.name), slug=asString(tag.slug); if(!name||!slug) return null; return {name,slug,description:asString(tag.description),indexable:tag.indexable===true}; }

export function toArticleListItem(value: unknown): ArticleListItem {
  const doc = asRecord(value) ?? {};
  const type = CONTENT_TYPES.includes(doc.contentType as ContentType) ? doc.contentType as ContentType : "news";
  return {
    title: asString(doc.title) ?? "",
    slug: asString(doc.slug) ?? "",
    summary: asString(doc.excerpt),
    publishedAt: asString(doc.publishedAt),
    featuredImage: toSafeImage(doc.heroImage),
    author: toPublicAuthorCard(doc.author),
    category: toPublicCategoryCard(doc.category),
    contentType: type,
    contentTypeLabel: CONTENT_TYPE_LABELS[type],
    publicReviewer: toPublicAuthorCard(doc.publicReviewer),
    readingTime: asNumber(doc.readingTime) ?? null,
    tags: (Array.isArray(doc.tagRelations) ? doc.tagRelations.map(toPublicTag) : []).filter((tag): tag is PublicTag => tag !== null),
  };
}

export function toArticleDetail(value: unknown): ArticleDetail {
  const item = toArticleListItem(value);
  const doc = asRecord(value) ?? {};
  const seo = asRecord(doc.seo);
  return {
    ...item,
    content: doc.content ?? null,
    updatedAt: asString(doc.updatedAt),
    seo: {
      metaTitle: asString(seo?.seoTitle),
      metaDescription: asString(seo?.seoDescription),
      canonicalUrl: asString(seo?.canonicalUrl),
    },
    businessImpact: asString(doc.businessImpact),
    publicCitations: Array.isArray(doc.publicCitations) ? doc.publicCitations.map((item) => { const x=asRecord(item) ?? {}; return { title: String(x.title ?? ""), publisher: String(x.publisher ?? ""), url: String(x.url ?? ""), author: asString(x.author), publishedAt: asString(x.publishedAt), accessedAt: String(x.accessedAt ?? ""), sourceType: String(x.sourceType ?? ""), isPrimary: x.isPrimary === true }; }).filter((x) => /^https:\/\//i.test(x.url)) : [],
    correctionHistory: Array.isArray(doc.correctionHistory) ? doc.correctionHistory.map((item) => { const x=asRecord(item) ?? {}; return { date: String(x.date ?? ""), summary: String(x.summary ?? ""), responsible: toPublicAuthorCard(x.responsible) }; }).filter((x) => x.summary) : [],
    relatedServices: Array.isArray(doc.relatedServices) ? doc.relatedServices.map((item) => { const x=asRecord(item) ?? {}; return { title: String(x.title ?? ""), slug: String(x.slug ?? "") }; }).filter((x) => x.slug) : [],
    relatedArticles: Array.isArray(doc.relatedArticles) ? doc.relatedArticles.map(toArticleListItem).filter((x) => x.slug !== item.slug) : [],
    aiDisclosure: asString(doc.aiDisclosure),
  };
}

export function toArticleFeedEntry(value: unknown): ArticleFeedEntry {
  const item = toArticleListItem(value);
  const doc = asRecord(value) ?? {};
  return {
    title: item.title,
    slug: item.slug,
    summary: item.summary,
    publishedAt: item.publishedAt,
    updatedAt: asString(doc.updatedAt),
  };
}
