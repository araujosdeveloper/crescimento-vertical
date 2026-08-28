import { describe, expect, it } from "vitest";

import { buildFeedXml } from "../src/lib/editorial/feed";
import { isSafeExternalUrl, safeExternalLinkProps, sanitizeContentUrl } from "../src/lib/editorial/links";
import { toArticleDetail, toArticleListItem, toPublicAuthor, toPublicCategory, toSafeImage } from "../src/lib/editorial/mappers";
import { computePagination, normalizePage } from "../src/lib/editorial/pagination";
import { publicArticlesWhere, withPublicArticlesWhere } from "../src/lib/editorial/query";
import {
  absoluteUrl,
  articleJsonLd,
  articleMetadata,
  authorMetadata,
  breadcrumbJsonLd,
  categoryMetadata,
  isNoindexEnabled,
  resolveCanonical,
  truncateMetaDescription,
  truncateMetaTitle,
} from "../src/lib/editorial/seo";
import type { ArticleDetail } from "../src/lib/editorial/types";

const rawArticle = {
  id: 1,
  _status: "published",
  workflowStatus: "published",
  title: "Título do artigo",
  slug: "titulo-do-artigo",
  excerpt: "Resumo público",
  publishedAt: "2026-08-01T12:00:00.000Z",
  updatedAt: "2026-08-02T12:00:00.000Z",
  content: { root: { children: [] } },
  heroImage: {
    url: "/api/media/file/img.png",
    alt: "Imagem ilustrativa",
    width: 1600,
    height: 900,
    sizes: { feature: { url: "/api/media/file/img-feature.png" } },
  },
  author: { name: "Autor Público", slug: "autor-publico", email: "autor@exemplo.com", biography: "Bio interna" },
  category: { name: "Categoria", slug: "categoria", description: "Descrição" },
  seo: { seoTitle: "Título SEO", seoDescription: "Descrição SEO", canonicalUrl: null, noindex: false },
  sources: [{ url: "https://fonte.com" }],
  dossier: "id-dossie",
  tags: [{ tag: "tag" }],
  password: "senha-secreta",
  roles: ["admin"],
  email: "admin@exemplo.com",
};

describe("DTO público — não expõe campos internos", () => {
  it("item de listagem expõe somente campos públicos", () => {
    const item = toArticleListItem(rawArticle);
    expect(item).toEqual({
      title: "Título do artigo",
      slug: "titulo-do-artigo",
      summary: "Resumo público",
      publishedAt: "2026-08-01T12:00:00.000Z",
      featuredImage: { url: "/api/media/file/img-feature.png", alt: "Imagem ilustrativa", width: 1600, height: 900 },
      author: { name: "Autor Público", slug: "autor-publico" },
      category: { name: "Categoria", slug: "categoria" },
      contentType: "news",
      contentTypeLabel: "Notícias",
      publicReviewer: null,
      readingTime: null,
      tags: [],
    });
  });

  it("detalhe expõe somente metadados públicos de SEO", () => {
    const detail = toArticleDetail(rawArticle);
    expect(detail.seo).toEqual({
      metaTitle: "Título SEO",
      metaDescription: "Descrição SEO",
      canonicalUrl: null,
    });
    expect(detail.updatedAt).toBe("2026-08-02T12:00:00.000Z");
    expect(detail.content).toEqual({ root: { children: [] } });
  });

  it("nenhum campo interno vaza para o DTO serializado", () => {
    const detail = toArticleDetail(rawArticle);
    const serialized = JSON.stringify(detail);
    for (const forbidden of [
      "senha-secreta",
      "admin@exemplo.com",
      "autor@exemplo.com",
      "https://fonte.com",
      "id-dossie",
      '"workflowStatus"',
      '"_status"',
      '"roles"',
      '"password"',
      '"noindex"',
      '"sources"',
      '"dossier"',
    ]) {
      expect(serialized).not.toContain(forbidden);
    }
  });

  it("perfil de autor público não inclui e-mail nem dados administrativos", () => {
    const author = toPublicAuthor({
      name: "Autor Público",
      slug: "autor-publico",
      biography: "Bio",
      email: "autor@exemplo.com",
      roles: ["admin"],
    });
    expect(author).toEqual({
      name: "Autor Público",
      slug: "autor-publico",
      biography: "Bio",
      photo: null,
    });
    expect(JSON.stringify(author)).not.toContain("autor@exemplo.com");
  });

  it("categoria pública inclui descrição e não expõe internos", () => {
    expect(
      toPublicCategory({ name: "Cat", slug: "cat", description: "Desc" }),
    ).toEqual({ name: "Cat", slug: "cat", description: "Desc" });
  });

  it("imagem segura exige alt obrigatório", () => {
    expect(toSafeImage({ url: "/x.png", alt: "" })).toBeNull();
    expect(toSafeImage({ url: "", alt: "alt" })).toBeNull();
    expect(toSafeImage(null)).toBeNull();
    expect(toSafeImage({ url: "/x.png", alt: "alt" })).toEqual({
      url: "/x.png",
      alt: "alt",
    });
  });
});

