import type { Metadata } from "next";

import { ArticleCard } from "@/components/editorial/article-card";
import { EmptyState } from "@/components/ui/interface-state";
import { Pagination } from "@/components/editorial/pagination";
import { getPublishedArticles } from "@/lib/editorial/data";
import { normalizePage } from "@/lib/editorial/pagination";
import { hubMetadata } from "@/lib/editorial/seo";

export const dynamic = "force-dynamic";

export const metadata: Metadata = hubMetadata();

interface PageProps {
  searchParams: Promise<{ page?: string }>;
}

export default async function ConteudosPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const page = normalizePage(params.page);
  const data = await getPublishedArticles(page);

  return (
    <>
      <section className="section-pad editorial-page">
        <div className="container-shell">
          <header className="editorial-page-head">
            <p className="section-kicker">Portal editorial</p>
            <h1 className="section-title">Conteúdos para crescer</h1>
            <p className="section-copy">
              Artigos, análises e guias sobre inteligência artificial,
              automação, vendas e tecnologia para empresas que querem crescer
              com previsibilidade.
            </p>
          </header>

          {data.items.length === 0 ? (
            <EmptyState
              title="Ainda não há conteúdos publicados"
              description="Estamos preparando os primeiros artigos. Volte em breve."
            />
          ) : (
            <>
              <div className="editorial-grid">
                {data.items.map((article) => (
                  <ArticleCard key={article.slug} article={article} />
                ))}
              </div>
              <Pagination
                page={data.page}
                totalPages={data.totalPages}
                hasNextPage={data.hasNextPage}
                hasPrevPage={data.hasPrevPage}
                basePath="/conteudos"
              />
            </>
          )}
        </div>
      </section>
    </>
  );
}
