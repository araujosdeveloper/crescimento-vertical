export interface NavigationLink {
  id: string;
  label: string;
  href: `/${string}`;
  description?: string;
}

export interface NavigationGroup {
  id: "contents" | "solutions" | "company";
  label: string;
  href: `/${string}`;
  description?: string;
  items: readonly NavigationLink[];
}

export interface NavigationCTA {
  id: "diagnostic";
  label: string;
  href: "/diagnostico";
}

export const HOME_NAVIGATION: NavigationLink = { id: "home", label: "Início", href: "/" };

export const NAVIGATION_GROUPS = [
  { id: "contents", label: "Conteúdos", href: "/conteudos", description: "Ideias e referências para decidir melhor.", items: [
    { id: "contents-overview", label: "Visão geral", href: "/conteudos" },
    { id: "news", label: "Notícias", href: "/noticias" },
    { id: "analysis", label: "Análises", href: "/analises" },
    { id: "guides", label: "Guias", href: "/guias" },
    { id: "tools", label: "Ferramentas", href: "/ferramentas" },
    { id: "comparisons", label: "Comparativos", href: "/comparativos" },
    { id: "search", label: "Buscar conteúdos", href: "/busca" },
  ] },
  { id: "solutions", label: "Soluções", href: "/solucoes", description: "Estratégia, tecnologia e operação aplicadas ao negócio.", items: [
    { id: "solutions-overview", label: "Visão geral", href: "/solucoes" },
    { id: "sites", label: "Sites e landing pages", href: "/solucoes/sites-e-landing-pages" },
    { id: "traffic", label: "Tráfego e conversão", href: "/solucoes/trafego-e-conversao" },
    { id: "whatsapp", label: "Automação de WhatsApp", href: "/solucoes/automacao-whatsapp" },
    { id: "ai-agents", label: "Agentes de IA", href: "/solucoes/agentes-de-ia" },
    { id: "n8n", label: "Integrações n8n", href: "/solucoes/integracoes-n8n" },
    { id: "support", label: "Consultoria e suporte", href: "/solucoes/consultoria-e-suporte" },
  ] },
  { id: "company", label: "Empresa", href: "/sobre", description: "Conheça nosso método, contexto e canais.", items: [
    { id: "about", label: "Sobre", href: "/sobre" },
    { id: "cases", label: "Cases", href: "/cases" },
    { id: "contact", label: "Contato", href: "/contato" },
    { id: "editorial-policy", label: "Política editorial", href: "/politica-editorial" },
    { id: "corrections", label: "Correções", href: "/correcoes" },
  ] },
] as const satisfies readonly NavigationGroup[];

export const NAVIGATION_CTA: NavigationCTA = { id: "diagnostic", label: "Solicitar diagnóstico", href: "/diagnostico" };

/** Flat view kept for consumers that need to validate all public destinations. */
export const PUBLIC_NAVIGATION: readonly NavigationLink[] = [
  HOME_NAVIGATION,
  ...NAVIGATION_GROUPS.reduce<NavigationLink[]>((items, group) => items.concat(group.items as readonly NavigationLink[]), []),
  NAVIGATION_CTA,
];

export function isNavigationItemCurrent(pathname: string, item: NavigationLink): boolean {
  if (item.href === "/") return pathname === "/";
  return pathname === item.href || pathname.startsWith(`${item.href}/`);
}