describe("filtro público de artigos", () => {
  it("exige _status e workflowStatus publicados e publishedAt no passado", () => {
    const now = new Date("2026-08-03T00:00:00.000Z");
    const where = publicArticlesWhere(now) as {
      and: Array<Record<string, Record<string, string>>>;
    };
    const conditions = where.and;

    expect(conditions).toContainEqual({ _status: { equals: "published" } });
    expect(conditions).toContainEqual({ workflowStatus: { equals: "published" } });
    expect(conditions).toContainEqual({
      publishedAt: { less_than_equal: now.toISOString() },
    });
  });

  it("combina filtro público com condição adicional", () => {
    const where = withPublicArticlesWhere({ slug: { equals: "x" } }) as {
      and: Array<Record<string, unknown>>;
    };
    expect(where.and).toHaveLength(4);
    expect(where.and[3]).toEqual({ slug: { equals: "x" } });
  });
});

describe("paginação", () => {
  it("normaliza página inválida para 1", () => {
    expect(normalizePage(undefined)).toBe(1);
    expect(normalizePage("abc")).toBe(1);
    expect(normalizePage("0")).toBe(1);
    expect(normalizePage("-1")).toBe(1);
    expect(normalizePage("2")).toBe(2);
    expect(normalizePage("3.7")).toBe(3);
  });

  it("calcula totalPages e flags, inclusive para coleção vazia", () => {
    expect(computePagination(0, 1, 12)).toEqual({
      totalDocs: 0,
      totalPages: 0,
      hasNextPage: false,
      hasPrevPage: false,
    });
    expect(computePagination(25, 1, 12)).toMatchObject({
      totalPages: 3,
      hasNextPage: true,
      hasPrevPage: false,
    });
    expect(computePagination(25, 3, 12)).toMatchObject({
      hasNextPage: false,
      hasPrevPage: true,
    });
  });
});

describe("segurança de links", () => {
  it("aceita somente http/https/mailto/tel", () => {
    expect(isSafeExternalUrl("https://exemplo.com")).toBe(true);
    expect(isSafeExternalUrl("http://exemplo.com")).toBe(true);
    expect(isSafeExternalUrl("mailto:contato@exemplo.com")).toBe(true);
    expect(isSafeExternalUrl("tel:+5511999999999")).toBe(true);
    expect(isSafeExternalUrl("javascript:alert(1)")).toBe(false);
    expect(isSafeExternalUrl("data:text/html,<script>alert(1)</script>")).toBe(false);
    expect(isSafeExternalUrl("ftp://exemplo.com")).toBe(false);
    expect(isSafeExternalUrl("")).toBe(false);
  });

  it("atribui target/rel somente a links externos seguros", () => {
    process.env.NEXT_PUBLIC_SITE_URL = "https://crescimentovertical.com";
    expect(safeExternalLinkProps("https://exemplo.com")).toEqual({
      target: "_blank",
      rel: "noopener noreferrer",
    });
    expect(safeExternalLinkProps("https://crescimentovertical.com/conteudos")).toEqual({});
    expect(safeExternalLinkProps("/conteudos")).toEqual({});
    expect(safeExternalLinkProps("javascript:alert(1)")).toEqual({});
  });

  it("sanitiza URLs de conteúdo", () => {
    expect(sanitizeContentUrl("javascript:alert(1)")).toBe("#");
    expect(sanitizeContentUrl("https://exemplo.com")).toBe("https://exemplo.com");
    expect(sanitizeContentUrl(null)).toBe("#");
  });
});

