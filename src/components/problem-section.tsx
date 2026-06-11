import { Check, CircleAlert, X } from "lucide-react";

const withoutStructure = ["Anúncios sem direção", "Leads perdidos", "Atendimento manual desorganizado", "Site que não gera confiança", "Decisões baseadas em achismo"];
const withStructure = ["Jornada clara", "Captação organizada", "Follow-up automatizado", "Página focada em conversão", "Decisões baseadas em dados"];

export function ProblemSection() {
  return (
    <section className="section-pad problem-section">
      <div className="container-shell">
        <div className="section-heading-centered">
          <p className="section-kicker">A diferença está na estrutura</p>
          <h2 className="section-title">Estar no digital não significa <span>estar crescendo</span></h2>
          <p className="section-copy">Muitas empresas têm redes sociais, anúncios e até um site, mas continuam sem previsibilidade porque não possuem uma estrutura digital clara.</p>
        </div>

        <div className="comparison-layout">
          <ComparisonCard title="Sem estrutura" subtitle="Ações desconectadas e pouca clareza" items={withoutStructure} negative />
          <div className="comparison-bridge"><span>Transformar</span><i>→</i></div>
          <ComparisonCard title="Com estrutura" subtitle="Uma operação conectada e mensurável" items={withStructure} />
        </div>
      </div>
    </section>
  );
}

function ComparisonCard({ title, subtitle, items, negative = false }: { title: string; subtitle: string; items: string[]; negative?: boolean }) {
  return (
    <article className={`comparison-card ${negative ? "comparison-muted" : "comparison-active"}`}>
      <div className="comparison-heading">
        <span className="comparison-icon">{negative ? <CircleAlert size={20} /> : <Check size={20} />}</span>
        <div><h3>{title}</h3><p>{subtitle}</p></div>
      </div>
      <div className="comparison-items">
        {items.map((item) => <div key={item}>{negative ? <X size={17} /> : <Check size={17} />}<span>{item}</span></div>)}
      </div>
    </article>
  );
}
