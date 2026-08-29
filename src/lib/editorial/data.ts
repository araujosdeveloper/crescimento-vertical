import { unstable_cache } from "next/cache";
import { getPayload } from "payload";
import type { Where } from "payload";
import type { Payload } from "payload";
import type { User } from "@/payload-types";

import config from "@payload-config";

import { isPubliclyReadable, type WorkflowDocument } from "../editorial";
import {
  EDITORIAL_PAGE_SIZE,
  EDITORIAL_REVALIDATE_SECONDS,
  EDITORIAL_TAGS,
} from "./constants";
import {
  toArticleDetail,
  toArticleFeedEntry,
  toArticleListItem,
  toPublicAuthor,
  toPublicCategory,
  toPublicTag,
} from "./mappers";
import { computePagination } from "./pagination";
import { publicArticlesWhere, withPublicArticlesWhere } from "./query";
import type {
  ArticleDetail,
  ArticleFeedEntry,
  ArticleListItem,
  PaginatedArticles,
  PublicAuthor,
  PublicCategory,
  PublicTag,
  EditorialSearchParams,
} from "./types";

// ---------------------------------------------------------------------------
// Inicialização do Payload (Local API). Sem banco configurado, as funções
// retornam estados vazios em vez de quebrar (home e rotas continuam 200).
// ---------------------------------------------------------------------------

let payloadPromise: Promise<Payload | null> | null = null;

function getPayloadInstance(): Promise<Payload | null> {
  if (!process.env.DATABASE_URL) {
    return Promise.resolve(null);
  }
  if (!payloadPromise) {
    payloadPromise = getPayload({ config }).catch((error: unknown) => {
      const message = error instanceof Error ? error.message : String(error);
      console.error("[editorial] Payload indisponível:", message);
      payloadPromise = null;
      return null;
    });
  }
  return payloadPromise;
}

function emptyPaginated(page: number): PaginatedArticles {
  return {
    items: [],
    page,
    totalPages: 0,
    totalDocs: 0,
    hasNextPage: false,
    hasPrevPage: false,
  };
}

/** Defesa em profundidade: mesmo que o filtro falhe, só publicados passam. */
function filterPublic(docs: unknown[]): unknown[] {
  return docs.filter((doc) => isPubliclyReadable(doc as WorkflowDocument));
}

// ---------------------------------------------------------------------------
// Consultas públicas (cache + revalidação sob demanda).
// ---------------------------------------------------------------------------

const getPublishedArticlesCached = unstable_cache(
  async (requestedPage: number): Promise<PaginatedArticles> => {
    const payload = await getPayloadInstance();
    if (!payload) {
      return emptyPaginated(requestedPage);
    }
    const result = await payload.find({
      collection: "articles",
      where: publicArticlesWhere(),
      draft: false,
      overrideAccess: false,
      depth: 1,
      limit: EDITORIAL_PAGE_SIZE,
      page: requestedPage,
      sort: "-publishedAt",
    });
    return {
      items: filterPublic(result.docs).map(toArticleListItem),
      page: requestedPage,
      ...computePagination(result.totalDocs, requestedPage, EDITORIAL_PAGE_SIZE),
    };
  },
  ["editorial-list"],
  {
    revalidate: EDITORIAL_REVALIDATE_SECONDS,
    tags: [EDITORIAL_TAGS.articles],
  },
);

export function getPublishedArticles(page = 1): Promise<PaginatedArticles> {
  return getPublishedArticlesCached(page);
}

const getRecentArticlesCached = unstable_cache(
  async (requestedLimit: number): Promise<ArticleListItem[]> => {
    const payload = await getPayloadInstance();
    if (!payload) {
      return [];
    }
    const result = await payload.find({
      collection: "articles",
      where: publicArticlesWhere(),
      draft: false,
      overrideAccess: false,
      depth: 1,
      limit: requestedLimit,
      page: 1,
      sort: "-publishedAt",
    });
    return filterPublic(result.docs).map(toArticleListItem);
  },
  ["editorial-recent"],
  {
    revalidate: EDITORIAL_REVALIDATE_SECONDS,
    tags: [EDITORIAL_TAGS.articles],
  },
);

export function getRecentArticles(limit = 3): Promise<ArticleListItem[]> {
  return getRecentArticlesCached(limit);
}

