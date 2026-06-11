import {
  Bot,
  ChartNoAxesCombined,
  Crosshair,
  Funnel,
  Lightbulb,
  MonitorSmartphone,
  PanelsTopLeft,
  ScanSearch,
} from "lucide-react";

const services = [
  [MonitorSmartphone, "Sites de alta conversão", "Deixe de ter apenas uma página bonita. Tenha uma estrutura preparada para gerar confiança, capturar contatos e conduzir o visitante para a ação."],
  [PanelsTopLeft, "Landing pages", "Páginas focadas em campanhas, captação de leads, apresentação de ofertas e conversão com clareza."],
  [Crosshair, "Tráfego pago", "Campanhas criadas para atrair o público certo, aumentar oportunidades e melhorar a previsibilidade comercial."],
  [Bot, "Automação inteligente", "Organize atendimentos, leads e follow-ups para reduzir perdas e aumentar a velocidade comercial."],
  [Funnel, "Funis de venda", "Estruturas que conduzem o cliente do primeiro contato até a decisão de compra com mais clareza."],
  [Lightbulb, "Criativos com IA", "Textos, imagens, ideias e campanhas com mais velocidade, estratégia e impacto visual."],
  [ChartNoAxesCombined, "Otimização de conversão", "Análise de páginas, campanhas e jornadas para melhorar resultados com base em dados."],
  [ScanSearch, "Consultoria digital", "Direcionamento estratégico para empresas que precisam organizar sua presença digital e crescer com mais controle."],
];

export function ServicesSection() {
  return (
    <section className="section-pad services-section" id="solucoes">
      <div className="services-glow" />
      <div className="container-shell relative">
        <div className="section-heading-centered">
          <p className="section-kicker">Ecossistema de soluções</p>
          <h2 className="section-title">Soluções para estruturar o crescimento digital <span>da sua empresa</span></h2>
          <p className="section-copy">Unimos presença digital, automação, tráfego e análise para criar uma estrutura mais inteligente, clara e preparada para gerar oportunidades.</p>
        </div>
        <div className="services-grid">
          {services.map(([Icon, title, text], index) => {
            const ServiceIcon = Icon as typeof Bot;
            return (
              <article className="service-card" key={title as string}>
                <div className="service-card-head"><span className="service-icon"><ServiceIcon size={24} /></span><span className="card-number">0{index + 1}</span></div>
                <h3>{title as string}</h3>
                <p>{text as string}</p>
                <span className="service-link">Estrutura especializada <ArrowGlyph /></span>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function ArrowGlyph() { return <span aria-hidden="true">↗</span>; }
