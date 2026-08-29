import type { ContentType } from "@/lib/editorial";
import { CONTENT_TYPE_LABELS } from "@/lib/editorial";
import { searchPublicArticles } from "@/lib/editorial/data";
import { normalizePage } from "@/lib/editorial/pagination";
import { ArticleList } from "./article-list";
import { Pagination } from "./pagination";
import { EmptyState } from "@/components/ui/interface-state";
export async function ContentTypeHub({ type, page = 1 }: { type: ContentType; page?: number }) { const data = await searchPublicArticles({ type, page }); return <section className="section-pad editorial-page"><div className="container-shell"><p className="section-kicker">Portal editorial</p><h1 className="section-title">{CONTENT_TYPE_LABELS[type]}</h1><p className="section-copy">Conteúdos verificados sobre IA, automação e tecnologia aplicada a negócios.</p>{data.items.length ? <><ArticleList items={data.items}/><Pagination page={data.page} totalPages={data.totalPages} hasNextPage={data.hasNextPage} hasPrevPage={data.hasPrevPage} basePath={`/${({news:"noticias",analysis:"analises",guide:"guias",tool:"ferramentas",comparison:"comparativos"} as Record<ContentType,string>)[type]}`}/></> : <EmptyState title={`Ainda não há ${CONTENT_TYPE_LABELS[type].toLowerCase()} publicados`} description="Nenhum conteúdo público corresponde a este tipo."/>}</div></section>; }
export const typePage = (type: ContentType) => { const Page = async ({ searchParams }: { searchParams: Promise<{ page?: string }> }) => <ContentTypeHub type={type} page={normalizePage((await searchParams).page)} />; Page.displayName = `${type}EditorialHub`; return Page; };
