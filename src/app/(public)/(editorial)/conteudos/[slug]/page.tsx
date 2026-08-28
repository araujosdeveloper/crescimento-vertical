import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { ArticleImage } from "@/components/editorial/article-image";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { EditorialCTA } from "@/components/editorial/editorial-cta";
import { EditorialContent } from "@/components/editorial/editorial-content";
import { JsonLd } from "@/components/editorial/json-ld";
import { getArticleBySlug } from "@/lib/editorial/data";
import { formatDate, formatDateTime } from "@/lib/editorial/format";
import {
  articleJsonLd,
  articleMetadata,
  breadcrumbJsonLd,
} from "@/lib/editorial/seo";
import type { BreadcrumbItem } from "@/types/public";
import Link from "next/link";
import { ContentTypeBadge } from "@/components/editorial/content-type-badge";
import { ReviewerByline } from "@/components/editorial/reviewer-byline";
import { SourceList } from "@/components/editorial/source-list";
import { BusinessImpact } from "@/components/editorial/business-impact";
import { CorrectionNotice } from "@/components/editorial/correction-notice";
import { RelatedContent } from "@/components/editorial/related-content";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const article = await getArticleBySlug(slug);
  if (!article) {
    return {};
  }
  return articleMetadata(article);
}

export default async function ArticlePage({ params }: PageProps) {
  const { slug } = await params;
  const article = await getArticleBySlug(slug);
  if (!article) {
    notFound();
  }

  const crumbs: BreadcrumbItem[] = [
    { name: "Início", href: "/" },
    { name: "Conteúdos", href: "/conteudos" },
    { name: article.title, href: `/conteudos/${article.slug}` },
  ];

  return (
    <>
      <article className="section-pad editorial-article">
        <div className="container-shell editorial-article-shell">
          <Breadcrumbs items={crumbs} />

          <header className="editorial-article-head">
            <ContentTypeBadge type={article.contentType} label={article.contentTypeLabel} />
            {article.category ? (
              <Link
                className="editorial-article-category"
                href={`/categorias/${article.category.slug}`}
              >
                {article.category.name}
              </Link>
            ) : null}
            <h1 className="editorial-article-title">{article.title}</h1>
            {article.summary ? (
              <p className="editorial-dek">{article.summary}</p>
            ) : null}
            <div className="editorial-meta">
              {article.author ? (
                <Link href={`/autores/${article.author.slug}`}>
                  {article.author.name}
                </Link>
              ) : null}
              <ReviewerByline reviewer={article.publicReviewer} />
              {article.publishedAt ? (
                <time dateTime={article.publishedAt}>
                  {formatDate(article.publishedAt)}
                </time>
              ) : null}
              {article.readingTime ? <span>{article.readingTime} min de leitura</span> : null}
            </div>
          </header>

          {article.featuredImage ? (
            <figure className="editorial-article-figure">
              <ArticleImage
                image={article.featuredImage}
                className="editorial-article-image"
                sizes="(max-width: 900px) 100vw, 900px"
              />
            </figure>
          ) : null}

          <div className="editorial-article-body">
            <EditorialContent content={article.content} />
          </div>

          <BusinessImpact text={article.businessImpact} />
          <SourceList citations={article.publicCitations} />
          <CorrectionNotice corrections={article.correctionHistory} />
          <RelatedContent items={article.relatedArticles} />

          <EditorialCTA />

          {article.updatedAt ? (
            <p className="editorial-updated">
              Última atualização:{" "}
              <time dateTime={article.updatedAt}>
                {formatDateTime(article.updatedAt)}
              </time>
            </p>
          ) : null}
        </div>
      </article>
      <JsonLd data={articleJsonLd(article)} />
      <JsonLd data={breadcrumbJsonLd(crumbs)} />
    </>
  );
}
