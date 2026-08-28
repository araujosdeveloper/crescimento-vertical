import Link from "next/link";

import { BrandLogo } from "@/components/brand-logo";
import { Container } from "@/components/layout/container";
import { NAVIGATION_CTA, NAVIGATION_GROUPS } from "@/lib/navigation";
import { CONTACT_EMAIL, WHATSAPP_DISPLAY, WHATSAPP_URL } from "@/lib/site";

export function SiteFooter() {
  const contents = NAVIGATION_GROUPS.find((group) => group.id === "contents");
  const solutions = NAVIGATION_GROUPS.find((group) => group.id === "solutions");
  const company = NAVIGATION_GROUPS.find((group) => group.id === "company");
  return <footer className="footer">
    <div className="footer-accent" />
    <Container className="footer-grid">
      <div className="footer-brand"><Link className="brand" href="/" aria-label="Crescimento Vertical - início"><BrandLogo footer /></Link><p>Estratégia digital, automação e performance para empresas em expansão.</p></div>
      <FooterGroup label="Conteúdos" links={contents?.items ?? []} />
      <FooterGroup label="Soluções" links={solutions?.items ?? []} />
      <FooterGroup label="Empresa" links={company?.items ?? []} />
      <FooterGroup label="Legal" links={[{ id: "privacy", label: "Privacidade", href: "/privacidade" }, { id: "terms", label: "Termos", href: "/termos" }, { id: "cookies", label: "Cookies", href: "/cookies" }]} />
      <div><p className="footer-title">Contato</p><div className="footer-contact">
        {WHATSAPP_URL ? <><span>WhatsApp</span><a href={WHATSAPP_URL} target="_blank" rel="noreferrer">{WHATSAPP_DISPLAY || "Iniciar conversa"}</a></> : null}
        <span>E-mail</span><a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>
        <Link className="footer-diagnostic" href={NAVIGATION_CTA.href}>{NAVIGATION_CTA.label}</Link>
      </div></div>
    </Container>
    <div className="footer-bottom"><Container><p>© 2026 Crescimento Vertical. Todos os direitos reservados.</p><p>Estratégia • Automação • Performance</p></Container></div>
  </footer>;
}

function FooterGroup({ label, links }: { label: string; links: readonly { id: string; label: string; href: `/${string}` }[] }) {
  return <div><p className="footer-title">{label}</p><nav className="footer-links" aria-label={`Navegação: ${label}`}>
    {links.map((link) => <Link href={link.href} key={link.id}>{link.label}</Link>)}
  </nav></div>;
}
