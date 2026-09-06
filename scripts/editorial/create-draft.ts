import { getPayload } from "payload";
import config from "../../payload.config";

/**
 * Cria um rascunho de artigo a partir do tópico da pauta (título = tópico).
 * Executado no container `migrate` (com acesso ao banco de produção).
 * Env: TITLE
 */
async function main() {
  const payload = await getPayload({ config });
  const title = process.env.TITLE!.trim();

  const existing = await payload.find({
    collection: "articles",
    where: { title: { equals: title } },
    limit: 1,
    overrideAccess: true,
  });
  if (existing.docs[0]) {
    console.log("DRAFT_EXISTS", existing.docs[0].id);
    return;
  }

  const created = (await payload.create({
    collection: "articles",
    data: {
      title,
      _status: "draft",
      workflowStatus: "draft",
    } as never,
    overrideAccess: true,
    context: { editorialCycle: true },
  })) as unknown as { id: number };
  console.log("DRAFT_CREATED", created.id);
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error("ERROR", e?.message ?? e);
    process.exit(1);
  });
