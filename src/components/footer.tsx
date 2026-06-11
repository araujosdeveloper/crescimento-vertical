import { BrandLogo } from "@/components/brand-logo";
import { WHATSAPP_URL } from "@/lib/site";

const quickLinks = [["Início", "#inicio"], ["Soluções", "#solucoes"], ["Processo", "#processo"], ["Diferenciais", "#diferenciais"], ["Contato", "#contato"]];
const solutions = ["Sites de alta conversão", "Landing pages", "Automação inteligente", "Tráfego pago", "Funis de venda"];

export function Footer() {
  return (
    <footer className="footer">
      <div className="footer-accent" />
      <div className="container-shell footer-grid">
        <div className="footer-brand">
          <a className="brand" href="#inicio" aria-label="Crescimento Vertical - início"><BrandLogo footer /></a>
          <p>Estratégia digital, automação e performance para empresas em expansão.</p>
        </div>
        <FooterColumn title="Links rápidos" items={quickLinks} />
        <FooterColumn title="Soluções" items={solutions.map((item) => [item, "#solucoes"])} />
        <div><p className="footer-title">Contato</p><div className="footer-contact"><span>WhatsApp</span><a href={WHATSAPP_URL} target="_blank" rel="noreferrer">(00) 00000-0000</a><span>E-mail</span><a href="mailto:contato@crescimentovertical.com">contato@crescimentovertical.com</a></div></div>
      </div>
      <div className="footer-bottom"><div className="container-shell"><p>© 2026 Crescimento Vertical. Todos os direitos reservados.</p><p>Estratégia • Automação • Performance</p></div></div>
    </footer>
  );
}

function FooterColumn({ title, items }: { title: string; items: string[][] }) {
  return <div><p className="footer-title">{title}</p><div className="footer-links">{items.map(([label, href]) => <a href={href} key={label}>{label}</a>)}</div></div>;
}
