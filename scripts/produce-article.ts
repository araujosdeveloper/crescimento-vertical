import { getPayload } from "payload";
import config from "../payload.config";
import { readFileSync } from "node:fs";

const AI_DISCLOSURE =
  "Conteúdo preparado com auxílio de IA (Hermes) a partir de fontes primárias oficiais, com revisão humana obrigatória antes da publicação.";

function lexParagraph(text: string) {
  return {
    type: "paragraph" as const,
    format: "",
    indent: 0,
    version: 1,
    children: [{ text, type: "text" as const, version: 1 }],
    direction: "ltr" as const,
  };
}

function splitSentences(text: string, perParagraph: number): string[] {
  const sentences = text.split(/(?<=[.!?])\s+/).map((s) => s.trim()).filter(Boolean);
  const paragraphs: string[] = [];
  for (let i = 0; i < sentences.length; i += perParagraph) {
    paragraphs.push(sentences.slice(i, i + perParagraph).join(" "));
  }
  return paragraphs;
}

async function main() {
  const payload = await getPayload({ config });
  const dossier = JSON.parse(readFileSync(process.env.DOSSIER_PATH!, "utf-8"));

  const titleToFind = process.env.ARTICLE_TITLE!;
  const newTitle = process.env.NEW_TITLE!;
  const categorySlug = process.env.CATEGORY_SLUG!;
  const categoryName = process.env.CATEGORY_NAME!;
  const serviceSlug = process.env.SERVICE_SLUG!;
  const seoTitle = process.env.SEO_TITLE || newTitle;
  const seoDescription = process.env.SEO_DESCRIPTION || (dossier.dek || "").slice(0, 160);

  const articles = await payload.find({
    collection: "articles",
    where: { title: { equals: titleToFind } },
    limit: 1,
    overrideAccess: true,
  });
  if (!articles.docs[0]) {
    console.error("ERROR article not found:", titleToFind);
    process.exit(1);
  }
  const articleId = articles.docs[0].id as number;

  const sourceIds: number[] = [];
  for (const s of dossier.sources || []) {
    const existing = await payload.find({
      collection: "sources",
      where: { url: { equals: s.url } },
      limit: 1,
      overrideAccess: true,
    });
    let id: number;
    if (existing.docs[0]) {
      id = existing.docs[0].id as number;
    } else {
      const created = await payload.create({
        collection: "sources",
        data: {
          title: s.publisher,
          publisher: s.publisher,
          url: s.url,
          sourceLevel: s.sourceLevel || "A",
          sourceType: "press",
          reliability: "verified",
          publishedAt: s.publishedAt,
          collectedAt: new Date().toISOString(),
        },
        overrideAccess: true,
        context: { completeArticle: true },
      });
      id = created.id as number;
    }
    sourceIds.push(id);
  }

  let categoryId: number;
  const cat = await payload.find({
    collection: "categories",
    where: { slug: { equals: categorySlug } },
    limit: 1,
    overrideAccess: true,
  });
  if (cat.docs[0]) {
    categoryId = cat.docs[0].id as number;
  } else {
    const created = await payload.create({
      collection: "categories",
      data: { name: categoryName, slug: categorySlug, active: true },
      overrideAccess: true,
      context: { completeArticle: true },
    });
    categoryId = created.id as number;
  }

  const author = await payload.find({
    collection: "authors",
    where: { slug: { equals: "redacao-crescimento-vertical" } },
    limit: 1,
    overrideAccess: true,
  });
  const service = await payload.find({
    collection: "services",
    where: { slug: { equals: serviceSlug } },
    limit: 1,
    overrideAccess: true,
  });

  const bodyParagraphs: string[] = [];
  if (dossier.executiveSummary) {
    bodyParagraphs.push(...splitSentences(dossier.executiveSummary, 3));
  }
  const paragraphs = bodyParagraphs.map(lexParagraph);
  if (dossier.businessImpact) {
    paragraphs.push(lexParagraph(`O que isso significa para o seu negócio: ${dossier.businessImpact}`));
  }
  paragraphs.push(
    lexParagraph(
      "Limites e verificação: as fontes são comunicações oficiais dos fornecedores e os dados de adoção são autorreportados. Recomenda-se validar em ambiente próprio antes de decidir.",
    ),
  );

  const data = {
    title: newTitle,
    excerpt: dossier.dek || "",
    contentType: dossier.contentType || "analysis",
    businessImpact: dossier.businessImpact || "",
    aiDisclosure: AI_DISCLOSURE,
    content: {
      root: {
        type: "root",
        format: "",
        indent: 0,
        version: 1,
        children: paragraphs,
        direction: "ltr",
      },
    } as never,
    author: author.docs[0]?.id,
    category: categoryId,
    sources: sourceIds,
    relatedServices: service.docs[0]?.id ? [service.docs[0].id] : [],
    seo: { seoTitle, seoDescription },
  };

  const updated = (await payload.update({
    collection: "articles",
    id: articleId,
    data,
    overrideAccess: true,
    user: (await payload.find({ collection: "users", where: { email: { equals: "araujosdeveloper@gmail.com" } }, limit: 1, overrideAccess: true })).docs[0],
    context: { completeArticle: true },
  })) as unknown as { id: string | number; title: string };
  console.log("COMPLETE_OK", updated.id);
}

main().catch((e) => {
  console.error("ERROR", e?.message ?? e);
  process.exit(1);
});
