import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { ArticleCard } from "@/components/editorial/article-card";
import { Breadcrumbs } from "@/components/editorial/breadcrumbs";
import { EmptyState } from "@/components/editorial/empty-state";
import { JsonLd } from "@/components/editorial/json-ld";
import { Pagination } from "@/components/editorial/pagination";
import { getCategoryArticles } from "@/lib/editorial/data";
import { normalizePage } from "@/lib/editorial/pagination";
import { breadcrumbJsonLd, categoryMetadata } from "@/lib/editorial/seo";
import type { Crumb } from "@/lib/editorial/types";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ page?: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const data = await getCategoryArticles(slug);
  if (!data) {
    return {};
  }
  return categoryMetadata(data.category);
}

export default async function CategoryPage({ params, searchParams }: PageProps) {
  const { slug } = await params;
  const sp = await searchParams;
  const page = normalizePage(sp.page);
  const data = await getCategoryArticles(slug, page);
  if (!data) {
    notFound();
  }

  const { category, paginated } = data;
  const crumbs: Crumb[] = [
    { name: "Início", href: "/" },
    { name: "Conteúdos", href: "/conteudos" },
    { name: category.name, href: `/categorias/${category.slug}` },
  ];

  return (
    <main className="overflow-hidden">
      <Header />
      <section className="section-pad editorial-page">
        <div className="container-shell">
          <Breadcrumbs items={crumbs} />
          <header className="editorial-page-head">
            <p className="section-kicker">Categoria</p>
            <h1 className="section-title">{category.name}</h1>
            {category.description ? (
              <p className="section-copy">{category.description}</p>
            ) : null}
          </header>

          {paginated.items.length === 0 ? (
            <EmptyState
              title="Nenhum conteúdo publicado nesta categoria"
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
                basePath={`/categorias/${slug}`}
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
