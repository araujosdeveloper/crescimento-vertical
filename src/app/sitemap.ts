import type { MetadataRoute } from "next";

import {
  getAllPublishedArticles,
  getPublishedAuthors,
  getPublishedCategories,
} from "@/lib/editorial/data";
import { absoluteUrl, isNoindexEnabled } from "@/lib/editorial/seo";

export const revalidate = 0;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  if (isNoindexEnabled()) {
    return [];
  }

  const [articles, categories, authors] = await Promise.all([
    getAllPublishedArticles(),
    getPublishedCategories(),
    getPublishedAuthors(),
  ]);

  const entries: MetadataRoute.Sitemap = [
    {
      url: absoluteUrl("/"),
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: absoluteUrl("/conteudos"),
      lastModified: new Date(),
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
  ];

  return entries;
}
