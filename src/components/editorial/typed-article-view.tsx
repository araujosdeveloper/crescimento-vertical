import type { ArticleDetail } from "@/lib/editorial/types";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { EditorialContent } from "./editorial-content";
import { EditorialCTA } from "./editorial-cta";
import { ContentTypeBadge } from "./content-type-badge";
import { AuthorByline } from "./author-byline";
import { ReviewerByline } from "./reviewer-byline";
import { SourceList } from "./source-list";
import { BusinessImpact } from "./business-impact";
import { CorrectionNotice } from "./correction-notice";
import { RelatedContent } from "./related-content";
import { formatDate } from "@/lib/editorial/format";
export function ArticlePage({ article }: { article: ArticleDetail }) { return <article className="section-pad editorial-article"><div className="container-shell editorial-article-shell"><Breadcrumbs items={[{name:"Início",href:"/"},{name:"Conteúdos",href:"/conteudos"},{name:article.title,href:`/conteudos/${article.slug}`}]} /><header className="editorial-article-head"><ContentTypeBadge type={article.contentType} label={article.contentTypeLabel}/><h1 className="editorial-article-title">{article.title}</h1>{article.summary?<p className="editorial-dek">{article.summary}</p>:null}<div className="editorial-meta"><AuthorByline author={article.author}/><ReviewerByline reviewer={article.publicReviewer}/>{article.publishedAt?<time dateTime={article.publishedAt}>{formatDate(article.publishedAt)}</time>:null}{article.readingTime?<span>{article.readingTime} min de leitura</span>:null}</div></header><div className="editorial-article-body"><EditorialContent content={article.content}/></div><BusinessImpact text={article.businessImpact}/><SourceList citations={article.publicCitations}/><CorrectionNotice corrections={article.correctionHistory}/>{article.aiDisclosure?<p className="mt-6 text-sm text-slate-400">Nota: {article.aiDisclosure}</p>:null}<RelatedContent items={article.relatedArticles}/><EditorialCTA/></div></article>; }
