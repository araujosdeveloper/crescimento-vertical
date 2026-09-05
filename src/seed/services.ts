import { getPayload } from "payload";
import config from "../../payload.config";

type CommercialServiceSeed = {
  title: string;
  slug: string;
  shortDescription: string;
  positioning: string;
  targetAudience: string;
  problems: string[];
  deliverables: string[];
  processSteps: string[];
  capabilities: string[];
  order: number;
};

export const COMMERCIAL_SERVICES: CommercialServiceSeed[] = [
  {
    title: "Sites e landing pages",
    slug: "sites-e-landing-pages",
    shortDescription:
      "Sites e landing pages construídos para explicar sua oferta, converter visitantes em contatos e integrar-se aos seus canais de atendimento.",
    positioning:
      "Construímos páginas com objetivo claro: comunicar a proposta, orientar o visitante e capturar o próximo passo.",
    targetAudience:
      "Empresas sem presença digital estruturada ou cujo site atual informa sem gerar contatos.",
    problems: [
      "Site que não deixa claro o que a empresa faz",
      "Visitantes que saem sem deixar contato",
      "Páginas lentas ou difíceis de manter",
      "Presença desalinhada com WhatsApp e redes",
    ],
    deliverables: [
      "Estrutura de páginas e navegação",
      "Landing page de oferta ou campanha",
      "Formulário de contato e CTAs",
      "Integração com WhatsApp e e-mail",
    ],
    processSteps: [
      "Diagnóstico de posicionamento",
      "Arquitetura de conteúdo",
      "Design e implementação",
      "Publicação e medição",
    ],
    capabilities: [
      "Conversão orientada por estrutura",
      "Desempenho e responsividade",
      "Manutenção evolutiva",
    ],
    order: 1,
  },
  {
    title: "Tráfego e conversão",
    slug: "trafego-e-conversao",
    shortDescription:
      "Campanhas e jornadas planejadas para levar visitantes qualificados a uma estrutura que os converte em contatos.",
    positioning:
      "Planejamos aquisição, páginas e mensuração como um só sistema — sem prometer resultados garantidos.",
    targetAudience:
      "Empresas que já têm oferta clara e precisam melhorar a previsibilidade da aquisição.",
    problems: [
      "Campanhas desconectadas do site",
      "Investimento sem mensuração de retorno",
      "Funis que não qualificam o contato",
      "Pouca clareza sobre o próximo passo do lead",
    ],
    deliverables: [
      "Plano de aquisição e canais",
      "Funil e páginas de destino",
      "Eventos e mensuração de conversão",
      "Otimização contínua",
    ],
    processSteps: [
      "Contexto e oferta",
      "Plano de tráfego",
      "Execução e criativos",
      "Análise e ajuste",
    ],
    capabilities: [
      "Criativos orientados a conversão",
      "Jornadas com CTA claro",
      "Mensuração de origem e conversão",
    ],
    order: 2,
  },
  {
    title: "Automação de WhatsApp",
    slug: "automacao-whatsapp",
    shortDescription:
      "Atendimento inicial, qualificação e encaminhamento automatizados no WhatsApp, preservando a decisão humana.",
    positioning:
      "Automatizamos as etapas repetitivas do atendimento para que sua equipe foque no que exige julgamento.",
    targetAudience:
      "Operações que recebem volume de contatos no WhatsApp e perdem oportunidades por atraso ou desorganização.",
    problems: [
      "Respostas lentas fora do horário comercial",
      "Follow-ups esquecidos",
      "Contatos que chegam sem qualificação",
      "Atendimento manual que não acompanha a demanda",
    ],
    deliverables: [
      "Fluxos de atendimento inicial",
      "Qualificação e encaminhamento",
      "Respostas automáticas com contexto",
      "Registro e acompanhamento de conversas",
    ],
    processSteps: [
      "Mapeamento do atendimento atual",
      "Desenho dos fluxos",
      "Integração com canais e CRM",
      "Acompanhamento e ajuste",
    ],
    capabilities: [
      "Atendimento inicial contínuo",
      "Follow-up programado",
      "Integração com ferramentas existentes",
    ],
    order: 3,
  },
  {
    title: "Agentes de IA",
    slug: "agentes-de-ia",
    shortDescription:
      "Agentes de IA especializados, com limites definidos, revisão humana e rastreabilidade de decisão.",
    positioning:
      "Aplicamos IA a tarefas bem delimitadas e auditáveis, sempre com supervisão e escopo controlado.",
    targetAudience:
      "Equipes que querem assistência de IA em tarefas repetitivas sem abrir mão de controle.",
    problems: [
      "Informação dispersa entre sistemas",
      "Tarefas manuais repetitivas",
      "IA genérica sem contexto da empresa",
      "Falta de rastreabilidade nas respostas",
    ],
    deliverables: [
      "Definição de escopo do agente",
      "Bases de conhecimento autorizadas",
      "Fluxos com revisão humana",
      "Registro de decisões e limites",
    ],
    processSteps: [
      "Descoberta do problema",
      "Prototipação controlada",
      "Validação com casos reais",
      "Operação e monitoramento",
    ],
    capabilities: [
      "Bases autorizadas",
      "Revisão humana obrigatória",
      "Rastreabilidade e limites",
    ],
    order: 4,
  },
  {
    title: "Integrações n8n",
    slug: "integracoes-n8n",
    shortDescription:
      "Ferramentas conectadas por workflows determinísticos com webhooks, APIs e tratamento de falhas.",
    positioning:
      "Orquestramos processos entre sistemas de forma previsível e auditável, sem código disperso.",
    targetAudience:
      "Empresas com ferramentas que não conversam entre si e retrabalho manual entre elas.",
    problems: [
      "Retrabalho copiando dados entre sistemas",
      "Falhas sem visibilidade",
      "Processos dependentes de uma pessoa",
      "Ferramentas isoladas",
    ],
    deliverables: [
      "Inventário de sistemas e dados",
      "Workflows de integração",
      "Tratamento de erros e retry",
      "Observabilidade e logs",
    ],
    processSteps: [
      "Inventário e contrato",
      "Implementação dos workflows",
      "Testes de falha",
      "Monitoramento contínuo",
    ],
    capabilities: [
      "APIs e webhooks",
      "Recuperação de falhas",
      "Auditoria de execução",
    ],
    order: 5,
  },
  {
    title: "Consultoria e suporte",
    slug: "consultoria-e-suporte",
    shortDescription:
      "Diagnóstico técnico, priorização e evolução recorrente da operação digital da sua empresa.",
    positioning:
      "Apoiamos decisões técnicas e a evolução da operação dentro de escopo contratado e com entregas verificáveis.",
    targetAudience:
      "Empresas que precisam de direção técnica contínua sem equipe interna dedicada.",
    problems: [
      "Prioridades difusas de tecnologia",
      "Operação sem revisão periódica",
      "Dependência de soluções pontuais",
      "Falta de um roadmap claro",
    ],
    deliverables: [
      "Diagnóstico técnico",
      "Roadmap priorizado",
      "Suporte e manutenção",
      "Revisões periódicas",
    ],
    processSteps: [
      "Contexto e diagnóstico",
      "Priorização",
      "Plano de execução",
      "Revisão e evolução",
    ],
    capabilities: [
      "Arquitetura e processos",
      "Monitoramento",
      "Relacionamento recorrente",
    ],
    order: 6,
  },
];