const getArticleBySlugCached = unstable_cache(
  async (requestedSlug: string): Promise<ArticleDetail | null> => {
    const payload = await getPayloadInstance();
    if (!payload) {
      return null;
    }
    const result = await payload.find({
      collection: "articles",
      where: withPublicArticlesWhere({ slug: { equals: requestedSlug } }),
      draft: false,
      overrideAccess: false,
      depth: 2,
      limit: 1,
    });
    const doc = filterPublic(result.docs)[0];
    return doc ? toArticleDetail(doc) : null;
  },
  ["editorial-article"],
  {
    revalidate: EDITORIAL_REVALIDATE_SECONDS,
    tags: [EDITORIAL_TAGS.articles],
  },
);

export function getArticleBySlug(slug: string): Promise<ArticleDetail | null> {
  return getArticleBySlugCached(slug);
}

/** Consulta exclusiva de preview: sem cache, com usuário já autenticado. */
export async function getPreviewArticleBySlug(
  slug: string,
  user: User,
): Promise<ArticleDetail | null> {
  const payload = await getPayloadInstance();
  if (!payload) {
    return null;
  }
  const result = await payload.find({
    collection: "articles",
    where: { slug: { equals: slug } },
    draft: true,
    overrideAccess: false,
    user,
    depth: 2,
    limit: 1,
  });
  const doc = result.docs[0];
  return doc ? toArticleDetail(doc) : null;
}

const getAllPublishedArticlesCached = unstable_cache(
  async (): Promise<ArticleFeedEntry[]> => {
    const payload = await getPayloadInstance();
    if (!payload) {
      return [];
    }
    const result = await payload.find({
      collection: "articles",
      where: publicArticlesWhere(),
      draft: false,
      overrideAccess: false,
      depth: 0,
      limit: 500,
      page: 1,
      sort: "-publishedAt",
    });
    return filterPublic(result.docs).map(toArticleFeedEntry);
  },
  ["editorial-all-articles"],
  {
    revalidate: EDITORIAL_REVALIDATE_SECONDS,
    tags: [EDITORIAL_TAGS.articles],
  },
);

export function getAllPublishedArticles(): Promise<ArticleFeedEntry[]> {
  return getAllPublishedArticlesCached();
}

const getCategoryBySlugCached = unstable_cache(
  async (requestedSlug: string): Promise<PublicCategory | null> => {
    const payload = await getPayloadInstance();
    if (!payload) {
      return null;
    }
    const result = await payload.find({
      collection: "categories",
      where: {
        and: [{ slug: { equals: requestedSlug } }, { active: { equals: true } }],
      },
      draft: false,
      overrideAccess: false,
      depth: 0,
      limit: 1,
    });
    const doc = result.docs[0];
    return doc ? toPublicCategory(doc) : null;
  },
  ["editorial-category"],
  {
    revalidate: EDITORIAL_REVALIDATE_SECONDS,
    tags: [EDITORIAL_TAGS.categories],
  },
);

export function getCategoryBySlug(slug: string): Promise<PublicCategory | null> {
  return getCategoryBySlugCached(slug);
}

export interface CategoryArticles {
  category: PublicCategory;
  paginated: PaginatedArticles;
}

const getCategoryArticlesCached = unstable_cache(
  async (
    requestedSlug: string,
    requestedPage: number,
  ): Promise<CategoryArticles | null> => {
    const payload = await getPayloadInstance();
    if (!payload) {
      return null;
    }
    const categoryResult = await payload.find({
      collection: "categories",
      where: {
        and: [{ slug: { equals: requestedSlug } }, { active: { equals: true } }],
      },
      draft: false,
      overrideAccess: false,
      depth: 0,
      limit: 1,
    });
    const categoryDoc = categoryResult.docs[0];
    if (!categoryDoc) {
      return null;
    }
    const category = toPublicCategory(categoryDoc);
    if (!category) {
      return null;
    }

    const articleResult = await payload.find({
      collection: "articles",
      where: withPublicArticlesWhere({ category: { equals: categoryDoc.id } }),
      draft: false,
      overrideAccess: false,
      depth: 1,
      limit: EDITORIAL_PAGE_SIZE,
      page: requestedPage,
      sort: "-publishedAt",
    });

    return {
      category,
      paginated: {
        items: filterPublic(articleResult.docs).map(toArticleListItem),
        page: requestedPage,
        ...computePagination(
          articleResult.totalDocs,
          requestedPage,
          EDITORIAL_PAGE_SIZE,
        ),
      },
    };
  },
  ["editorial-category-articles"],
  {
    revalidate: EDITORIAL_REVALIDATE_SECONDS,
    tags: [EDITORIAL_TAGS.categories, EDITORIAL_TAGS.articles],
  },
);

