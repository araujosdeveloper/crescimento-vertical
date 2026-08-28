import { describe, expect, it } from "vitest";

import { Articles } from "../src/collections/Articles";
import { rejectInactiveLogin, Users } from "../src/collections/Users";
import {
  normalizePreviewSlug,
  previewURLForArticle,
  safeSameOriginPath,
} from "../src/lib/preview";

describe("preview editorial seguro", () => {
  it("normaliza de forma estrita e rejeita slugs manipulados", () => {
    expect(normalizePreviewSlug("artigo-seguro")).toBe("artigo-seguro");
    expect(normalizePreviewSlug("Artigo Seguro")).toBeNull();
    expect(normalizePreviewSlug("../admin")).toBeNull();
    expect(normalizePreviewSlug("https://evil.example/x")).toBeNull();
    expect(normalizePreviewSlug("a".repeat(201))).toBeNull();
  });

  it("gera URL no mesmo origin configurado", () => {
    process.env.NEXT_PUBLIC_SITE_URL = "https://staging.example.test";
    expect(previewURLForArticle("artigo-seguro")).toBe(
      "https://staging.example.test/api/preview?slug=artigo-seguro",
    );
    expect(previewURLForArticle("../admin")).toBeNull();
  });

  it("impede open redirect ao encerrar o preview", () => {
    const origin = new URL("https://staging.example.test/api/preview/exit");
    expect(safeSameOriginPath("/conteudos/x?ok=1", "/conteudos", origin)).toBe(
      "/conteudos/x?ok=1",
    );
    expect(
      safeSameOriginPath("https://evil.example/x", "/conteudos", origin),
    ).toBe("/conteudos");
    expect(safeSameOriginPath("//evil.example/x", "/conteudos", origin)).toBe(
      "/conteudos",
    );
  });

  it("mantém preview ligado à coleção e versões/drafts ativos", () => {
    expect(typeof Articles.admin?.preview).toBe("function");
    expect(Articles.versions).toEqual({ drafts: true });
  });
});

describe("autenticação administrativa", () => {
  it("bloqueia login de usuário inativo sem revelar motivo específico", () => {
    expect(() => rejectInactiveLogin({ user: { active: false } })).toThrow();
    expect(() => rejectInactiveLogin({ user: { active: true } })).not.toThrow();
  });

  it("mantém lockout, sessão curta e active no JWT", () => {
    expect(Users.auth).toMatchObject({
      maxLoginAttempts: 5,
      lockTime: 300_000,
      tokenExpiration: 3_600,
    });
    const activeField = Users.fields.find(
      (field) => "name" in field && field.name === "active",
    );
    expect(activeField).toMatchObject({ saveToJWT: true });
  });
});
