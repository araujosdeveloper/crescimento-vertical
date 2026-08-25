import Link from "next/link";

import { formatDate } from "@/lib/editorial/format";
import type { ArticleListItem } from "@/lib/editorial/types";
import { ArticleImage } from "./article-image";

export function ArticleCard({ article }: { article: ArticleListItem }) {
  return (
    <article className="article-card">
      <Link
        className="article-card-link"
        href={`/conteudos/${article.slug}`}
        aria-label={`Ler artigo: ${article.title}`}
      >
        <div className="article-card-media">
          {article.featuredImage ? (
            <ArticleImage
              image={article.featuredImage}
              className="article-card-image"
              sizes="(max-width: 640px) 100vw, (max-width: 900px) 50vw, 33vw"
            />
          ) : (
            <div className="article-card-placeholder" aria-hidden="true" />
          )}
        </div>
        <div className="article-card-body">
          {article.category ? (
            <span className="article-card-category">{article.category.name}</span>
          ) : null}
          <h3 className="article-card-title">{article.title}</h3>
          {article.summary ? (
            <p className="article-card-summary">{article.summary}</p>
          ) : null}
          <div className="article-card-meta">
            {article.author ? <span>{article.author.name}</span> : null}
            {article.publishedAt ? (
              <time dateTime={article.publishedAt}>
                {formatDate(article.publishedAt)}
              </time>
            ) : null}
          </div>
        </div>
      </Link>
    </article>
  );
}
