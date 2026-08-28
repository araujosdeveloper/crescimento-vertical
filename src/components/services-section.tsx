import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { getPublicServices } from "@/lib/commercial/data";

export async function ServicesSection() {
  const services = await getPublicServices();
  return <section className="section-pad services-section" id="solucoes"><div className="services-glow" /><div className="container-shell relative"><div className="section-heading-centered"><p className="section-kicker">Ecossistema de soluções</p><h2 className="section-title">Soluções para estruturar o crescimento digital <span>da sua empresa</span></h2><p className="section-copy">Unimos presença digital, automação, tráfego e análise para criar uma estrutura mais inteligente, clara e preparada para gerar oportunidades.</p></div><div className="services-grid">{services.map((service,index)=><article className="service-card" key={service.slug}><div className="service-card-head"><span className="service-icon" aria-hidden="true">0{index+1}</span><span className="card-number">0{index+1}</span></div><h3>{service.title}</h3><p>{service.shortDescription}</p><Link className="service-link" href={`/solucoes/${service.slug}`}>Conhecer solução <ArrowUpRight aria-hidden="true" size={16}/></Link></article>)}</div></div></section>;
}
