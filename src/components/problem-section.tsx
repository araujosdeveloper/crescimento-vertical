import { Check, X } from "lucide-react";

const semEstrutura = [
  "Anúncios sem direção",
  "Leads perdidos",
  "Atendimento manual desorganizado",
  "Site que não gera confiança",
  "Decisões baseadas em achismo",
];

const comEstrutura = [
  "Jornada clara",
  "Captação organizada",
  "Follow-up automatizado",
  "Página focada em conversão",
  "Decisões baseadas em dados",
];

export function ProblemSection() {
  return (
    <section className="ps-section">
      <div className="container-shell">
        <div className="ps-head">
          <p className="ps-kicker">A diferença está na estrutura</p>

          <h2 className="ps-title">
            Estar no digital não significa <span>estar crescendo</span>
          </h2>

          <p className="ps-copy">
            Muitas empresas têm redes sociais, anúncios e até um site, mas continuam sem
            previsibilidade porque não possuem uma estrutura digital clara.
          </p>
        </div>

        <div className="ps-grid">
          <div className="ps-card ps-card--bad">
            <div className="ps-card-head">
              <div className="ps-icon ps-icon--bad">
                <X size={18} />
              </div>

              <div>
                <h3>Sem estrutura</h3>
                <p>Ações desconectadas e pouca clareza</p>
              </div>
            </div>

            <div className="ps-list">
              {semEstrutura.map((item) => (
                <div className="ps-item ps-item--bad" key={item}>
                  <X size={16} />
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="ps-divider" aria-hidden="true">
            ↓
          </div>

          <div className="ps-card ps-card--good">
            <div className="ps-card-head">
              <div className="ps-icon ps-icon--good">
                <Check size={18} />
              </div>

              <div>
                <h3>Com estrutura</h3>
                <p>Uma operação conectada e mensurável</p>
              </div>
            </div>

            <div className="ps-list">
              {comEstrutura.map((item) => (
                <div className="ps-item ps-item--good" key={item}>
                  <Check size={16} />
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}