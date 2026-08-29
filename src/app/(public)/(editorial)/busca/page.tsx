import type { Metadata } from "next";
import { searchPublicArticles } from "@/lib/editorial/data";
import { normalizePage } from "@/lib/editorial/pagination";
import { ArticleList } from "@/components/editorial/article-list";
import { SearchForm } from "@/components/editorial/search-form";
import { Pagination } from "@/components/editorial/pagination";
import { EmptyState } from "@/components/ui/interface-state";
import { absoluteUrl, noindexRobotsMetadata } from "@/lib/editorial/seo";
export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Busca | Crescimento Vertical", robots: noindexRobotsMetadata(), alternates: { canonical: absoluteUrl("/busca") } };
export default async function SearchPage({ searchParams }: { searchParams: Promise<{ q?: string; page?: string }> }) { const params=await searchParams; const page=normalizePage(params.page); const data=await searchPublicArticles({q:params.q,page}); return <section className="section-pad editorial-page"><div className="container-shell"><h1 className="section-title">Buscar conteúdos</h1><div className="my-8"><SearchForm initialQuery={params.q}/></div>{data.items.length?<><ArticleList items={data.items}/><Pagination page={data.page} totalPages={data.totalPages} hasNextPage={data.hasNextPage} hasPrevPage={data.hasPrevPage} basePath="/busca"/></>:<EmptyState title="Nenhum conteúdo encontrado" description="Tente outros termos ou consulte o hub de conteúdos."/>}</div></section>; }
