import { getPayload } from "payload";
import { sql } from "@payloadcms/db-postgres";
import config from "@payload-config";
import { buildLeadNotification, createLeadTransport, sendLeadNotification } from "../src/lib/lead-notification";
import { loadLeadSmtpConfig } from "../src/lib/lead-smtp-config";
import { processOutbox, type ClaimedOutbox, type OutboxStore } from "../src/lib/lead-outbox-processor";

type Row = { id: number; lead_id: number; notification_key: string; attempts: number; created_at: Date };
const args = process.argv.slice(2);
const mode = args.includes("--verify") ? "verify" : args.includes("--process") ? "process" : "dry-run";
const valueAfter = (name: string) => { const at = args.indexOf(name); return at >= 0 ? args[at + 1] : undefined; };
const limit = Math.max(1, Math.min(Number(valueAfter("--limit") || 1), 10));
const onlyId = valueAfter("--id") ? Number(valueAfter("--id")) : undefined;
if ((onlyId !== undefined && !Number.isInteger(onlyId)) || !Number.isInteger(limit)) throw new Error("Invalid outbox selector");

const smtp = loadLeadSmtpConfig();
if (!smtp) throw new Error("Lead notification transport is disabled");
const transport = createLeadTransport(smtp);

if (mode === "verify") {
  await transport.verify();
  console.info("lead_outbox smtp_verify=approved dns=resolved tls=valid auth=approved");
  transport.close();
  process.exit(0);
}

const payload = await getPayload({ config });
const db = payload.db.drizzle;
const rows = (result: unknown): Row[] => Array.isArray(result) ? result as Row[] : (result as { rows?: Row[] }).rows || [];

if (mode === "dry-run") {
  const result = rows(await db.execute(sql`SELECT id, state, attempts FROM lead_outbox WHERE state = 'pending' AND (next_attempt_at IS NULL OR next_attempt_at <= now()) ORDER BY id LIMIT ${limit}`));
  console.info(`lead_outbox mode=dry-run eligible=${result.length}`);
  process.exit(0);
}

const store: OutboxStore = {
  async claim(input) {
    const result = await db.execute(sql`
      WITH candidates AS (
        SELECT id FROM lead_outbox
        WHERE ((state = 'pending' AND (next_attempt_at IS NULL OR next_attempt_at <= ${input.now}))
          OR (state = 'processing' AND claimed_at < ${input.leaseBefore}))
          AND attempts < ${input.maxAttempts}
          AND (${input.onlyId ?? null}::integer IS NULL OR id = ${input.onlyId ?? null})
        ORDER BY id FOR UPDATE SKIP LOCKED LIMIT ${input.limit}
      )
      UPDATE lead_outbox o SET state = 'processing', claimed_at = ${input.now}, attempts = o.attempts + 1,
        last_error = NULL, updated_at = ${input.now}
      FROM candidates c WHERE o.id = c.id
      RETURNING o.id, o.lead_id, o.notification_key, o.attempts, o.created_at
    `);
    return rows(result).map((row) => ({ id: row.id, leadId: row.lead_id, notificationKey: row.notification_key, attempts: Number(row.attempts), createdAt: new Date(row.created_at) }));
  },
  async sent(item, messageId, now) {
    await db.execute(sql`WITH delivered AS (UPDATE lead_outbox SET state='sent', sent_at=${now}, delivered_at=${now}, message_id=${messageId}, claimed_at=NULL, next_attempt_at=NULL, last_error=NULL, updated_at=${now} WHERE id=${item.id} AND state='processing' RETURNING lead_id) UPDATE leads SET notification_status='sent', notification_attempts=${item.attempts}, last_error=NULL, updated_at=${now} WHERE id IN (SELECT lead_id FROM delivered)`);
  },
  async failed(item, error, nextAttemptAt) {
    const state = nextAttemptAt ? "pending" : "failed";
    await db.execute(sql`WITH retried AS (UPDATE lead_outbox SET state=${state}, claimed_at=NULL, next_attempt_at=${nextAttemptAt}, last_error=${error}, updated_at=now() WHERE id=${item.id} AND state='processing' RETURNING lead_id) UPDATE leads SET notification_status=${state}, notification_attempts=${item.attempts}, last_error=${error}, updated_at=now() WHERE id IN (SELECT lead_id FROM retried)`);
  },
};

const result = await processOutbox({ store, limit, onlyId, send: async (item: ClaimedOutbox) => {
  const notification = buildLeadNotification({ notificationKey: item.notificationKey, leadId: item.leadId, receivedAt: item.createdAt, adminBaseUrl: smtp.adminBaseUrl });
  const sent = await sendLeadNotification(transport, smtp, notification);
  if (!sent.accepted) throw Object.assign(new Error("SMTP recipient not accepted"), { code: "SMTP_NOT_ACCEPTED" });
  return sent.messageId;
} });
transport.close();
console.info(`lead_outbox mode=process claimed=${result.claimed} sent=${result.sent} failed=${result.failed}`);
process.exit(result.failed ? 2 : 0);
