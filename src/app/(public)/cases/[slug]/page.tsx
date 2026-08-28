import { notFound } from "next/navigation";
import { getPublicCases } from "@/lib/commercial/data";
export const dynamic="force-dynamic";
export default async function CasePage({params}:{params:Promise<{slug:string}>}){const {slug}=await params;const c=(await getPublicCases()).find(x=>x.slug===slug);if(!c)notFound();return <div className="section-pad"><div className="container-shell"><p className="section-kicker">Case autorizado</p><h1 className="section-title">{c.title}</h1><p className="section-copy">{c.summary}</p><div className="prose prose-invert"><h2>Desafio</h2><p>{c.challenge}</p><h2>Solução</h2><p>{c.solution}</p><h2>Resultados</h2><p>{c.results||"Resultados específicos não foram publicados."}</p></div></div></div>}
