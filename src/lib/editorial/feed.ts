import type { ArticleFeedEntry } from "./types";
import { absoluteUrl } from "./seo";

const FEED_TITLE = "Crescimento Vertical";
const FEED_DESCRIPTION =
  "Artigos, análises e guias sobre inteligência artificial, automação e tecnologia para empresas que querem crescer com previsibilidade.";

export function escapeXml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

/**
 * Gera o RSS 2.0 somente com artigos já filtrados como publicados. A filtragem
 * por status/draft/agendamento acontece na camada de dados; esta função apenas
 * serializa as entradas recebidas.
 */
export function buildFeedXml(articles: ArticleFeedEntry[]): string {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim() ||
    "https://crescimentovertical.com";

  const items = articles
    .filter((article) => Boolean(article.publishedAt))
    .map((article) => {
      const link = absoluteUrl(`/conteudos/${article.slug}`);
      const pubDate = new Date(article.publishedAt as string).toUTCString();
      const parts = [
        "<item>",
        `<title>${escapeXml(article.title)}</title>`,
        `<link>${escapeXml(link)}</link>`,
        `<guid isPermaLink="true">${escapeXml(link)}</guid>`,
        `<pubDate>${escapeXml(pubDate)}</pubDate>`,
        article.summary
          ? `<description>${escapeXml(article.summary)}</description>`
          : "",
        "</item>",
      ];
      return parts.filter(Boolean).join("");
    })
    .join("");

  const lastBuildDate = new Date().toUTCString();

  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<rss version="2.0">',
    "<channel>",
    `<title>${escapeXml(FEED_TITLE)}</title>`,
    `<link>${escapeXml(siteUrl)}</link>`,
    `<description>${escapeXml(FEED_DESCRIPTION)}</description>`,
    "<language>pt-BR</language>",
    `<lastBuildDate>${escapeXml(lastBuildDate)}</lastBuildDate>`,
    items,
    "</channel>",
    "</rss>",
  ].join("");
}
