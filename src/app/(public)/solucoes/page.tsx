import Link from "next/link";
import { getPublicServices } from "@/lib/commercial/data";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";
export const dynamic="force-dynamic";
export const metadata={title:"Soluções | Crescimento Vertical",description:"Soluções de estratégia digital, automação e tecnologia para negócios."};
export default async function Solutions(){const services=await getPublicServices();return <div className="section-pad"><div className="container-shell"><Breadcrumbs items={[{name:"Início",href:"/"},{name:"Soluções",href:"/solucoes"}]}/><p className="section-kicker">Soluções</p><h1 className="section-title">Estrutura digital para decisões mais claras</h1><p className="section-copy">Conheça os seis pilares que conectam estratégia, tecnologia e performance.</p><div className="services-grid">{services.map(s=><article className="service-card" key={s.slug}><h2>{s.title}</h2><p>{s.shortDescription}</p><Link className="service-link" href={`/solucoes/${s.slug}`}>Conhecer solução ↗</Link></article>)}</div></div></div>}
