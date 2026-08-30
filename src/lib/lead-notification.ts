import { createHash } from "node:crypto";
import nodemailer, { type Transporter } from "nodemailer";
import type SMTPTransport from "nodemailer/lib/smtp-transport";
import type { LeadSmtpConfig } from "./lead-smtp-config";

export type Notification = { messageId: string; subject: string; text: string; html: string };

export function stableMessageId(notificationKey: string) {
  return `<lead-${createHash("sha256").update(`cv-phase7:${notificationKey}`).digest("hex")}@crescimentovertical.com>`;
}

export function buildLeadNotification(input: { notificationKey: string; leadId: number; receivedAt: Date; adminBaseUrl: string }): Notification {
  const identifier = input.notificationKey;
  const when = input.receivedAt.toISOString();
  const link = `${input.adminBaseUrl}/admin/collections/leads/${input.leadId}`;
  return {
    messageId: stableMessageId(identifier),
    subject: "Nova solicitação de diagnóstico — Crescimento Vertical",
    text: `Uma nova solicitação foi recebida.\nData/hora: ${when}\nIdentificador interno: ${identifier}\nAcesse o painel autenticado para consultar os dados: ${link}\n`,
    html: `<p>Uma nova solicitação foi recebida.</p><p>Data/hora: ${when}<br>Identificador interno: ${identifier}</p><p><a href="${link}">Acesse o painel autenticado para consultar os dados</a>.</p>`,
  };
}

export function createLeadTransport(config: LeadSmtpConfig): Transporter {
  const options: SMTPTransport.Options = { host: config.host, port: config.port, secure: true, auth: { user: config.user, pass: config.password }, connectionTimeout: 10_000, greetingTimeout: 10_000, socketTimeout: 20_000, logger: false, debug: false, tls: { servername: config.host, minVersion: "TLSv1.2" } };
  return nodemailer.createTransport(options);
}

export async function sendLeadNotification(transport: Transporter, config: LeadSmtpConfig, notification: Notification) {
  const result = await transport.sendMail({ from: config.from, to: config.to, subject: notification.subject, text: notification.text, html: notification.html, messageId: notification.messageId, headers: { "X-Auto-Response-Suppress": "All" } });
  return { accepted: Array.isArray(result.accepted) && result.accepted.length > 0, messageId: notification.messageId };
}
