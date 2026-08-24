import { Binary, ChartSpline, CircuitBoard, Gauge, MessageSquareMore, PanelsTopLeft, Waypoints } from "lucide-react";

const items = [
  [Waypoints, "Estratégia antes de qualquer execução"],
  [PanelsTopLeft, "Design pensado para conversão"],
  [Gauge, "Automação para ganhar velocidade operacional"],
  [CircuitBoard, "Tecnologia aplicada de forma prática"],
  [ChartSpline, "Dados para decisões melhores"],
  [MessageSquareMore, "Comunicação clara e posicionamento profissional"],
  [Binary, "Visão de estrutura, não apenas de divulgação"],
];

export function DifferentialsSection() {
  return (
    <section className="section-pad differentials-section" id="diferenciais">
      <div className="differentials-orb" />
      <div className="container-shell differentials-layout">
        <div className="differentials-copy">
          <p className="section-kicker">Nossa abordagem</p>
          <h2 className="section-title">Por que a Crescimento Vertical <span>é diferente?</span></h2>
          <p className="section-copy">Não entregamos ações soltas. Pensamos no sistema que sustenta a presença, a aquisição, o relacionamento e a evolução digital da empresa.</p>
          <blockquote><span>“</span><p>Crescimento não é sorte.<strong>É estrutura.</strong></p></blockquote>
        </div>
        <div className="differentials-grid">
          {items.map(([Icon, title], index) => {
            const ItemIcon = Icon as typeof Waypoints;
            return <article className={`differential-card ${index === items.length - 1 ? "differential-card-wide" : ""}`} key={title as string}><span className="differential-icon"><ItemIcon size={19} /></span><p>{title as string}</p><small>0{index + 1}</small></article>;
          })}
        </div>
      </div>
    </section>
  );
}
