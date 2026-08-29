import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getArticleBySlug } from "@/lib/editorial/data";
import { articleMetadata } from "@/lib/editorial/seo";
import { ArticlePage } from "@/components/editorial/typed-article-view";
export async function typedMetadata(slug: string): Promise<Metadata> { const article = await getArticleBySlug(slug); return article ? articleMetadata(article) : {}; }
export async function typedArticle(slug: string) { const article = await getArticleBySlug(slug); if (!article) notFound(); return <ArticlePage article={article} />; }
