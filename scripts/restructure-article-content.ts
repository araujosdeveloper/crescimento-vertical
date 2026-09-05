import { getPayload } from "payload";
import config from "../payload.config";

function p(text: string) {
  return {
    type: "paragraph" as const,
    format: "",
    indent: 0,
    version: 1,
    children: [{ text, type: "text" as const, version: 1 }],
    direction: "ltr" as const,
  };
}

function h(text: string) {
  return {
    type: "heading" as const,
    tag: "h2" as const,
    format: "",
    indent: 0,
    version: 1,
    children: [{ text, type: "text" as const, version: 1 }],
    direction: "ltr" as const,
  };
}

const blocks = [
  p(
    "O mercado de agentes de IA para vendas e atendimento chegou às pequenas empresas por caminhos distintos — e mais rápido do que se imaginava. Veja o que Meta, OpenAI e Talkdesk já anunciaram e o que isso muda para o seu negócio.",
  ),
  h("Meta: do Business AI ao Business Agent"),
  p(
    "A Meta lançou em outubro de 2025 o Business AI, agente de vendas turnkey para WhatsApp, Messenger, anúncios e sites de e-commerce — gratuito em anúncios e pensado para empresas sem equipe técnica. Em junho de 2026, evoluiu para o Meta Business Agent: ativação gratuita inicial, expansão global e recursos para qualificar leads, agendar compromissos e fechar vendas, além de uma plataforma para integrar sistemas como Shopify e Zendesk.",
  ),
  h("OpenAI: Presence, focado em enterprise"),
  p(
    "A OpenAI posiciona o Presence (julho de 2026) como produto enterprise para agentes de voz e chat em suporte ao cliente e vendas outbound, com políticas, guardrails e escalada a humanos. A ausência de oferta self-service, porém, o mantém distante do orçamento das PMEs.",
  ),
  h("Adoção: o que diz a pesquisa da Talkdesk"),
  p(
    "Dados de adoção vêm da Talkdesk: pesquisa com 400 pequenos empresários dos EUA (ago/2025) indica que 51% já integram IA ao atendimento, 94% pretendem manter ou ampliar equipes humanas e os não adotantes citam receios de relevância e perda do toque pessoal.",
  ),
  h("O que isso significa para o seu negócio"),
  p(
    "Para pequenas empresas, a barreira de entrada caiu: agentes turnkey gratuitos no início, configuração sem código e handoff para equipes humanas são agora recursos anunciados oficialmente. A decisão de adoção, porém, depende de dados autorreportados pelos fornecedores e de pesquisa encomendada (somente EUA); o leitor deve exigir prova em ambiente próprio e desenhar supervisão humana, já que a maioria das PMEs usuárias de IA afirma manter ou ampliar equipes.",
  ),
  h("Limites e verificação"),
  p(
    "As fontes são comunicações oficiais dos fornecedores e os dados de adoção são autorreportados. Não há auditoria independente nem cobertura específica do mercado brasileiro nesta coleta; recomenda-se validar em ambiente próprio antes de decidir.",
  ),
];

async function main() {
  const payload = await getPayload({ config });
  const articleId = Number(process.env.ARTICLE_ID!);
  const admin = await payload.find({
    collection: "users",
    where: { email: { equals: "araujosdeveloper@gmail.com" } },
    limit: 1,
    overrideAccess: true,
  });
  await payload.update({
    collection: "articles",
    id: articleId,
    data: {
      content: {
        root: {
          type: "root",
          format: "",
          indent: 0,
          version: 1,
          children: blocks,
          direction: "ltr",
        },
      } as never,
    },
    overrideAccess: true,
    user: admin.docs[0],
    context: { restructureContent: true },
  });
  console.log("RESTRUCTURE_OK", articleId);
}

main().catch((e) => {
  console.error("ERROR", e?.message ?? e);
  process.exit(1);
});
