import type { NavigationItem } from "@/types/public";

export const PUBLIC_NAVIGATION = [
  { label: "Início", href: "/", kind: "route" },
  { label: "Conteúdos", href: "/conteudos", kind: "route" },
  { label: "Soluções", href: "/solucoes", kind: "route" },
  { label: "Sobre", href: "/sobre", kind: "route" },
  { label: "Contato", href: "/contato", kind: "route" },
] as const satisfies readonly NavigationItem[];

export function isNavigationItemCurrent(
  pathname: string,
  item: NavigationItem,
): boolean {
  if (item.kind !== "route") return false;
  if (item.href === "/") return pathname === "/";
  return pathname === item.href || pathname.startsWith(`${item.href}/`);
}
