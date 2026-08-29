import type { MetadataRoute } from "next";

import {
  getAllPublishedArticles,
  getPublishedAuthors,
  getPublishedCategories,
  getPublicTags,
} from "@/lib/editorial/data";
import { getPublicCases, getPublicServices } from "@/lib/commercial/data";
import { absoluteUrl, isNoindexEnabled } from "@/lib/editorial/seo";

export const revalidate = 300;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  if (isNoindexEnabled()) {
    return [];
  }

  const [articles, categories, authors, tags, services, cases] = await Promise.all([
    getAllPublishedArticles(),
    getPublishedCategories(),
    getPublishedAuthors(),
    getPublicTags(),
    getPublicServices(),
    getPublicCases(),
  ]);

  const entries: MetadataRoute.Sitemap = [
    {
      url: absoluteUrl("/"),
      changeFrequency: "weekly",
      priority: 1,
    },
    ...(["news:noticias", "analysis:analises", "guide:guias", "tool:ferramentas", "comparison:comparativos"] as const).filter((entry) => articles.some((article) => article.contentType === entry.split(":")[0])).map((entry) => ({ url: absoluteUrl(`/${entry.split(":")[1]}`), changeFrequency: "daily" as const, priority: 0.6 })),
    {
      url: absoluteUrl("/conteudos"),
      changeFrequency: "daily",
      priority: 0.8,
    },
    ...articles.map((article) => ({
      url: absoluteUrl(`/conteudos/${article.slug}`),
      lastModified: article.updatedAt
        ? new Date(article.updatedAt)
        : article.publishedAt
          ? new Date(article.publishedAt)
          : new Date(),
      changeFrequency: "monthly" as const,
      priority: 0.6,
    })),
    ...categories.map((category) => ({
      url: absoluteUrl(`/categorias/${category.slug}`),
      changeFrequency: "weekly" as const,
      priority: 0.5,
    })),
    ...authors.map((author) => ({
      url: absoluteUrl(`/autores/${author.slug}`),
      changeFrequency: "weekly" as const,
      priority: 0.5,
    })),
    ...tags.filter((tag) => tag.indexable).map((tag) => ({ url: absoluteUrl(`/tags/${tag.slug}`), changeFrequency: "weekly" as const, priority: 0.4 })),
    ...services.filter((service) => !service.seo.noindex).map((service) => ({ url: absoluteUrl(`/solucoes/${service.slug}`), changeFrequency: "monthly" as const, priority: 0.7 })),
    ...cases.filter((item) => !item.seo.noindex).map((item) => ({ url: absoluteUrl(`/cases/${item.slug}`), changeFrequency: "monthly" as const, priority: 0.5 })),
    ...(cases.length ? [{ url: absoluteUrl("/cases"), changeFrequency: "monthly" as const, priority: 0.5 }] : []),
    ...["solucoes", "diagnostico", "sobre", "contato", "politica-editorial", "correcoes", "privacidade", "termos", "cookies"].map((slug) => ({ url: absoluteUrl(`/${slug}`), changeFrequency: "monthly" as const, priority: 0.5 })),
  ];

  return entries;
}
