import { mkdir, readFile, stat } from "node:fs/promises";
import path from "node:path";

import { afterAll, describe, expect, it } from "vitest";
import { getPayload, type Payload } from "payload";

import config from "../payload.config";

const runIntegration = process.env.RUN_CMS_INTEGRATION === "1";
const describeIntegration = runIntegration ? describe : describe.skip;

const password = "Phase3-disposable-only-2026!";
const png = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=",
  "base64",
);

describeIntegration("ciclo editorial completo em PostgreSQL descartável", () => {
  let payload: Payload | null = null;

  afterAll(async () => {
    if (payload) {
      await payload.destroy();
    }
  });

  it("preserva autenticação, papéis, mídia, drafts, versões e leitura pública", async () => {
    const mediaDir = process.env.PAYLOAD_MEDIA_DIR;
    if (!mediaDir || !process.env.DATABASE_URL || !process.env.PAYLOAD_SECRET) {
      throw new Error("Ambiente descartável da integração não configurado.");
    }
    await mkdir(mediaDir, { recursive: true });
    payload = await getPayload({ config });

    const admin = await payload.create({
      collection: "users",
      overrideAccess: true,
      data: {
        email: "admin.phase3@example.test",
        name: "Admin descartável",
        password,
        roles: ["admin"],
        active: true,
      },
    });

    async function createUser(
      role: "editor" | "reviewer" | "researcher" | "automation",
      active = true,
    ) {
      return payload!.create({
        collection: "users",
        overrideAccess: false,
        user: admin,
        data: {
          email: `${role}.phase3@example.test`,
          name: `${role} descartável`,
          password,
          roles: [role],
          active,
        },
      });
    }

    const editor = await createUser("editor");
    const reviewer = await createUser("reviewer");
    const researcher = await createUser("researcher");
    const automation = await createUser("automation");

    for (const email of [admin.email, editor.email, reviewer.email, researcher.email, automation.email]) {
      const login = await payload.login({ collection: "users", data: { email, password } });
      expect(login.user?.email).toBe(email);
    }

    await payload.create({
      collection: "users",
      overrideAccess: false,
      user: admin,
      data: {
        email: "inactive.phase3@example.test",
        name: "Inativo descartável",
        password,
        roles: ["editor"],
        active: false,
      },
    });
    await expect(
      payload.login({
        collection: "users",
        data: { email: "inactive.phase3@example.test", password },
      }),
    ).rejects.toThrow();

    const author = await payload.create({
      collection: "authors",
      overrideAccess: false,
      user: editor,
      data: { name: "Autor descartável", slug: "autor-descartavel", active: true },
    });
    const category = await payload.create({
      collection: "categories",
      overrideAccess: false,
      user: editor,
      data: { name: "Categoria descartável", slug: "categoria-descartavel", active: true },
    });
    const media = await payload.create({
      collection: "media",
      overrideAccess: false,
      user: editor,
      data: { alt: "Pixel descartável" },
      file: { data: png, mimetype: "image/png", name: "phase3-pixel.png", size: png.length },
    });
    expect(media.filename).toBeTruthy();
    const mediaFile = path.join(mediaDir, String(media.filename));
    expect((await stat(mediaFile)).size).toBeGreaterThan(0);
    expect((await readFile(mediaFile)).length).toBeGreaterThan(0);

    const source = await payload.create({
      collection: "sources",
      overrideAccess: false,
      user: researcher,
      data: {
        title: "Fonte descartável",
        publisher: "Exemplo",
        url: "https://example.test/fonte-phase3",
        reliability: "verified",
      },
    });
    const dossier = await payload.create({
      collection: "research-dossiers",
      overrideAccess: false,
      user: researcher,
      data: {
        topic: "Dossiê descartável",
        status: "validated",
        sources: [source.id],
      },
    });

    const articleData = {
      title: "Artigo descartável da Fase 3",
      slug: "artigo-descartavel-fase-3",
      excerpt: "Resumo descartável para validar o workflow.",
      content: {
        root: {
          type: "root" as const,
          format: "" as const,
          indent: 0,
          version: 1,
          direction: null,
          children: [],
        },
      },
      heroImage: media.id,
      author: author.id,
      category: category.id,
      sources: [source.id],
      dossier: dossier.id,
      workflowStatus: "draft" as const,
    };
    const draft = await payload.create({
      collection: "articles",
      draft: true,
      overrideAccess: false,
      user: editor,
      data: articleData,
    });

    const publicDraft = await payload.find({
      collection: "articles",
      draft: false,
      overrideAccess: false,
      where: { slug: { equals: draft.slug } },
    });
    expect(publicDraft.docs).toHaveLength(0);

    const anonymousPreview = await payload.find({
      collection: "articles",
      draft: true,
      overrideAccess: false,
      where: { slug: { equals: draft.slug } },
    });
    expect(anonymousPreview.docs).toHaveLength(0);
    const authenticatedPreview = await payload.find({
      collection: "articles",
      draft: true,
      overrideAccess: false,
      user: editor,
      where: { slug: { equals: draft.slug } },
    });
    expect(authenticatedPreview.docs).toHaveLength(1);

    const automationBlocked = await payload.update({
      collection: "articles",
      id: draft.id,
      overrideAccess: false,
      user: automation,
      data: { workflowStatus: "published" },
    });
    expect(automationBlocked.workflowStatus).toBe("draft");

    const inReview = await payload.update({
      collection: "articles",
      id: draft.id,
      overrideAccess: false,
      user: editor,
      data: { workflowStatus: "in_review" },
    });
    expect(inReview.workflowStatus).toBe("in_review");
    const approved = await payload.update({
      collection: "articles",
      id: draft.id,
      overrideAccess: false,
      user: reviewer,
      data: { workflowStatus: "approved" },
    });
    expect(approved.workflowStatus).toBe("approved");

    await expect(
      payload.update({
        collection: "articles",
        id: draft.id,
        overrideAccess: false,
        user: editor,
        data: { ...articleData, workflowStatus: "published" },
      }),
    ).rejects.toThrow();

    const published = await payload.update({
      collection: "articles",
      id: draft.id,
      overrideAccess: false,
      user: reviewer,
      data: { ...articleData, workflowStatus: "published" },
    });
    expect(published.workflowStatus).toBe("published");
    expect(published.publishedAt).toBeTruthy();

    const publicPublished = await payload.find({
      collection: "articles",
      draft: false,
      overrideAccess: false,
      where: { slug: { equals: draft.slug } },
    });
    expect(publicPublished.docs).toHaveLength(1);

    const versions = await payload.findVersions({
      collection: "articles",
      where: { parent: { equals: draft.id } },
      limit: 100,
    });
    expect(versions.docs.length).toBeGreaterThanOrEqual(4);

    const selfUpdate = await payload.update({
      collection: "users",
      id: editor.id,
      overrideAccess: false,
      user: editor,
      data: { roles: ["admin"], name: "Editor sem autoelevação" },
    });
    expect(selfUpdate.roles).toEqual(["editor"]);

    const archived = await payload.update({
      collection: "articles",
      id: draft.id,
      overrideAccess: false,
      user: reviewer,
      data: { workflowStatus: "archived" },
    });
    expect(archived.workflowStatus).toBe("archived");
    const publicArchived = await payload.find({
      collection: "articles",
      draft: false,
      overrideAccess: false,
      where: { slug: { equals: draft.slug } },
    });
    expect(publicArchived.docs).toHaveLength(0);

    await payload.update({
      collection: "articles",
      id: draft.id,
      overrideAccess: false,
      user: admin,
      data: { workflowStatus: "draft" },
    });
    await payload.update({
      collection: "articles",
      id: draft.id,
      overrideAccess: false,
      user: editor,
      data: { workflowStatus: "in_review" },
    });
    await payload.update({
      collection: "articles",
      id: draft.id,
      overrideAccess: false,
      user: reviewer,
      data: { workflowStatus: "approved" },
    });
    await payload.update({
      collection: "articles",
      id: draft.id,
      overrideAccess: false,
      user: reviewer,
      data: { ...articleData, workflowStatus: "published" },
    });

    const automationDraft = await payload.create({
      collection: "articles",
      draft: true,
      overrideAccess: false,
      user: automation,
      data: {
        title: "Rascunho automation descartável",
        slug: "rascunho-automation-descartavel",
        excerpt: "Permanece privado.",
        content: articleData.content,
      },
    });
    expect(automationDraft.workflowStatus).toBe("draft");
  }, 60_000);
});
