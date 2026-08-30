import { MigrateDownArgs, MigrateUpArgs, sql } from "@payloadcms/db-postgres";

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    ALTER TYPE "public"."enum_lead_outbox_state" ADD VALUE IF NOT EXISTS 'processing' BEFORE 'sent';
    ALTER TABLE "lead_outbox" ADD COLUMN "notification_key" uuid DEFAULT gen_random_uuid() NOT NULL;
    ALTER TABLE "lead_outbox" ADD COLUMN "claimed_at" timestamp(3) with time zone;
    ALTER TABLE "lead_outbox" ADD COLUMN "sent_at" timestamp(3) with time zone;
    ALTER TABLE "lead_outbox" ADD COLUMN "delivered_at" timestamp(3) with time zone;
    ALTER TABLE "lead_outbox" ADD COLUMN "message_id" varchar;
    CREATE UNIQUE INDEX "lead_outbox_notification_key_idx" ON "lead_outbox" USING btree ("notification_key");
    CREATE UNIQUE INDEX "lead_outbox_lead_type_idx" ON "lead_outbox" USING btree ("lead_id", "type");
  `);
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    DROP INDEX IF EXISTS "lead_outbox_lead_type_idx";
    DROP INDEX IF EXISTS "lead_outbox_notification_key_idx";
    ALTER TABLE "lead_outbox" DROP COLUMN IF EXISTS "message_id";
    ALTER TABLE "lead_outbox" DROP COLUMN IF EXISTS "delivered_at";
    ALTER TABLE "lead_outbox" DROP COLUMN IF EXISTS "sent_at";
    ALTER TABLE "lead_outbox" DROP COLUMN IF EXISTS "claimed_at";
    ALTER TABLE "lead_outbox" DROP COLUMN IF EXISTS "notification_key";
  `);
}
