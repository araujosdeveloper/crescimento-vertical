import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getPublicTags, searchPublicArticles } from "@/lib/editorial/data";
import { ArticleList } from "@/components/editorial/article-list";
import { EmptyState } from "@/components/ui/interface-state";
import { absoluteUrl, noindexRobotsMetadata, robotsMetadata } from "@/lib/editorial/seo";
export const dynamic = "force-dynamic";
export async function generateMetadata({params}:{params:Promise<{slug:string}>}):Promise<Metadata>{const slug=(await params).slug;const tag=(await getPublicTags()).find(x=>x.slug===slug); if(!tag)return {}; return {title:`${tag.name} | Crescimento Vertical`,description:tag.description??`Conteúdos sobre ${tag.name}.`,robots:tag.indexable?robotsMetadata():noindexRobotsMetadata(),alternates:{canonical:absoluteUrl(`/tags/${tag.slug}`)}};}
export default async function TagPage({params}:{params:Promise<{slug:string}>}){const slug=(await params).slug;const tag=(await getPublicTags()).find(x=>x.slug===slug);if(!tag)notFound();const data=await searchPublicArticles({tag:slug});return <section className="section-pad editorial-page"><div className="container-shell"><p className="section-kicker">Tag</p><h1 className="section-title">{tag.name}</h1>{tag.description?<p className="section-copy">{tag.description}</p>:null}{data.items.length?<ArticleList items={data.items}/>:<EmptyState title="Ainda não há conteúdos nesta tag" description="Nenhum artigo público foi associado a esta tag."/>}</div></section>;}
