import { getPayload } from "payload";
import config from "../../payload.config";

export const COMMERCIAL_SERVICES = [
  ["Sites e landing pages","sites-e-landing-pages","Presença digital clara, rápida e preparada para orientar o próximo passo.",1],
  ["Tráfego e conversão","trafego-e-conversao","Campanhas e jornadas conectadas a uma estrutura de conversão.",2],
  ["Automação de WhatsApp","automacao-whatsapp","Atendimento inicial, organização e encaminhamento com contexto.",3],
  ["Agentes de IA","agentes-de-ia","Agentes especializados com limites, revisão e rastreabilidade.",4],
  ["Integrações n8n","integracoes-n8n","Ferramentas conectadas com webhooks, APIs e tratamento de falhas.",5],
  ["Consultoria e suporte","consultoria-e-suporte","Diagnóstico técnico, priorização e melhoria recorrente.",6],
] as const;

export async function seedServices() {
  const payload = await getPayload({ config });
  for (const [title, slug, shortDescription, order] of COMMERCIAL_SERVICES) {
    const existing = await payload.find({ collection: "services", where: { slug: { equals: slug } }, limit: 1, overrideAccess: true });
    const data = { title, slug, shortDescription, order, active: true, featured: order <= 2, primaryCTAType: "diagnostic" as const, primaryCTALabel: "Solicitar diagnóstico", problems: [], deliverables: [], processSteps: [], capabilities: [], _status: "published" as const, publishedAt: new Date().toISOString() };
    if (existing.docs[0]) await payload.update({ collection: "services", id: existing.docs[0].id, data, overrideAccess: true, context: { seedServices: true } });
    else await payload.create({ collection: "services", data, overrideAccess: true, context: { seedServices: true } });
  }
}

if (import.meta.url === `file://${process.argv[1]}`) seedServices().then(()=>process.exit(0)).catch((error)=>{ console.error(error); process.exit(1); });
