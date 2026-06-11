import { Blocks, ChartSpline, Compass, Search } from "lucide-react";

const steps = [
  [Search, "Diagnóstico", "Entendemos o momento atual da empresa, objetivos, gargalos e oportunidades."],
  [Compass, "Estratégia", "Definimos a estrutura digital mais adequada para atrair, converter e vender melhor."],
  [Blocks, "Construção", "Criamos sites, páginas, automações, criativos, campanhas e fluxos digitais."],
  [ChartSpline, "Otimização", "Acompanhamos dados, identificamos melhorias e ajustamos a estrutura para evoluir continuamente."],
];

export function ProcessSection() {
  return (
    <section className="section-pad process-section" id="processo">
      <div className="container-shell">
        <div className="process-heading">
          <div><p className="section-kicker">Método Crescimento Vertical</p><h2 className="section-title">Como estruturamos <span>o crescimento</span></h2></div>
          <p className="section-copy">Um processo claro para transformar presença digital em uma operação mais estratégica, conectada e mensurável.</p>
        </div>
        <div className="process-timeline">
          <div className="timeline-track" />
          {steps.map(([Icon, title, text], index) => {
            const StepIcon = Icon as typeof Search;
            return (
              <article className="process-card" key={title as string}>
                <span className="timeline-node"><i /></span>
                <div className="process-card-top"><span className="process-number">0{index + 1}</span><span className="service-icon"><StepIcon size={22} /></span></div>
                <h3>{title as string}</h3>
                <p>{text as string}</p>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
