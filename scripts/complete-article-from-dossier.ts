import { getPayload } from "payload";
import config from "../payload.config";
import { readFileSync } from "node:fs";

const NEW_TITLE = "Agentes de IA para vendas e atendimento chegam às pequenas empresas";
const SEO_TITLE = "Agentes de IA para vendas e atendimento nas PMEs";
const SEO_DESCRIPTION =
  "O que Meta, OpenAI e Talkdesk já oferecem em agentes de IA para vendas e atendimento — e o que as PMEs devem verificar antes de adotar.";
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

async function main() {
  const payload = await getPayload({ config });
  const dossier = JSON.parse(
    (process.env.DOSSIER_PATH
      ? readFileSync(process.env.DOSSIER_PATH, "utf-8")
      : process.env.DOSSIER_JSON!) as string,
  );

  const titleToFind = process.env.ARTICLE_TITLE!;
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

  // Fontes: cria se não existir (por URL) e retorna IDs.
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

  // Categoria "Inteligência Artificial" (se não existir).
  let categoryId: number;
  const cat = await payload.find({
    collection: "categories",
    where: { slug: { equals: "inteligencia-artificial" } },
    limit: 1,
    overrideAccess: true,
  });
  if (cat.docs[0]) {
    categoryId = cat.docs[0].id as number;
  } else {
    const created = await payload.create({
      collection: "categories",
      data: { name: "Inteligência Artificial", slug: "inteligencia-artificial", active: true },
      overrideAccess: true,
      context: { completeArticle: true },
    });
    categoryId = created.id as number;
  }

  // Autor "Redação Crescimento Vertical".
  const author = await payload.find({
    collection: "authors",
    where: { slug: { equals: "redacao-crescimento-vertical" } },
    limit: 1,
    overrideAccess: true,
  });

  // Serviço relacionado "agentes-de-ia".
  const service = await payload.find({
    collection: "services",
    where: { slug: { equals: "agentes-de-ia" } },
    limit: 1,
    overrideAccess: true,
  });

  const paragraphs = [
    lexParagraph(dossier.executiveSummary || ""),
    lexParagraph((dossier.businessImpact || "") && `O que isso significa para o seu negócio: ${dossier.businessImpact}`),
    lexParagraph(
      "Limites e verificação: as fontes são comunicações oficiais dos fornecedores e os dados de adoção são autorreportados. Não há auditoria independente nem cobertura específica do mercado brasileiro nesta coleta; recomenda-se validar em ambiente próprio antes de decidir.",
    ),
  ].filter((p) => (p.children[0].text as string).trim().length > 0);

  const data = {
    title: NEW_TITLE,
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
    seo: { seoTitle: SEO_TITLE, seoDescription: SEO_DESCRIPTION },
  };

  const updated = (await payload.update({
    collection: "articles",
    id: articleId,
    data,
    overrideAccess: true,
    context: { completeArticle: true },
  })) as unknown as { id: string | number; title: string };
  console.log("COMPLETE_OK", updated.id, updated.title);
}

main().catch((e) => {
  console.error("ERROR", e?.message ?? e);
  process.exit(1);
});
