import { readFileSync, statSync } from "node:fs";

export const SMTP_PASSWORD_MAX_BYTES = 4096;
const EXPECTED = {
  host: "smtp.hostinger.com",
  port: 465,
  user: "contato@crescimentovertical.com",
  from: "contato@crescimentovertical.com",
  to: "contato@crescimentovertical.com",
};

export type LeadSmtpConfig = typeof EXPECTED & { secure: true; password: string; adminBaseUrl: string };

export function readPasswordFile(path: string): string {
  let size: number;
  try { size = statSync(path).size; } catch { throw new Error("SMTP password file is unavailable"); }
  if (size < 1) throw new Error("SMTP password file is empty");
  if (size > SMTP_PASSWORD_MAX_BYTES) throw new Error("SMTP password file exceeds the safe size limit");
  let value: string;
  try { value = readFileSync(path, "utf8").replace(/(?:\r\n|\n)$/, ""); } catch { throw new Error("SMTP password file is unreadable"); }
  if (!value) throw new Error("SMTP password file is empty");
  return value;
}

export function loadLeadSmtpConfig(env: Record<string, string | undefined> = process.env): LeadSmtpConfig | null {
  if (env.LEAD_NOTIFICATION_ENABLED !== "true") return null;
  const port = Number(env.LEAD_SMTP_PORT);
  if (env.LEAD_SMTP_HOST !== EXPECTED.host || port !== EXPECTED.port || env.LEAD_SMTP_SECURE !== "true") throw new Error("SMTP transport configuration is not allowed");
  if (env.LEAD_SMTP_USER !== EXPECTED.user || env.LEAD_SMTP_FROM !== EXPECTED.from || env.LEAD_NOTIFICATION_TO !== EXPECTED.to) throw new Error("SMTP mailbox configuration is not allowed");
  const adminBaseUrl = env.LEAD_ADMIN_BASE_URL || "";
  if (!/^https:\/\/[^/?#]+$/.test(adminBaseUrl)) throw new Error("Authenticated admin base URL is invalid");
  return { ...EXPECTED, secure: true, password: readPasswordFile(env.LEAD_SMTP_PASSWORD_FILE || ""), adminBaseUrl };
}
