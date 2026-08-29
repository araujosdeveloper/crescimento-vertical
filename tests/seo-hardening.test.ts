import { describe, expect, it, vi } from "vitest";
import { serializeJsonLd } from "../src/components/editorial/json-ld";
import { articleJsonLd, organizationJsonLd, profilePageJsonLd, robotsMetadata, websiteJsonLd } from "../src/lib/editorial/seo";
import type { ArticleDetail } from "../src/lib/editorial/types";
import robots from "../src/app/robots";
import sitemap from "../src/app/sitemap";
import { readFileSync } from "node:fs";

const article = (contentType: ArticleDetail["contentType"]): ArticleDetail => ({ title: "Seguro </script><script>alert(1)</script>", slug: "seguro", summary: "Resumo", publishedAt: "2026-08-01T00:00:00Z", updatedAt: "2026-08-02T00:00:00Z", featuredImage: null, author: { name: "Autora", slug: "autora" }, category: null, contentType, contentTypeLabel: "Notícia", publicReviewer: null, readingTime: 1, tags: [], content: {}, seo: { metaTitle: null, metaDescription: null, canonicalUrl: null }, businessImpact: null, publicCitations: [], correctionHistory: [], relatedServices: [], relatedArticles: [], aiDisclosure: null });

describe("contratos SEO da Fase 6", () => {
  it("seleciona NewsArticle apenas para notícias", () => {
    expect(articleJsonLd(article("news"))["@type"]).toBe("NewsArticle");
    expect(articleJsonLd(article("analysis"))["@type"]).toBe("Article");
  });
  it("serializa JSON-LD válido sem permitir encerramento de script", () => {
    const serialized = serializeJsonLd(articleJsonLd(article("news")));
    expect(serialized).not.toContain("</script>");
    expect(JSON.parse(serialized).headline).toContain("</script>");
  });
  it("mantém IDs estáveis e não inclui dados pessoais", () => {
    const schemas = [organizationJsonLd(), websiteJsonLd(), profilePageJsonLd({ name: "Autora", slug: "autora", biography: null, photo: null })];
    const value = JSON.stringify(schemas);
    expect(value).toContain("https://crescimentovertical.com/#organization");
    expect(value).not.toMatch(/email|telephone|address/i);
  });
  it("staging prevalece sobre indexação específica", () => {
    vi.stubEnv("SITE_NOINDEX", "true");
    expect(robotsMetadata()).toMatchObject({ index: false, follow: false });
    vi.unstubAllEnvs();
  });
  it("staging bloqueia robots e produz sitemap vazio", async () => {
    vi.stubEnv("SITE_NOINDEX", "true");
    expect(robots()).toEqual({ rules: [{ userAgent: "*", disallow: "/" }] });
    expect(await sitemap()).toEqual([]);
    vi.unstubAllEnvs();
  });
  it("produção exclui superfícies privadas, busca e queries", () => {
    vi.stubEnv("SITE_NOINDEX", "false");
    expect(robots()).toMatchObject({ rules: [{ disallow: ["/admin", "/api", "/preview", "/busca", "/*?*"] }] });
    vi.unstubAllEnvs();
  });
  it("não contém analytics e reserva dimensões/sizes das imagens", () => {
    const tree = ["src/app/layout.tsx", "src/components/hero.tsx", "src/components/editorial/article-image.tsx"].map((path) => readFileSync(path, "utf8")).join("\n");
    expect(tree).not.toMatch(/gtag\(|googletagmanager|G-[A-Z0-9]+/i);
    expect(tree).toContain('sizes="100vw"');
    expect(tree).toMatch(/width=\{image\.width/);
    expect(tree).toMatch(/height=\{image\.height/);
  });
});