describe("SEO e metadados", () => {
  const siteUrl = "https://crescimentovertical.com";

  it("monta URL absoluta e canonical", () => {
    process.env.NEXT_PUBLIC_SITE_URL = "https://crescimentovertical.com/";
    expect(absoluteUrl("/conteudos")).toBe("https://crescimentovertical.com/conteudos");
    expect(resolveCanonical("/x")).toBe("https://crescimentovertical.com/x");
    expect(resolveCanonical("/x", "https://canonico.com/y")).toBe("https://canonico.com/y");
    expect(resolveCanonical("/x", "javascript:alert(1)")).toBe("https://crescimentovertical.com/x");
  });

  it("trunca título e descrição nos limites recomendados", () => {
    expect(truncateMetaTitle("a".repeat(100))).toHaveLength(60);
    expect(truncateMetaDescription("b".repeat(200))).toHaveLength(160);
    expect(truncateMetaTitle("curto")).toBe("curto");
  });

  it("gera metadata de artigo com canonical e noindex em staging", () => {
    process.env.NEXT_PUBLIC_SITE_URL = siteUrl;
    process.env.SITE_NOINDEX = "true";

    const article = toArticleDetail(rawArticle) as ArticleDetail;
    const metadata = articleMetadata(article);

    expect(metadata.title).toBe("Título SEO");
    expect(metadata.alternates?.canonical).toBe(`${siteUrl}/conteudos/titulo-do-artigo`);
    expect(metadata.robots).toMatchObject({ index: false, follow: false });
    expect(
      (metadata.openGraph as { type?: string } | null | undefined)?.type,
    ).toBe("article");
    expect(
      (metadata.twitter as { card?: string } | null | undefined)?.card,
    ).toBe("summary_large_image");

    process.env.SITE_NOINDEX = "false";
    expect(articleMetadata(article).robots).toMatchObject({ index: true, follow: true });
    delete process.env.SITE_NOINDEX;
  });

  it("canonical explícito do artigo prevalece", () => {
    process.env.NEXT_PUBLIC_SITE_URL = siteUrl;
    const article = toArticleDetail({
      ...rawArticle,
      seo: { ...rawArticle.seo, canonicalUrl: "https://canonico.com/x" },
    }) as ArticleDetail;
    expect(articleMetadata(article).alternates?.canonical).toBe("https://canonico.com/x");
  });

  it("isNoindexEnabled reflete SITE_NOINDEX", () => {
    process.env.SITE_NOINDEX = "true";
    expect(isNoindexEnabled()).toBe(true);
    delete process.env.SITE_NOINDEX;
    expect(isNoindexEnabled()).toBe(false);
  });

  it("gera metadata de categoria e autor", () => {
    process.env.NEXT_PUBLIC_SITE_URL = siteUrl;
    expect(
      categoryMetadata({ name: "IA", slug: "ia", description: "Conteúdo de IA" }).alternates
        ?.canonical,
    ).toBe(`${siteUrl}/categorias/ia`);
    expect(
      categoryMetadata({ name: "IA", slug: "ia", description: null }).title,
    ).toContain("IA");
    expect(
      authorMetadata({ name: "Fulano", slug: "fulano", biography: null, photo: null })
        .alternates?.canonical,
    ).toBe(`${siteUrl}/autores/fulano`);
  });
});

describe("JSON-LD", () => {
  it("gera Article com URL absoluta e autor", () => {
    process.env.NEXT_PUBLIC_SITE_URL = "https://crescimentovertical.com";
    const article = toArticleDetail(rawArticle) as ArticleDetail;
    const jsonLd = articleJsonLd(article) as Record<string, unknown>;
    expect(jsonLd["@type"]).toBe("Article");
    expect(jsonLd.headline).toBe("Título do artigo");
    expect(jsonLd.mainEntityOfPage).toBe(
      "https://crescimentovertical.com/conteudos/titulo-do-artigo",
    );
    expect((jsonLd.author as Record<string, unknown>).name).toBe("Autor Público");
    expect((jsonLd.publisher as Record<string, unknown>).name).toBe(
      "Crescimento Vertical",
    );
  });

  it("gera BreadcrumbList com posições sequenciais", () => {
    process.env.NEXT_PUBLIC_SITE_URL = "https://crescimentovertical.com";
    const jsonLd = breadcrumbJsonLd([
      { name: "Início", href: "/" },
      { name: "Conteúdos", href: "/conteudos" },
    ]) as Record<string, unknown>;
    expect(jsonLd["@type"]).toBe("BreadcrumbList");
    const items = jsonLd.itemListElement as Array<Record<string, unknown>>;
    expect(items).toHaveLength(2);
    expect(items[0].position).toBe(1);
    expect(items[1].item).toBe("https://crescimentovertical.com/conteudos");
  });
});

describe("feed RSS", () => {
  it("inclui somente entradas com publishedAt e escapa o conteúdo", () => {
    process.env.NEXT_PUBLIC_SITE_URL = "https://crescimentovertical.com";
    const xml = buildFeedXml([
      {
        title: "Título & <especial>",
        slug: "titulo-especial",
        summary: "Resumo com <tag>",
        publishedAt: "2026-08-01T12:00:00.000Z",
        updatedAt: "2026-08-02T12:00:00.000Z",
      },
      {
        title: "Sem data",
        slug: "sem-data",
        summary: null,
        publishedAt: null,
        updatedAt: null,
      },
    ]);

    expect(xml).toContain("Título &amp; &lt;especial&gt;");
    expect(xml).toContain("Resumo com &lt;tag&gt;");
    expect(xml).toContain("/conteudos/titulo-especial");
    expect(xml).not.toContain("sem-data");
  });
});
