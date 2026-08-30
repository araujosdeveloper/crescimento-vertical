import { MigrateDownArgs, MigrateUpArgs, sql } from "@payloadcms/db-postgres";

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    CREATE TYPE "public"."enum_leads_contact_preference" AS ENUM('email','phone','whatsapp');
    CREATE TYPE "public"."enum_leads_status" AS ENUM('new','in_progress','closed','discarded');
    CREATE TYPE "public"."enum_leads_notification_status" AS ENUM('pending','sent','failed');
    CREATE TYPE "public"."enum_lead_outbox_type" AS ENUM('commercial_notification');
    CREATE TYPE "public"."enum_lead_outbox_state" AS ENUM('pending','sent','failed');
    CREATE TABLE "leads" (
      "id" serial PRIMARY KEY NOT NULL, "name" varchar NOT NULL, "email" varchar NOT NULL,
      "phone" varchar, "company" varchar, "service_interest" varchar NOT NULL,
      "operational_context" varchar, "challenge" varchar NOT NULL,
      "contact_preference" "enum_leads_contact_preference" NOT NULL,
      "source" varchar, "source_page" varchar, "source_content" varchar,
      "utm_source" varchar, "utm_medium" varchar, "utm_campaign" varchar, "utm_term" varchar, "utm_content" varchar,
      "referrer" varchar, "consent_version" varchar NOT NULL, "consent_text_hash" varchar NOT NULL,
      "consented_at" timestamp(3) with time zone NOT NULL, "status" "enum_leads_status" DEFAULT 'new',
      "idempotency_key" varchar NOT NULL, "retention_until" timestamp(3) with time zone NOT NULL,
      "notification_status" "enum_leads_notification_status" DEFAULT 'pending', "notification_attempts" numeric DEFAULT 0,
      "last_error" varchar, "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL, "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
    );
    CREATE UNIQUE INDEX "leads_idempotency_key_idx" ON "leads" USING btree ("idempotency_key");
    CREATE INDEX "leads_email_idx" ON "leads" USING btree ("email");
    CREATE INDEX "leads_retention_until_idx" ON "leads" USING btree ("retention_until");
    CREATE TABLE "lead_outbox" (
      "id" serial PRIMARY KEY NOT NULL, "lead_id" integer NOT NULL, "type" "enum_lead_outbox_type" NOT NULL,
      "state" "enum_lead_outbox_state" DEFAULT 'pending', "attempts" numeric DEFAULT 0,
      "next_attempt_at" timestamp(3) with time zone, "last_error" varchar,
      "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL, "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
    );
    ALTER TABLE "lead_outbox" ADD CONSTRAINT "lead_outbox_lead_id_fk" FOREIGN KEY ("lead_id") REFERENCES "public"."leads"("id") ON DELETE cascade ON UPDATE no action;
    CREATE INDEX "lead_outbox_lead_idx" ON "lead_outbox" USING btree ("lead_id");
    CREATE INDEX "lead_outbox_state_idx" ON "lead_outbox" USING btree ("state");
    ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "leads_id" integer;
    ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "lead_outbox_id" integer;
  `);
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`DROP TABLE IF EXISTS "lead_outbox"; DROP TABLE IF EXISTS "leads"; DROP TYPE IF EXISTS "enum_lead_outbox_state"; DROP TYPE IF EXISTS "enum_lead_outbox_type"; DROP TYPE IF EXISTS "enum_leads_notification_status"; DROP TYPE IF EXISTS "enum_leads_status"; DROP TYPE IF EXISTS "enum_leads_contact_preference";`);
}
