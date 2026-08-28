import { describe, expect, it } from "vitest";
import { CONTENT_TYPES, CONTENT_TYPE_LABELS } from "@/lib/editorial";
import { toArticleDetail } from "@/lib/editorial/mappers";
import { publicArticlesWhere } from "@/lib/editorial/query";

describe("experiência editorial", () => {
  it("mantém os cinco tipos fechados e seus rótulos", () => {
    expect(CONTENT_TYPES).toEqual(["news", "analysis", "guide", "tool", "comparison"]);
    expect(Object.values(CONTENT_TYPE_LABELS)).toEqual(["Notícias", "Análises", "Guias", "Ferramentas", "Comparativos"]);
  });
  it("mapeia atribuição e citações sem campos internos", () => {
    const article = toArticleDetail({ title: "Teste", slug: "teste", contentType: "guide", publicReviewer: { name: "Revisor", slug: "revisor", email: "privado" }, publicCitations: [{ title: "Fonte", publisher: "P", url: "https://example.com", accessedAt: "2026-08-28", sourceType: "press", isPrimary: true }], workflowStatus: "published", roles: ["admin"], editorialNotes: "privado" });
    expect(article.contentTypeLabel).toBe("Guias");
    expect(article.publicReviewer).toEqual({ name: "Revisor", slug: "revisor" });
    expect(JSON.stringify(article)).not.toMatch(/email|roles|editorialNotes|workflowStatus/);
  });
  it("filtro público exige publicação e data não futura", () => {
    const where = publicArticlesWhere(new Date("2026-08-28T00:00:00Z"));
    expect(JSON.stringify(where)).toContain("published");
    expect(JSON.stringify(where)).toContain("2026-08-28");
  });
});
