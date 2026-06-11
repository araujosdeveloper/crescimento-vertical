import { ArrowDownRight, ArrowRight } from "lucide-react";
import { WHATSAPP_URL } from "@/lib/site";

export function Hero() {
  return (
    <section className="hero-stage" id="inicio">
      <div className="hero-background" aria-hidden="true" />
      <div className="hero-background-overlay" aria-hidden="true" />

      <div className="hero-shell hero-layout">
        <div className="hero-copy">
          <div className="eyebrow">
            <span className="status-dot" /> Estratégia <i /> Automação <i /> Performance
          </div>
          <h1>
            Sua empresa não<br className="hero-desktop-break" /> precisa apenas<br className="hero-desktop-break" /> estar no digital.<br className="hero-desktop-break" /> Ela precisa <span>crescer.</span>
          </h1>
          <p>Sites, automações, tráfego pago e IA trabalhando juntos para transformar sua presença digital em uma estrutura real de crescimento.</p>
          <div className="hero-actions">
            <a className="button-primary" href={WHATSAPP_URL} target="_blank" rel="noreferrer">
              Falar com especialista <ArrowRight size={18} />
            </a>
            <a className="button-secondary" href="#solucoes">
              Conhecer soluções <ArrowDownRight size={18} />
            </a>
          </div>
          <div className="hero-manifesto">
            <span />
            <p>Crescimento não é sorte. <strong>É estrutura.</strong></p>
          </div>
        </div>
      </div>
    </section>
  );
}
