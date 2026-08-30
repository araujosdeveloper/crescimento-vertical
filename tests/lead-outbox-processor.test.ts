import { randomUUID } from "node:crypto";
import { describe, expect, it, vi } from "vitest";
import { processOutbox, retryAt, sanitizedSmtpError, type ClaimedOutbox, type OutboxStore } from "../src/lib/lead-outbox-processor";

class MemoryStore implements OutboxStore {
  item: (ClaimedOutbox & {state:"pending"|"processing"|"sent"|"failed"; next?:Date|null; messageId?:string; error?:string}) = {id:1,leadId:1,notificationKey:randomUUID(),attempts:0,createdAt:new Date(),state:"pending"};
  async claim() { if(this.item.state!=="pending") return []; this.item.state="processing"; this.item.attempts++; return [this.item]; }
  async sent(_item:ClaimedOutbox,messageId:string) { this.item.state="sent"; this.item.messageId=messageId; }
  async failed(_item:ClaimedOutbox,error:string,next:Date|null) { this.item.state=next?"pending":"failed"; this.item.error=error; this.item.next=next; }
}

describe("processador idempotente do outbox", () => {
  it("um claim concorrente impede segundo envio e reexecução", async () => {
    const store=new MemoryStore(), send=vi.fn(async()=>"<stable@example.test>");
    const [a,b]=await Promise.all([processOutbox({store,send,limit:1}),processOutbox({store,send,limit:1})]);
    expect(a.sent+b.sent).toBe(1); expect(send).toHaveBeenCalledTimes(1); expect(store.item.state).toBe("sent");
    expect((await processOutbox({store,send,limit:1})).claimed).toBe(0); expect(send).toHaveBeenCalledTimes(1);
  });
  it("mantém pending, registra tentativa e backoff em falha/timeout", async () => {
    const store=new MemoryStore();
    const result=await processOutbox({store,send:async()=>{throw Object.assign(new Error("password secret"),{code:"ETIMEDOUT"});},limit:1,now:new Date("2026-08-30T00:00:00Z")});
    expect(result.failed).toBe(1); expect(store.item.state).toBe("pending"); expect(store.item.attempts).toBe(1); expect(store.item.error).toBe("SMTP delivery failed (ETIMEDOUT)"); expect(store.item.error).not.toContain("password secret");
  });
  it("limita retries e sanitiza códigos inesperados", () => {
    const now=new Date(); expect(retryAt(4,now)).toBeInstanceOf(Date); expect(retryAt(5,now)).toBeNull();
    expect(sanitizedSmtpError({code:"bad\nsecret"})).toBe("SMTP delivery failed (SMTP_ERROR)");
  });
});
