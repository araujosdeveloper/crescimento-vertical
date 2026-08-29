import type { CollectionConfig } from "payload";
import { leadsCreate, leadsDelete, leadsRead, leadsUpdate } from "../access";

const text = (name: string, label: string, required = false) => ({
  name,
  type: "text" as const,
  label,
  required,
  admin: { readOnly: name === "idempotencyKey" },
});

export const Leads: CollectionConfig = {
  slug: "leads",
  admin: { useAsTitle: "email", defaultColumns: ["email", "serviceInterest", "status", "createdAt"] },
  access: { read: leadsRead, create: leadsCreate, update: leadsUpdate, delete: leadsDelete },
  fields: [
    text("name", "Nome", true),
    text("email", "E-mail", true),
    text("phone", "Telefone"),
    text("company", "Empresa"),
    text("serviceInterest", "Serviço de interesse", true),
    text("operationalContext", "Contexto operacional"),
    text("challenge", "Desafio principal", true),
    { name: "contactPreference", type: "select", required: true, options: ["email", "phone", "whatsapp"].map((value) => ({ label: value, value })) },
    text("source", "Origem"),
    text("sourcePage", "Página de origem"),
    text("sourceContent", "Conteúdo de origem"),
    text("utmSource", "UTM source"), text("utmMedium", "UTM medium"), text("utmCampaign", "UTM campaign"), text("utmTerm", "UTM term"), text("utmContent", "UTM content"),
    text("referrer", "Referrer reduzido"),
    text("consentVersion", "Versão do consentimento", true),
    text("consentTextHash", "Hash do texto de consentimento", true),
    { name: "consentedAt", type: "date", required: true },
    { name: "status", type: "select", defaultValue: "new", options: [{ label: "Novo", value: "new" }, { label: "Em atendimento", value: "in_progress" }, { label: "Concluído", value: "closed" }, { label: "Descartado", value: "discarded" }] },
    text("idempotencyKey", "Chave de idempotência", true),
    { name: "retentionUntil", type: "date", required: true },
    { name: "notificationStatus", type: "select", defaultValue: "pending", options: [{ label: "Pendente", value: "pending" }, { label: "Enviado", value: "sent" }, { label: "Falhou", value: "failed" }] },
    { name: "notificationAttempts", type: "number", defaultValue: 0 },
    text("lastError", "Último erro sanitizado"),
  ],
};
