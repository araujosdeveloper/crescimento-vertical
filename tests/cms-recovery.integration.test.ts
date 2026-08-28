import { stat } from "node:fs/promises";
import path from "node:path";

import { afterAll, describe, expect, it } from "vitest";
import { getPayload, type Payload } from "payload";

import config from "../payload.config";

const runRecovery = process.env.RUN_CMS_RECOVERY === "1";
const describeRecovery = runRecovery ? describe : describe.skip;
const password = "Phase3-disposable-only-2026!";

describeRecovery("restauração isolada do CMS", () => {
  let payload: Payload | null = null;

  afterAll(async () => {
    if (payload) {
      await payload.destroy();
    }
  });

  it("recupera autenticação, relações, versões, mídia e visibilidade pública", async () => {
    const mediaDir = process.env.PAYLOAD_MEDIA_DIR;
    if (!mediaDir || !process.env.DATABASE_URL || !process.env.PAYLOAD_SECRET) {
      throw new Error("Ambiente de restauração não configurado.");
    }
    payload = await getPayload({ config });

    for (const role of ["admin", "editor", "reviewer", "researcher", "automation"]) {
      const email = `${role}.phase3@example.test`;
      const login = await payload.login({ collection: "users", data: { email, password } });
      expect(login.user?.email).toBe(email);
    }

    const counts = await Promise.all(
      ["users", "authors", "categories", "media", "sources", "research-dossiers", "articles"].map(
        (collection) => payload!.count({ collection: collection as "articles" }),
      ),
    );
    expect(counts.map((result) => result.totalDocs)).toEqual([6, 1, 1, 1, 1, 1, 2]);

    const published = await payload.find({
      collection: "articles",
      draft: false,
      overrideAccess: false,
      where: { slug: { equals: "artigo-descartavel-fase-3" } },
      depth: 2,
    });
    expect(published.docs).toHaveLength(1);
    expect(typeof published.docs[0]?.author).toBe("object");
    expect(typeof published.docs[0]?.category).toBe("object");
    expect(published.docs[0]?.sources).toHaveLength(1);

    const privateDraft = await payload.find({
      collection: "articles",
      draft: false,
      overrideAccess: false,
      where: { slug: { equals: "rascunho-automation-descartavel" } },
    });
    expect(privateDraft.docs).toHaveLength(0);

    const versions = await payload.findVersions({
      collection: "articles",
      where: { parent: { equals: published.docs[0]?.id } },
      limit: 100,
    });
    expect(versions.docs.length).toBeGreaterThanOrEqual(8);

    const media = await payload.find({ collection: "media", limit: 1, overrideAccess: true });
    const filename = media.docs[0]?.filename;
    expect(filename).toBeTruthy();
    expect((await stat(path.join(mediaDir, String(filename)))).size).toBeGreaterThan(0);
  }, 30_000);
});
