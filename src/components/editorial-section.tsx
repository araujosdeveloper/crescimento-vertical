import { ArrowRight } from "lucide-react";
import Link from "next/link";

import { ArticleCard } from "@/components/editorial/article-card";
import type { ArticleListItem } from "@/lib/editorial/types";

/**
 * Seção "Conteúdos para crescer" exibida na home antes do CTA final. Não
 * renderiza nada (nem cards vazios) quando não há artigos publicados.
 */
export function EditorialSection({ articles }: { articles: ArticleListItem[] }) {
  if (articles.length === 0) {
    return null;
  }

  return (
    <section className="section-pad editorial-home-section" id="conteudos">
      <div className="container-shell">
        <div className="section-heading-centered">
          <p className="section-kicker">Portal editorial</p>
          <h2 className="section-title">
            Conteúdos para crescer
          </h2>
          <p className="section-copy">
            Informação confiável sobre inteligência artificial, automação,
            vendas e tecnologia para aplicar no seu negócio.
          </p>
        </div>
        <div className="editorial-grid">
          {articles.map((article) => (
            <ArticleCard key={article.slug} article={article} />
          ))}
        </div>
        <div className="editorial-more">
          <Link className="button-secondary" href="/conteudos">
            Ver todos os conteúdos <ArrowRight size={16} />
          </Link>
        </div>
      </div>
    </section>
  );
}
