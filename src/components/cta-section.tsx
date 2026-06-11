import { ArrowRight, MessageSquareText, ScanSearch, Sparkles } from "lucide-react";
import { WHATSAPP_URL } from "@/lib/site";

export function CTASection() {
  return (
    <>
      <section className="section-pad cta-section">
        <div className="container-shell">
          <div className="cta-panel">
            <div className="cta-mesh" />
            <div className="cta-beam" />
            <div className="cta-copy">
              <p className="section-kicker">Diagnóstico estratégico</p>
              <h2>Crescimento não acontece por improviso. <span>Ele precisa de estrutura.</span></h2>
              <p>Vamos analisar o momento da sua empresa e identificar quais estruturas digitais podem gerar mais oportunidades de venda.</p>
              <a className="button-primary" href={WHATSAPP_URL} target="_blank" rel="noreferrer">Falar com especialista <ArrowRight size={18} /></a>
            </div>
            <div className="cta-visual" aria-hidden="true">
              <div className="cta-orbit"><Sparkles size={28} /></div>
              <div className="cta-scan"><ScanSearch size={24} /><span>Diagnóstico</span><small>Estrutura • Automação • Performance</small></div>
            </div>
          </div>
        </div>
      </section>

      <section className="final-cta" id="contato">
        <div className="final-cta-grid" />
        <div className="final-glow" />
        <div className="container-shell relative text-center">
          <span className="final-icon"><MessageSquareText size={25} /></span>
          <p className="section-kicker">Vamos conversar</p>
          <h2>Pronto para estruturar o crescimento digital da sua empresa?</h2>
          <p>Fale com a Crescimento Vertical e descubra como transformar sua presença digital em uma operação mais inteligente, automatizada e preparada para vender mais.</p>
          <a className="button-primary" href={WHATSAPP_URL} target="_blank" rel="noreferrer">Falar com especialista <ArrowRight size={18} /></a>
        </div>
      </section>
    </>
  );
}
