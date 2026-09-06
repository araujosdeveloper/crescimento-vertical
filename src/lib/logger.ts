export type LogLevel = "debug" | "info" | "warn" | "error";

const SERVICE = "crescimento-vertical";
const RELEASE = process.env.RELEASE || process.env.npm_package_version || "dev";

/**
 * Emissor de log estruturado (JSON, uma linha por evento).
 *
 * Campos: `ts` (UTC ISO), `level`, `service`, `env`, `release`, `requestId`,
 * `message` e os campos extras fornecidos. Nunca passe PII, tokens, cookies,
 * prompts ou corpo de requisição — apenas identificadores e contadores.
 */
export function log(level: LogLevel, message: string, fields?: Record<string, unknown>, requestId?: string): void {
  if (process.env.NODE_ENV === "test") return;
  const entry: Record<string, unknown> = {
    ts: new Date().toISOString(),
    level,
    service: SERVICE,
    env: process.env.NODE_ENV || "development",
    release: RELEASE,
    requestId: requestId ?? "-",
    message,
  };
  if (fields) {
    for (const [key, value] of Object.entries(fields)) entry[key] = value;
  }
  const line = JSON.stringify(entry);
  if (level === "error") process.stderr.write(`${line}\n`);
  else process.stdout.write(`${line}\n`);
}
