/**
 * DTOs públicos da camada editorial.
 *
 * Estes tipos são a ÚNICA fronteira entre o Payload e os componentes públicos.
 * Nunca envie o documento Payload completo para o cliente. Nenhum campo de
 * autenticação, auditoria, workflow interno, e-mail ou permissão deve existir
 * aqui.
 */

export interface SafeImage {
  url: string;
  alt: string;
  width?: number;
  height?: number;
}

export interface PublicAuthorCard {
  name: string;
  slug: string;
}

export interface PublicCategoryCard {
  name: string;
  slug: string;
}

export interface PublicAuthor extends PublicAuthorCard {
  biography: string | null;
  photo: SafeImage | null;
}

export interface PublicCategory extends PublicCategoryCard {
  description: string | null;
}

export interface ArticleListItem {
  title: string;
  slug: string;
  summary: string | null;
  publishedAt: string | null;
  featuredImage: SafeImage | null;
  author: PublicAuthorCard | null;
  category: PublicCategoryCard | null;
}

export interface PublicSeo {
  metaTitle: string | null;
  metaDescription: string | null;
  canonicalUrl: string | null;
}

export interface ArticleDetail extends ArticleListItem {
  content: unknown;
  updatedAt: string | null;
  seo: PublicSeo;
}

/** Entrada leve usada pelo sitemap e pelo feed RSS. */
export interface ArticleFeedEntry {
  title: string;
  slug: string;
  summary: string | null;
  publishedAt: string | null;
  updatedAt: string | null;
}

export interface PaginatedArticles {
  items: ArticleListItem[];
  page: number;
  totalPages: number;
  totalDocs: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export interface Crumb {
  name: string;
  href: string;
}