export function getCategoryArticles(
  slug: string,
  page = 1,
): Promise<CategoryArticles | null> {
  return getCategoryArticlesCached(slug, page);
}

const getAuthorBySlugCached = unstable_cache(
  async (requestedSlug: string): Promise<PublicAuthor | null> => {
    const payload = await getPayloadInstance();
    if (!payload) {
      return null;
    }
    const result = await payload.find({
      collection: "authors",
      where: {
        and: [{ slug: { equals: requestedSlug } }, { active: { equals: true } }],
      },
      draft: false,
      overrideAccess: false,
      depth: 1,
      limit: 1,
    });
    const doc = result.docs[0];
    return doc ? toPublicAuthor(doc) : null;
  },
  ["editorial-author"],
  {
    revalidate: EDITORIAL_REVALIDATE_SECONDS,
    tags: [EDITORIAL_TAGS.authors],
  },
);

export function getAuthorBySlug(slug: string): Promise<PublicAuthor | null> {
  return getAuthorBySlugCached(slug);
}

export interface AuthorArticles {
  author: PublicAuthor;
  paginated: PaginatedArticles;
}

const getAuthorArticlesCached = unstable_cache(
  async (
    requestedSlug: string,
    requestedPage: number,
  ): Promise<AuthorArticles | null> => {
    const payload = await getPayloadInstance();
    if (!payload) {
      return null;
    }
    const authorResult = await payload.find({
      collection: "authors",
      where: {
        and: [{ slug: { equals: requestedSlug } }, { active: { equals: true } }],
      },
      draft: false,
      overrideAccess: false,
      depth: 1,
      limit: 1,
    });
    const authorDoc = authorResult.docs[0];
    if (!authorDoc) {
      return null;
    }
    const author = toPublicAuthor(authorDoc);
    if (!author) {
      return null;
    }

    const articleResult = await payload.find({
      collection: "articles",
      where: withPublicArticlesWhere({ author: { equals: authorDoc.id } }),
      draft: false,
      overrideAccess: false,
      depth: 1,
      limit: EDITORIAL_PAGE_SIZE,
      page: requestedPage,
      sort: "-publishedAt",
    });

    return {
      author,
      paginated: {
        items: filterPublic(articleResult.docs).map(toArticleListItem),
        page: requestedPage,
        ...computePagination(
          articleResult.totalDocs,
          requestedPage,
          EDITORIAL_PAGE_SIZE,
        ),
      },
    };
  },
  ["editorial-author-articles"],
  {
    revalidate: EDITORIAL_REVALIDATE_SECONDS,
    tags: [EDITORIAL_TAGS.authors, EDITORIAL_TAGS.articles],
  },
);

export function getAuthorArticles(
  slug: string,
  page = 1,
): Promise<AuthorArticles | null> {
  return getAuthorArticlesCached(slug, page);
}

const getPublishedCategoriesCached = unstable_cache(
  async (): Promise<PublicCategory[]> => {
    const payload = await getPayloadInstance();
    if (!payload) {
      return [];
    }
    const [categories, articles] = await Promise.all([
      payload.find({
        collection: "categories",
        where: { active: { equals: true } },
        draft: false,
        overrideAccess: false,
        depth: 0,
        limit: 500,
      }),
      payload.find({
        collection: "articles",
        where: publicArticlesWhere(),
        draft: false,
        overrideAccess: false,
        depth: 1,
        limit: 500,
      }),
    ]);

    const slugsWithContent = new Set<string>();
    for (const doc of filterPublic(articles.docs)) {
      const category = (doc as { category?: { slug?: unknown } }).category;
      if (category && typeof category.slug === "string") {
        slugsWithContent.add(category.slug);
      }
    }

    return categories.docs
      .filter((category) => {
        const slug = (category as { slug?: unknown }).slug;
        return typeof slug === "string" && slugsWithContent.has(slug);
      })
      .map(toPublicCategory)
      .filter((category): category is PublicCategory => category !== null);
  },
  ["editorial-published-categories"],
  {
    revalidate: EDITORIAL_REVALIDATE_SECONDS,
    tags: [EDITORIAL_TAGS.categories, EDITORIAL_TAGS.articles],
  },
);

