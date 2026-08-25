/**
 * Constantes da camada pública editorial (Fase 2B).
 *
 * Valores centrais reutilizados pela camada de dados, pelas rotas e pela
 * estratégia de cache/revalidação. Nenhum segredo ou valor de ambiente vive
 * aqui.
 */

/** Quantidade de artigos por página no hub editorial (/conteudos). */
export const EDITORIAL_PAGE_SIZE = 12;

/** Quantidade de artigos recentes exibidos na home. */
export const HOME_ARTICLE_COUNT = 3;

/** TTL padrão (segundos) das consultas editoriais públicas em cache. */
export const EDITORIAL_REVALIDATE_SECONDS = 300;

/** Tamanho máximo recomendado (caracteres) para o título de SEO. */
export const SEO_META_TITLE_MAX = 60;

/** Tamanho máximo recomendado (caracteres) para a descrição de SEO. */
export const SEO_META_DESCRIPTION_MAX = 160;

/**
 * Tags de revalidação usadas pelo `unstable_cache`. A publicação, atualização
 * ou retirada de conteúdo editorial invalida todas elas.
 */
export const EDITORIAL_TAGS = {
  articles: "editorial-articles",
  authors: "editorial-authors",
  categories: "editorial-categories",
} as const;

/** Caminhos públicos revalidados após qualquer mudança editorial. */
export const EDITORIAL_REVALIDATE_PATHS = [
  "/",
  "/conteudos",
  "/feed.xml",
  "/sitemap.xml",
] as const;
