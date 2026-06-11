import { ChartNoAxesCombined, Cpu, Waypoints } from "lucide-react";

const pillars = [
  {
    icon: Waypoints,
    number: "01",
    title: "Estratégia antes da execução",
    text: "Cada ação parte de uma direção clara, com objetivo, posicionamento e jornada.",
  },
  {
    icon: Cpu,
    number: "02",
    title: "Tecnologia aplicada ao crescimento",
    text: "Sites, automações e ferramentas digitais trabalhando para simplificar processos e gerar oportunidades.",
  },
  {
    icon: ChartNoAxesCombined,
    number: "03",
    title: "Performance orientada por dados",
    text: "Acompanhamento constante para melhorar campanhas, páginas e decisões comerciais.",
  },
];

export function AuthoritySection() {
  return (
    <section className="section-pad authority-section" id="autoridade">
      <div className="container-shell relative">
        <div className="authority-intro">
          <div>
            <p className="section-kicker">Visão integrada</p>
            <h2 className="section-title">
              Estratégia, tecnologia e performance <span>trabalhando juntas</span>
            </h2>
          </div>
          <p className="section-copy">
            Enquanto muitas empresas apenas publicam conteúdos ou impulsionam anúncios sem direção, a Crescimento Vertical constrói estruturas digitais pensadas para atrair, converter, automatizar e escalar resultados com mais clareza.
          </p>
        </div>

        <div className="authority-grid">
          {pillars.map(({ icon: Icon, number, title, text }) => (
            <article className="authority-card" key={title}>
              <div className="authority-card-top">
                <span className="icon-orbit"><Icon size={22} /></span>
                <span className="card-number">{number}</span>
              </div>
              <h3>{title}</h3>
              <p>{text}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
