import { describe, expect, it } from "vitest";

import {
  canPublish,
  canTransition,
  hasValidatedSource,
  isPubliclyReadable,
  validatePublication,
  WORKFLOW_STATUSES,
  type WorkflowStatus,
} from "../src/lib/editorial";

describe("transições editoriais", () => {
  it("editor submete draft → in_review mas não publica", () => {
    expect(canTransition(["editor"], "draft", "in_review")).toBe(true);
    expect(canTransition(["editor"], "in_review", "approved")).toBe(false);
    expect(canTransition(["editor"], "in_review", "published")).toBe(false);
  });

  it("reviewer aprova e publica", () => {
    expect(canTransition(["reviewer"], "in_review", "approved")).toBe(true);
    expect(canTransition(["reviewer"], "approved", "published")).toBe(true);
    expect(canTransition(["reviewer"], "published", "archived")).toBe(true);
  });

  it("automation nunca aprova nem publica", () => {
    for (const to of WORKFLOW_STATUSES) {
      expect(canTransition(["automation"], "draft", to as WorkflowStatus)).toBe(
        to === "draft",
      );
    }
    expect(canPublish(["automation"])).toBe(false);
  });

  it("editor não publica (canPublish)", () => {
    expect(canPublish(["editor"])).toBe(false);
    expect(canPublish(["reviewer"])).toBe(true);
    expect(canPublish(["admin"])).toBe(true);
  });

  it("não permite saltos (draft → published direto)", () => {
    expect(canTransition(["reviewer"], "draft", "published")).toBe(false);
    expect(canTransition(["admin"], "draft", "published")).toBe(false);
  });

  it("admin pode realizar todas as transições válidas", () => {
    expect(canTransition(["admin"], "draft", "in_review")).toBe(true);
    expect(canTransition(["admin"], "in_review", "approved")).toBe(true);
    expect(canTransition(["admin"], "in_review", "draft")).toBe(true);
    expect(canTransition(["admin"], "approved", "published")).toBe(true);
    expect(canTransition(["admin"], "approved", "draft")).toBe(true);
    expect(canTransition(["admin"], "published", "archived")).toBe(true);
    expect(canTransition(["admin"], "archived", "draft")).toBe(true);
  });

  it("bloqueia transições fora do grafo para qualquer papel", () => {
    expect(canTransition(["admin"], "draft", "archived")).toBe(false);
    expect(canTransition(["admin"], "in_review", "archived")).toBe(false);
    expect(canTransition(["reviewer"], "draft", "published")).toBe(false);
    expect(canTransition(["editor"], "approved", "published")).toBe(false);
  });
});

describe("exigência de fonte validada", () => {
  it("detecta fonte verificada", () => {
    expect(
      hasValidatedSource([{ reliability: "unverified" }, { reliability: "verified" }]),
    ).toBe(true);
  });

  it("rejeita quando não há fonte verificada", () => {
    expect(hasValidatedSource([])).toBe(false);
    expect(hasValidatedSource([{ reliability: "unverified" }])).toBe(false);
    expect(hasValidatedSource([{ reliability: "rejected" }])).toBe(false);
  });
});

describe("requisitos de publicação", () => {
  it("não reporta ausências quando o artigo está completo", () => {
    expect(
      validatePublication({
        title: "Título",
        excerpt: "Resumo",
        content: {},
        heroImage: "id-imagem",
        author: "id-autor",
        category: "id-categoria",
      }),
    ).toEqual([]);
  });

  it("reporta cada campo obrigatório ausente", () => {
    expect(
      validatePublication({
        title: "",
        excerpt: null,
        content: null,
        heroImage: null,
        author: null,
        category: null,
      }),
    ).toEqual(["title", "excerpt", "content", "heroImage", "author", "category"]);
  });
});

describe("acesso público somente a publicados", () => {
  const past = new Date(Date.now() - 60_000);
  const future = new Date(Date.now() + 60_000);

  it("publicado com publishedAt válido é legível", () => {
    expect(
      isPubliclyReadable({ workflowStatus: "published", publishedAt: past.toISOString() }),
    ).toBe(true);
  });

  it("rascunho não é legível", () => {
    expect(
      isPubliclyReadable({ workflowStatus: "draft", publishedAt: past.toISOString() }),
    ).toBe(false);
    expect(
      isPubliclyReadable({ workflowStatus: "in_review", publishedAt: past.toISOString() }),
    ).toBe(false);
    expect(
      isPubliclyReadable({ workflowStatus: "approved", publishedAt: past.toISOString() }),
    ).toBe(false);
  });

  it("arquivado não é legível mesmo já tendo sido publicado", () => {
    expect(
      isPubliclyReadable({ workflowStatus: "archived", publishedAt: past.toISOString() }),
    ).toBe(false);
  });

  it("sem publishedAt não é legível", () => {
    expect(
      isPubliclyReadable({ workflowStatus: "published", publishedAt: null }),
    ).toBe(false);
  });

  it("publishedAt futuro não é legível", () => {
    expect(
      isPubliclyReadable({ workflowStatus: "published", publishedAt: future.toISOString() }),
    ).toBe(false);
  });
});