export async function seedServices() {
  const payload = await getPayload({ config });
  for (const service of COMMERCIAL_SERVICES) {
    const existing = await payload.find({
      collection: "services",
      where: { slug: { equals: service.slug } },
      limit: 1,
      overrideAccess: true,
    });
    const data = {
      title: service.title,
      slug: service.slug,
      shortDescription: service.shortDescription,
      positioning: service.positioning,
      targetAudience: service.targetAudience,
      problems: service.problems.map((value) => ({ value })),
      deliverables: service.deliverables.map((value) => ({ value })),
      processSteps: service.processSteps.map((value) => ({ value })),
      capabilities: service.capabilities.map((value) => ({ value })),
      order: service.order,
      active: true,
      featured: service.order <= 2,
      primaryCTAType: "diagnostic" as const,
      primaryCTALabel: "Solicitar diagnóstico",
      _status: "published" as const,
      publishedAt: new Date().toISOString(),
    };
    if (existing.docs[0]) {
      await payload.update({
        collection: "services",
        id: existing.docs[0].id,
        data,
        overrideAccess: true,
        context: { seedServices: true },
      });
    } else {
      await payload.create({
        collection: "services",
        data,
        overrideAccess: true,
        context: { seedServices: true },
      });
    }
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  seedServices()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}
