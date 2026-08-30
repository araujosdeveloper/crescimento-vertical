import type { CollectionConfig } from "payload";
import { leadOutboxCreate, leadOutboxDelete, leadOutboxRead, leadOutboxUpdate } from "../access";

export const LeadOutbox: CollectionConfig = {
  slug: "lead-outbox",
  admin: { useAsTitle: "type", defaultColumns: ["type", "state", "nextAttemptAt"] },
  access: { read: leadOutboxRead, create: leadOutboxCreate, update: leadOutboxUpdate, delete: leadOutboxDelete },
  fields: [
    { name: "lead", type: "relationship", relationTo: "leads", required: true },
    { name: "type", type: "select", required: true, options: [{ label: "Notificação comercial", value: "commercial_notification" }] },
    { name: "state", type: "select", defaultValue: "pending", options: [{ label: "Pendente", value: "pending" }, { label: "Processando", value: "processing" }, { label: "Enviado", value: "sent" }, { label: "Falhou", value: "failed" }] },
    { name: "attempts", type: "number", defaultValue: 0 },
    { name: "nextAttemptAt", type: "date" },
    { name: "lastError", type: "text" },
    { name: "notificationKey", type: "text", required: true, unique: true, admin: { readOnly: true } },
    { name: "claimedAt", type: "date", admin: { readOnly: true } },
    { name: "sentAt", type: "date", admin: { readOnly: true } },
    { name: "deliveredAt", type: "date", admin: { readOnly: true } },
    { name: "messageId", type: "text", admin: { readOnly: true } },
  ],
};
