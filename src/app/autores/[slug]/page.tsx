import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { ArticleCard } from "@/components/editorial/article-card";
import { ArticleImage } from "@/components/editorial/article-image";
import { Breadcrumbs } from "@/components/editorial/breadcrumbs";
import { EmptyState } from "@/components/editorial/empty-state";
import { JsonLd } from "@/components/editorial/json-ld";
import { Pagination } from "@/components/editorial/pagination";
import { getAuthorArticles } from "@/lib/editorial/data";
import { normalizePage } from "@/lib/editorial/pagination";
import { authorMetadata, breadcrumbJsonLd } from "@/lib/editorial/seo";
import type { Crumb } from "@/lib/editorial/types";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ page?: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const data = await getAuthorArticles(slug);
  if (!data) {
    return {};
  }
  return authorMetadata(data.author);
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
  const crumbs: Crumb[] = [
    { name: "Início", href: "/" },
    { name: "Conteúdos", href: "/conteudos" },
    { name: author.name, href: `/autores/${author.slug}` },
  ];

  return (
    <main className="overflow-hidden">
      <Header />
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
      <Footer />
      <JsonLd data={breadcrumbJsonLd(crumbs)} />
    </main>
  );
}
