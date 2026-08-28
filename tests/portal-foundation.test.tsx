// @vitest-environment jsdom

import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { MobileNavigation } from "@/components/layout/mobile-navigation";
import { SiteHeader } from "@/components/layout/site-header";
import { SiteShell } from "@/components/layout/site-shell";
import { SkipLink } from "@/components/layout/skip-link";
import {
  EmptyState,
  ErrorState,
  SuccessState,
} from "@/components/ui/interface-state";
import { Skeleton } from "@/components/ui/skeleton";
import { isNavigationItemCurrent, PUBLIC_NAVIGATION } from "@/lib/navigation";

let pathname = "/";
vi.mock("next/navigation", () => ({
  usePathname: () => pathname,
}));

afterEach(() => {
  cleanup();
  document.body.style.overflow = "";
  pathname = "/";
});

describe("navegação pública", () => {
  it("mantém somente destinos liberados e absolutos", () => {
    expect(PUBLIC_NAVIGATION.map(({ label, href }) => [label, href])).toEqual([
      ["Início", "/"],
      ["Conteúdos", "/conteudos"],
      ["Notícias", "/noticias"],
      ["Análises", "/analises"],
      ["Guias", "/guias"],
      ["Ferramentas", "/ferramentas"],
      ["Soluções", "/solucoes"],
      ["Diagnóstico", "/diagnostico"],
      ["Sobre", "/sobre"],
      ["Contato", "/contato"],
    ]);
    expect(PUBLIC_NAVIGATION.every(({ href }) => href.startsWith("/"))).toBe(true);
    const unavailableRoutes = [
      "/admin",
      "/api/users",
    ];
    expect(
      PUBLIC_NAVIGATION.some(({ href }) => unavailableRoutes.includes(href)),
    ).toBe(false);
  });

  it("calcula aria-current apenas para rotas", () => {
    expect(isNavigationItemCurrent("/conteudos/artigo", PUBLIC_NAVIGATION[1])).toBe(true);
    expect(isNavigationItemCurrent("/", PUBLIC_NAVIGATION[2])).toBe(false);
  });

  it("renderiza o header desktop com aria-current", () => {
    pathname = "/conteudos";
    render(<SiteHeader />);
    const current = screen.getAllByRole("link", { name: "Conteúdos" })[0];
    expect(current.getAttribute("aria-current")).toBe("page");
    expect(screen.getByRole("navigation", { name: "Navegação principal" })).toBeTruthy();
  });
});

describe("menu mobile", () => {
  it("abre, bloqueia rolagem, fecha com Escape e devolve o foco", async () => {
    const user = userEvent.setup();
    render(<MobileNavigation />);
    const trigger = screen.getByRole("button", { name: "Abrir menu" });
    await user.click(trigger);
    expect(screen.getByRole("dialog", { name: "Menu principal" })).toBeTruthy();
    expect(document.body.style.overflow).toBe("hidden");
    await user.keyboard("{Escape}");
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
    expect(document.activeElement).toBe(trigger);
    expect(document.body.style.overflow).toBe("");
  });

  it("mantém o foco dentro do menu", async () => {
    const user = userEvent.setup();
    render(<MobileNavigation />);
    await user.click(screen.getByRole("button", { name: "Abrir menu" }));
    const close = screen.getByRole("button", { name: "Fechar menu" });
    await waitFor(() => expect(document.activeElement).toBe(close));
    await user.tab({ shift: true });
    expect(document.activeElement).toBe(
      screen.getByRole("link", {
        name: /Enviar e-mail|Falar com especialista/,
      }),
    );
    await user.tab();
    expect(document.activeElement).toBe(close);
  });
});

describe("estrutura e estados", () => {
  it("expõe SkipLink e um único main no SiteShell", () => {
    const { container } = render(
      <SiteShell>
        <h1>Página pública</h1>
      </SiteShell>,
    );
    expect(
      screen
        .getByRole("link", { name: "Pular para o conteúdo" })
        .getAttribute("href"),
    ).toBe("#main-content");
    expect(container.querySelectorAll("main")).toHaveLength(1);
    expect(container.querySelector("main")?.id).toBe("main-content");
  });

  it("renderiza SkipLink isoladamente", () => {
    render(<SkipLink />);
    expect(screen.getByText("Pular para o conteúdo")).toBeTruthy();
  });

  it("marca somente o último breadcrumb como atual", () => {
    render(
      <Breadcrumbs
        items={[
          { name: "Início", href: "/" },
          { name: "Conteúdos", href: "/conteudos" },
        ]}
      />,
    );
    expect(screen.getByRole("link", { name: "Início" })).toBeTruthy();
    expect(screen.getByText("Conteúdos").getAttribute("aria-current")).toBe("page");
  });

  it("renderiza estados vazio, erro, sucesso e loading", () => {
    render(
      <>
        <EmptyState title="Vazio" />
        <ErrorState title="Erro" />
        <SuccessState title="Sucesso" />
        <Skeleton />
      </>,
    );
    expect(screen.getByText("Vazio")).toBeTruthy();
    expect(screen.getByRole("alert").textContent).toContain("Erro");
    expect(screen.getByText("Sucesso")).toBeTruthy();
    expect(screen.getByText("Carregando conteúdo")).toBeTruthy();
  });
});