export function getPublishedCategories(): Promise<PublicCategory[]> {
  return getPublishedCategoriesCached();
}

const getPublishedAuthorsCached = unstable_cache(
  async (): Promise<PublicAuthor[]> => {
    const payload = await getPayloadInstance();
    if (!payload) {
      return [];
    }
    const [authors, articles] = await Promise.all([
      payload.find({
        collection: "authors",
        where: { active: { equals: true } },
        draft: false,
        overrideAccess: false,
        depth: 0,
        limit: 500,
      }),
      payload.find({
        collection: "articles",
        where: publicArticlesWhere(),
        draft: false,
        overrideAccess: false,
        depth: 1,
        limit: 500,
      }),
    ]);

    const slugsWithContent = new Set<string>();
    for (const doc of filterPublic(articles.docs)) {
      const author = (doc as { author?: { slug?: unknown } }).author;
      if (author && typeof author.slug === "string") {
        slugsWithContent.add(author.slug);
      }
    }

    return authors.docs
      .filter((author) => {
        const slug = (author as { slug?: unknown }).slug;
        return typeof slug === "string" && slugsWithContent.has(slug);
      })
      .map(toPublicAuthor)
      .filter((author): author is PublicAuthor => author !== null);
  },
  ["editorial-published-authors"],
  {
    revalidate: EDITORIAL_REVALIDATE_SECONDS,
    tags: [EDITORIAL_TAGS.authors, EDITORIAL_TAGS.articles],
  },
);

export function getPublishedAuthors(): Promise<PublicAuthor[]> {
  return getPublishedAuthorsCached();
}

const getPublicTagsCached = unstable_cache(async (): Promise<PublicTag[]> => {
  const payload = await getPayloadInstance(); if (!payload) return [];
  const result = await payload.find({ collection: "tags", where: { active: { equals: true } }, draft: false, overrideAccess: false, limit: 500, sort: "order" });
  return result.docs.map(toPublicTag).filter((tag): tag is PublicTag => tag !== null);
}, ["editorial-tags"], { revalidate: EDITORIAL_REVALIDATE_SECONDS, tags: [EDITORIAL_TAGS.tags] });
export function getPublicTags(): Promise<PublicTag[]> { return getPublicTagsCached(); }

function normalizeSearch(value: unknown, max = 80): string { return typeof value === "string" ? value.trim().replace(/[<>]/g, "").slice(0, max) : ""; }
export async function searchPublicArticles(params: EditorialSearchParams = {}): Promise<PaginatedArticles> {
  const payload = await getPayloadInstance(); const page = Math.max(1, Math.floor(params.page ?? 1)); if (!payload) return emptyPaginated(page);
  const q = normalizeSearch(params.q); const type = normalizeSearch(params.type, 20); const category = normalizeSearch(params.category, 80); const tag = normalizeSearch(params.tag, 80);
  const extra: Where[] = [];
  if (q) extra.push({ or: [{ title: { contains: q } }, { excerpt: { contains: q } }] });
  if (type && ["news", "analysis", "guide", "tool", "comparison"].includes(type)) extra.push({ contentType: { equals: type } });
  if (category) extra.push({ "category.slug": { equals: category } });
  if (tag) extra.push({ "tagRelations.slug": { equals: tag } });
  const result = await payload.find({ collection: "articles", where: withPublicArticlesWhere(extra.length ? { and: extra } : {}), draft: false, overrideAccess: false, depth: 1, limit: EDITORIAL_PAGE_SIZE, page, sort: "-publishedAt" });
  return { items: filterPublic(result.docs).map(toArticleListItem), page, ...computePagination(result.totalDocs, page, EDITORIAL_PAGE_SIZE) };
}
