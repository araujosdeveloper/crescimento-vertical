import { describe, expect, it } from "vitest";

import type { Access } from "payload";

import {
  articlesCreate,
  articlesDelete,
  articlesUpdate,
  dossiersCreate,
  dossiersDelete,
  dossiersRead,
  dossiersUpdate,
  mediaCreate,
  mediaDelete,
  mediaUpdate,
  publicRead,
  sourcesCreate,
  sourcesDelete,
  taxonomyCreate,
  taxonomyDelete,
  taxonomyUpdate,
  usersCreate,
  usersDelete,
  usersUpdate,
  workflowStatusFieldAccess,
} from "../src/access";
import { hasRole, isAdmin, isAutomation } from "../src/lib/roles";
import type { Role } from "../src/lib/roles";

const ROLES: Role[] = ["admin", "editor", "reviewer", "researcher", "automation"];

function user(roles: Role[]): { roles: Role[] } {
  return { roles };
}

function req(userArg: { roles: Role[] } | null) {
  return { req: { user: userArg } } as unknown as Parameters<Access>[0];
}

const anonym = req(null);

describe("matriz de permissões — Users", () => {
  it("somente admin cria usuários", () => {
    for (const role of ROLES) {
      expect(usersCreate(req(user([role])))).toBe(role === "admin");
    }
    expect(usersCreate(anonym)).toBe(false);
  });

  it("somente admin exclui usuários", () => {
    for (const role of ROLES) {
      expect(usersDelete(req(user([role])))).toBe(role === "admin");
    }
  });

  it("non-admin não altera outros usuários", () => {
    expect(usersUpdate(req(user(["admin"])))).toBe(true);
    // self-only constraint for non-admin
    const automationUpdate = usersUpdate(req(user(["automation"])));
    expect(automationUpdate).toEqual({ id: { equals: undefined } });
  });
});

describe("matriz de permissões — Articles", () => {
  it("editor e automation podem criar; reviewer e researcher não", () => {
    expect(articlesCreate(req(user(["admin"])))).toBe(true);
    expect(articlesCreate(req(user(["editor"])))).toBe(true);
    expect(articlesCreate(req(user(["automation"])))).toBe(true);
    expect(articlesCreate(req(user(["reviewer"])))).toBe(false);
    expect(articlesCreate(req(user(["researcher"])))).toBe(false);
    expect(articlesCreate(anonym)).toBe(false);
  });

  it("researcher não edita artigos", () => {
    expect(articlesUpdate(req(user(["researcher"])))).toBe(false);
    expect(articlesUpdate(req(user(["editor"])))).toBe(true);
    expect(articlesUpdate(req(user(["reviewer"])))).toBe(true);
    expect(articlesUpdate(req(user(["automation"])))).toBe(true);
  });

  it("somente admin exclui artigos", () => {
    for (const role of ROLES) {
      expect(articlesDelete(req(user([role])))).toBe(role === "admin");
    }
  });

  it("automation e researcher não podem alterar workflowStatus", () => {
    expect(workflowStatusFieldAccess(req(user(["admin"])))).toBe(true);
    expect(workflowStatusFieldAccess(req(user(["editor"])))).toBe(true);
    expect(workflowStatusFieldAccess(req(user(["reviewer"])))).toBe(true);
    expect(workflowStatusFieldAccess(req(user(["automation"])))).toBe(false);
    expect(workflowStatusFieldAccess(req(user(["researcher"])))).toBe(false);
  });
});

describe("matriz de permissões — ResearchDossiers e Sources", () => {
  it("researcher e automation criam dossiês; editor e reviewer não", () => {
    expect(dossiersCreate(req(user(["researcher"])))).toBe(true);
    expect(dossiersCreate(req(user(["automation"])))).toBe(true);
    expect(dossiersCreate(req(user(["admin"])))).toBe(true);
    expect(dossiersCreate(req(user(["editor"])))).toBe(false);
    expect(dossiersCreate(req(user(["reviewer"])))).toBe(false);
  });

  it("researcher e automation atualizam dossiês", () => {
    expect(dossiersUpdate(req(user(["researcher"])))).toBe(true);
    expect(dossiersUpdate(req(user(["automation"])))).toBe(true);
    expect(dossiersUpdate(req(user(["editor"])))).toBe(false);
  });

  it("dossiês nunca são públicos", () => {
    expect(dossiersRead(anonym)).toBe(false);
    for (const role of ROLES) {
      expect(dossiersRead(req(user([role])))).toBe(true);
    }
  });

  it("somente admin exclui dossiês e fontes", () => {
    expect(dossiersDelete(req(user(["admin"])))).toBe(true);
    expect(dossiersDelete(req(user(["researcher"])))).toBe(false);
    expect(sourcesDelete(req(user(["admin"])))).toBe(true);
    expect(sourcesDelete(req(user(["researcher"])))).toBe(false);
  });

  it("researcher e automation criam fontes", () => {
    expect(sourcesCreate(req(user(["researcher"])))).toBe(true);
    expect(sourcesCreate(req(user(["automation"])))).toBe(true);
    expect(sourcesCreate(req(user(["editor"])))).toBe(false);
  });
});

describe("matriz de permissões — taxonomia e mídia", () => {
  it("taxonomia é pública para leitura", () => {
    expect(publicRead(anonym)).toBe(true);
  });

  it("editor gerencia autores e categorias; automation não", () => {
    expect(taxonomyCreate(req(user(["editor"])))).toBe(true);
    expect(taxonomyUpdate(req(user(["editor"])))).toBe(true);
    expect(taxonomyCreate(req(user(["automation"])))).toBe(false);
    expect(taxonomyDelete(req(user(["admin"])))).toBe(true);
    expect(taxonomyDelete(req(user(["editor"])))).toBe(false);
  });

  it("reviewer faz upload de mídia; automation não", () => {
    expect(mediaCreate(req(user(["reviewer"])))).toBe(true);
    expect(mediaUpdate(req(user(["editor"])))).toBe(true);
    expect(mediaCreate(req(user(["automation"])))).toBe(false);
    expect(mediaDelete(req(user(["admin"])))).toBe(true);
    expect(mediaDelete(req(user(["reviewer"])))).toBe(false);
  });
});

describe("helpers de papel", () => {
  it("detecta admin e automation", () => {
    expect(isAdmin(user(["admin"]))).toBe(true);
    expect(isAdmin(user(["editor"]))).toBe(false);
    expect(isAutomation(user(["automation"]))).toBe(true);
    expect(hasRole(user(["reviewer"]), "reviewer")).toBe(true);
  });
});
