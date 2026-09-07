import { MigrateDownArgs, MigrateUpArgs, sql } from "@payloadcms/db-postgres";

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    CREATE TYPE "public"."enum_newsletter_subscribers_status" AS ENUM('subscribed', 'unsubscribed');
    CREATE TABLE "newsletter_subscribers" (
    	"id" serial PRIMARY KEY NOT NULL,
    	"email" varchar NOT NULL,
    	"consent_version" varchar NOT NULL,
    	"consent_text_hash" varchar NOT NULL,
    	"consented_at" timestamp(3) with time zone NOT NULL,
    	"status" "enum_newsletter_subscribers_status" DEFAULT 'subscribed',
    	"source" varchar,
    	"idempotency_key" varchar,
    	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
    	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
    );
    CREATE UNIQUE INDEX "newsletter_subscribers_email_idx" ON "newsletter_subscribers" USING btree ("email");
    CREATE INDEX "newsletter_subscribers_updated_at_idx" ON "newsletter_subscribers" USING btree ("updated_at");
    CREATE INDEX "newsletter_subscribers_created_at_idx" ON "newsletter_subscribers" USING btree ("created_at");
    ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "newsletter_subscribers_id" integer;
  `);
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    DROP TABLE "newsletter_subscribers";
    DROP TYPE "public"."enum_newsletter_subscribers_status";
  `);
}
