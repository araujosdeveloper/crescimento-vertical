import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { ArticleCard } from "@/components/editorial/article-card";
import { ArticleImage } from "@/components/editorial/article-image";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { EmptyState } from "@/components/ui/interface-state";
import { JsonLd } from "@/components/editorial/json-ld";
import { Pagination } from "@/components/editorial/pagination";
import { getAuthorArticles } from "@/lib/editorial/data";
import { normalizePage } from "@/lib/editorial/pagination";
import { authorMetadata, breadcrumbJsonLd, profilePageJsonLd } from "@/lib/editorial/seo";
import type { BreadcrumbItem } from "@/types/public";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ page?: string }>;
}

export async function generateMetadata({ params, searchParams }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const page = normalizePage((await searchParams).page);
  const data = await getAuthorArticles(slug);
  if (!data) {
    return {};
  }
  return authorMetadata(data.author, page);
}

export default async function AuthorPage({ params, searchParams }: PageProps) {
  const { slug } = await params;
  const sp = await searchParams;
  const page = normalizePage(sp.page);
  const data = await getAuthorArticles(slug, page);
  if (!data) {
    notFound();
  }

  const { author, paginated } = data;
  const crumbs: BreadcrumbItem[] = [
    { name: "Início", href: "/" },
    { name: "Conteúdos", href: "/conteudos" },
    { name: author.name, href: `/autores/${author.slug}` },
  ];

  return (
    <>
      <section className="section-pad editorial-page">
        <div className="container-shell">
          <Breadcrumbs items={crumbs} />
          <header className="editorial-author-head">
            {author.photo ? (
              <div className="editorial-author-photo">
                <ArticleImage image={author.photo} sizes="96px" />
              </div>
            ) : null}
            <div>
              <p className="section-kicker">Autor</p>
              <h1 className="section-title">{author.name}</h1>
              {author.biography ? (
                <p className="section-copy">{author.biography}</p>
              ) : null}
            </div>
          </header>

          {paginated.items.length === 0 ? (
            <EmptyState
              title="Nenhum conteúdo publicado por este autor"
              description="Em breve publicaremos conteúdos aqui."
            />
          ) : (
            <>
              <div className="editorial-grid">
                {paginated.items.map((article) => (
                  <ArticleCard key={article.slug} article={article} />
                ))}
              </div>
              <Pagination
                page={paginated.page}
                totalPages={paginated.totalPages}
                hasNextPage={paginated.hasNextPage}
                hasPrevPage={paginated.hasPrevPage}
                basePath={`/autores/${slug}`}
              />
            </>
          )}
        </div>
      </section>
      <JsonLd data={breadcrumbJsonLd(crumbs)} />
      <JsonLd data={profilePageJsonLd(author)} />
    </>
  );
}
