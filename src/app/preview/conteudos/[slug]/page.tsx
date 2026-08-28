import type { Metadata } from "next";
import { draftMode, headers } from "next/headers";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getPayload } from "payload";

import config from "@payload-config";
import { ArticleImage } from "@/components/editorial/article-image";
import { EditorialContent } from "@/components/editorial/editorial-content";
import { getPreviewArticleBySlug } from "@/lib/editorial/data";
import { formatDateTime } from "@/lib/editorial/format";
import { normalizePreviewSlug } from "@/lib/preview";
import { isEditorialUser } from "@/lib/roles";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata: Metadata = {
  title: "Preview editorial",
  robots: { index: false, follow: false, nocache: true },
};

interface PageProps {
  params: Promise<{ slug: string }>;
}

export default async function PreviewArticlePage({ params }: PageProps) {
  const mode = await draftMode();
  const slug = normalizePreviewSlug((await params).slug);
  if (!mode.isEnabled || !slug) {
    notFound();
  }

  const payload = await getPayload({ config });
  const { user } = await payload.auth({ headers: await headers() });
  if (!isEditorialUser(user)) {
    notFound();
  }

  const article = await getPreviewArticleBySlug(slug, user);
  if (!article) {
    notFound();
  }

  return (
    <article className="section-pad editorial-article">
      <div className="container-shell editorial-article-shell">
        <p role="status">
          Preview editorial — não indexável e indisponível ao público. {" "}
          <Link href="/api/preview/exit">Encerrar preview</Link>
        </p>
        <header className="editorial-article-head">
          <h1 className="editorial-article-title">{article.title}</h1>
          {article.summary ? <p className="editorial-dek">{article.summary}</p> : null}
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
        {article.updatedAt ? (
          <p className="editorial-updated">
            Última atualização: {" "}
            <time dateTime={article.updatedAt}>{formatDateTime(article.updatedAt)}</time>
          </p>
        ) : null}
      </div>
    </article>
  );
}
