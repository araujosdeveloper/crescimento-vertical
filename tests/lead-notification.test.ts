import { describe, expect, it } from "vitest";
import { buildLeadNotification, sendLeadNotification, stableMessageId } from "../src/lib/lead-notification";

describe("notificação mínima sem PII", () => {
  it("gera Message-ID estável e link HTTPS do Admin", () => {
    const input={notificationKey:"32d240cd-fabe-4e41-93b1-8f99241e035f",leadId:7,receivedAt:new Date("2026-08-30T12:00:00Z"),adminBaseUrl:"https://staging.crescimentovertical.com"};
    const first=buildLeadNotification(input), second=buildLeadNotification(input);
    expect(first.messageId).toBe(second.messageId);
    expect(first.messageId).toBe(stableMessageId(input.notificationKey));
    expect(first.text).toContain("https://staging.crescimentovertical.com/admin/collections/leads/7");
  });
  it("não transporta campos pessoais, pixel, script ou anexo", () => {
    const result=buildLeadNotification({notificationKey:"f3b17657-8f4b-4778-8d54-1a02dc95db53",leadId:1,receivedAt:new Date("2026-08-30T12:00:00Z"),adminBaseUrl:"https://staging.crescimentovertical.com"});
    const serialized=JSON.stringify(result).toLowerCase();
    for (const forbidden of ["nome do lead","lead@example.test","5511999999999","empresa secreta","desafio confidencial","<script","tracking","attachment"]) expect(serialized).not.toContain(forbidden);
  });
  it("confirma aceite SMTP sem registrar envelope ou conteúdo", async () => {
    const notification=buildLeadNotification({notificationKey:"f3b17657-8f4b-4778-8d54-1a02dc95db53",leadId:1,receivedAt:new Date(),adminBaseUrl:"https://staging.crescimentovertical.com"});
    const transport={sendMail:async()=>({accepted:["fixed-recipient"],messageId:notification.messageId})};
    const result=await sendLeadNotification(transport as never,{host:"smtp.hostinger.com",port:465,secure:true,user:"contato@crescimentovertical.com",from:"contato@crescimentovertical.com",to:"contato@crescimentovertical.com",password:"test-only",adminBaseUrl:"https://staging.crescimentovertical.com"},notification);
    expect(result).toEqual({accepted:true,messageId:notification.messageId});
  });
});
