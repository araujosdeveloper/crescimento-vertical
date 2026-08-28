import Link from "next/link";

import { BrandLogo } from "@/components/brand-logo";
import { Container } from "@/components/layout/container";
import { PUBLIC_NAVIGATION } from "@/lib/navigation";
import { CONTACT_EMAIL, WHATSAPP_DISPLAY, WHATSAPP_URL } from "@/lib/site";

export function SiteFooter() {
  return (
    <footer className="footer">
      <div className="footer-accent" />
      <Container className="footer-grid">
        <div className="footer-brand">
          <Link className="brand" href="/" aria-label="Crescimento Vertical - início">
            <BrandLogo footer />
          </Link>
          <p>Estratégia digital, automação e performance para empresas em expansão.</p>
        </div>
        <div>
          <p className="footer-title">Links rápidos</p>
          <nav className="footer-links" aria-label="Navegação do rodapé">
            {PUBLIC_NAVIGATION.map((item) => (
              <Link href={item.href} key={item.href}>{item.label}</Link>
            ))}
            <Link href="/cases">Cases</Link>
            <Link href="/privacidade">Privacidade</Link>
            <Link href="/termos">Termos</Link>
            <Link href="/cookies">Cookies</Link>
          </nav>
        </div>
        <div>
          <p className="footer-title">Contato</p>
          <div className="footer-contact">
            {WHATSAPP_URL ? (
              <>
                <span>WhatsApp</span>
                <a href={WHATSAPP_URL} target="_blank" rel="noreferrer">
                  {WHATSAPP_DISPLAY || "Iniciar conversa"}
                </a>
              </>
            ) : null}
            <span>E-mail</span>
            <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>
          </div>
        </div>
      </Container>
      <div className="footer-bottom">
        <Container>
          <p>© 2026 Crescimento Vertical. Todos os direitos reservados.</p>
          <p>Estratégia • Automação • Performance</p>
        </Container>
      </div>
    </footer>
  );
}
