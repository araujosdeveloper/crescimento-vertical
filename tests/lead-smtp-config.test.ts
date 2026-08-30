import { chmodSync, writeFileSync } from "node:fs";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { loadLeadSmtpConfig, readPasswordFile, SMTP_PASSWORD_MAX_BYTES } from "../src/lib/lead-smtp-config";

const base = (file: string): Record<string,string|undefined> => ({ LEAD_NOTIFICATION_ENABLED:"true", LEAD_SMTP_HOST:"smtp.hostinger.com", LEAD_SMTP_PORT:"465", LEAD_SMTP_SECURE:"true", LEAD_SMTP_USER:"contato@crescimentovertical.com", LEAD_SMTP_FROM:"contato@crescimentovertical.com", LEAD_NOTIFICATION_TO:"contato@crescimentovertical.com", LEAD_SMTP_PASSWORD_FILE:file, LEAD_ADMIN_BASE_URL:"https://staging.crescimentovertical.com" });
const secret = (value: string) => { const dir=mkdtempSync(join(tmpdir(),"cv-smtp-")); const file=join(dir,"password"); writeFileSync(file,value,{mode:0o600}); chmodSync(file,0o600); return file; };

describe("configuração SMTP comercial", () => {
  it("aceita somente Hostinger 465 com TLS e mailboxes fixos", () => {
    const config=loadLeadSmtpConfig(base(secret("test-password\n")));
    expect(config).toMatchObject({host:"smtp.hostinger.com",port:465,secure:true});
    expect(config?.password).toBe("test-password");
    expect(() => loadLeadSmtpConfig({...base(secret("x")),LEAD_SMTP_PORT:"25"})).toThrow("not allowed");
    expect(() => loadLeadSmtpConfig({...base(secret("x")),LEAD_SMTP_SECURE:"false"})).toThrow("not allowed");
    expect(() => loadLeadSmtpConfig({...base(secret("x")),LEAD_SMTP_HOST:"example.test"})).toThrow("not allowed");
  });
  it("falha de modo sanitizado para arquivo ausente, vazio ou grande", () => {
    expect(() => readPasswordFile("/tmp/definitely-absent-cv-secret")).toThrow("unavailable");
    expect(() => readPasswordFile(secret(""))).toThrow("empty");
    expect(() => readPasswordFile(secret("x".repeat(SMTP_PASSWORD_MAX_BYTES+1)))).toThrow("size limit");
  });
  it("não inclui o segredo em erros", () => {
    const password="unique-password-that-must-not-leak"; let message="";
    try { loadLeadSmtpConfig({...base(secret(password)),LEAD_SMTP_USER:"wrong@example.test"}); } catch(error) { message=String(error); }
    expect(message).not.toContain(password);
  });
});
