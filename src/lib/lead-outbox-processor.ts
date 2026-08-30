export const MAX_ATTEMPTS = 5;
export const CLAIM_LEASE_MS = 10 * 60_000;

export type ClaimedOutbox = { id: number; leadId: number; notificationKey: string; attempts: number; createdAt: Date };
export interface OutboxStore {
  claim(input: { limit: number; onlyId?: number; leaseBefore: Date; now: Date; maxAttempts: number }): Promise<ClaimedOutbox[]>;
  sent(item: ClaimedOutbox, messageId: string, now: Date): Promise<void>;
  failed(item: ClaimedOutbox, error: string, nextAttemptAt: Date | null): Promise<void>;
}

export function sanitizedSmtpError(error: unknown) {
  const code = typeof error === "object" && error && "code" in error ? String((error as { code?: unknown }).code) : "SMTP_ERROR";
  return `SMTP delivery failed (${/^[A-Z0-9_ -]{1,40}$/.test(code) ? code : "SMTP_ERROR"})`;
}

export function retryAt(attempts: number, now: Date) {
  if (attempts >= MAX_ATTEMPTS) return null;
  return new Date(now.getTime() + Math.min(60, 2 ** Math.max(0, attempts - 1)) * 60_000);
}

export async function processOutbox(input: { store: OutboxStore; send: (item: ClaimedOutbox) => Promise<string>; limit: number; onlyId?: number; now?: Date }) {
  const now = input.now || new Date();
  const items = await input.store.claim({ limit: Math.max(1, Math.min(input.limit, 10)), onlyId: input.onlyId, leaseBefore: new Date(now.getTime() - CLAIM_LEASE_MS), now, maxAttempts: MAX_ATTEMPTS });
  let sent = 0, failed = 0;
  for (const item of items) {
    try { const messageId = await input.send(item); await input.store.sent(item, messageId, new Date()); sent += 1; }
    catch (error) { await input.store.failed(item, sanitizedSmtpError(error), retryAt(item.attempts, new Date())); failed += 1; }
  }
  return { claimed: items.length, sent, failed };
}
