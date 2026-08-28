import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_articles_content_type" AS ENUM('news', 'analysis', 'guide', 'tool', 'comparison');
  CREATE TYPE "public"."enum__articles_v_version_content_type" AS ENUM('news', 'analysis', 'guide', 'tool', 'comparison');
  CREATE TABLE "articles_public_citations" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"title" varchar,
  	"publisher" varchar,
  	"url" varchar,
  	"author" varchar,
  	"published_at" timestamp(3) with time zone,
  	"accessed_at" timestamp(3) with time zone,
  	"source_type" varchar,
  	"is_primary" boolean
  );
  
  CREATE TABLE "articles_correction_history" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"date" timestamp(3) with time zone,
  	"summary" varchar,
  	"responsible_id" integer
  );
  
  CREATE TABLE "_articles_v_version_public_citations" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"title" varchar,
  	"publisher" varchar,
  	"url" varchar,
  	"author" varchar,
  	"published_at" timestamp(3) with time zone,
  	"accessed_at" timestamp(3) with time zone,
  	"source_type" varchar,
  	"is_primary" boolean,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_articles_v_version_correction_history" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"date" timestamp(3) with time zone,
  	"summary" varchar,
  	"responsible_id" integer,
  	"_uuid" varchar
  );
  
  CREATE TABLE "tags" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar NOT NULL,
  	"slug" varchar NOT NULL,
  	"description" varchar,
  	"active" boolean DEFAULT true,
  	"indexable" boolean DEFAULT false,
  	"order" numeric,
  	"seo_meta_title" varchar,
  	"seo_meta_description" varchar,
  	"seo_canonical_url" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  ALTER TABLE "articles" ADD COLUMN "content_type" "enum_articles_content_type" DEFAULT 'news';
  ALTER TABLE "articles" ADD COLUMN "public_reviewer_id" integer;
  ALTER TABLE "articles" ADD COLUMN "business_impact" varchar;
  ALTER TABLE "articles" ADD COLUMN "reading_time" numeric;
  ALTER TABLE "articles" ADD COLUMN "reviewed_at" timestamp(3) with time zone;
  ALTER TABLE "articles" ADD COLUMN "ai_disclosure" varchar;
  ALTER TABLE "articles_rels" ADD COLUMN "tags_id" integer;
  ALTER TABLE "articles_rels" ADD COLUMN "services_id" integer;
  ALTER TABLE "articles_rels" ADD COLUMN "articles_id" integer;
  ALTER TABLE "_articles_v" ADD COLUMN "version_content_type" "enum__articles_v_version_content_type" DEFAULT 'news';
  ALTER TABLE "_articles_v" ADD COLUMN "version_public_reviewer_id" integer;
  ALTER TABLE "_articles_v" ADD COLUMN "version_business_impact" varchar;
  ALTER TABLE "_articles_v" ADD COLUMN "version_reading_time" numeric;
  ALTER TABLE "_articles_v" ADD COLUMN "version_reviewed_at" timestamp(3) with time zone;
  ALTER TABLE "_articles_v" ADD COLUMN "version_ai_disclosure" varchar;
  ALTER TABLE "_articles_v_rels" ADD COLUMN "tags_id" integer;
  ALTER TABLE "_articles_v_rels" ADD COLUMN "services_id" integer;
  ALTER TABLE "_articles_v_rels" ADD COLUMN "articles_id" integer;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "tags_id" integer;
  ALTER TABLE "articles_public_citations" ADD CONSTRAINT "articles_public_citations_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."articles"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "articles_correction_history" ADD CONSTRAINT "articles_correction_history_responsible_id_authors_id_fk" FOREIGN KEY ("responsible_id") REFERENCES "public"."authors"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "articles_correction_history" ADD CONSTRAINT "articles_correction_history_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."articles"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_articles_v_version_public_citations" ADD CONSTRAINT "_articles_v_version_public_citations_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_articles_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_articles_v_version_correction_history" ADD CONSTRAINT "_articles_v_version_correction_history_responsible_id_authors_id_fk" FOREIGN KEY ("responsible_id") REFERENCES "public"."authors"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_articles_v_version_correction_history" ADD CONSTRAINT "_articles_v_version_correction_history_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_articles_v"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "articles_public_citations_order_idx" ON "articles_public_citations" USING btree ("_order");
  CREATE INDEX "articles_public_citations_parent_id_idx" ON "articles_public_citations" USING btree ("_parent_id");
  CREATE INDEX "articles_correction_history_order_idx" ON "articles_correction_history" USING btree ("_order");
  CREATE INDEX "articles_correction_history_parent_id_idx" ON "articles_correction_history" USING btree ("_parent_id");
  CREATE INDEX "articles_correction_history_responsible_idx" ON "articles_correction_history" USING btree ("responsible_id");
  CREATE INDEX "_articles_v_version_public_citations_order_idx" ON "_articles_v_version_public_citations" USING btree ("_order");
  CREATE INDEX "_articles_v_version_public_citations_parent_id_idx" ON "_articles_v_version_public_citations" USING btree ("_parent_id");
  CREATE INDEX "_articles_v_version_correction_history_order_idx" ON "_articles_v_version_correction_history" USING btree ("_order");
  CREATE INDEX "_articles_v_version_correction_history_parent_id_idx" ON "_articles_v_version_correction_history" USING btree ("_parent_id");
  CREATE INDEX "_articles_v_version_correction_history_responsible_idx" ON "_articles_v_version_correction_history" USING btree ("responsible_id");
  CREATE UNIQUE INDEX "tags_slug_idx" ON "tags" USING btree ("slug");
  CREATE INDEX "tags_updated_at_idx" ON "tags" USING btree ("updated_at");
  CREATE INDEX "tags_created_at_idx" ON "tags" USING btree ("created_at");
  ALTER TABLE "articles" ADD CONSTRAINT "articles_public_reviewer_id_authors_id_fk" FOREIGN KEY ("public_reviewer_id") REFERENCES "public"."authors"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "articles_rels" ADD CONSTRAINT "articles_rels_tags_fk" FOREIGN KEY ("tags_id") REFERENCES "public"."tags"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "articles_rels" ADD CONSTRAINT "articles_rels_services_fk" FOREIGN KEY ("services_id") REFERENCES "public"."services"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "articles_rels" ADD CONSTRAINT "articles_rels_articles_fk" FOREIGN KEY ("articles_id") REFERENCES "public"."articles"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_articles_v" ADD CONSTRAINT "_articles_v_version_public_reviewer_id_authors_id_fk" FOREIGN KEY ("version_public_reviewer_id") REFERENCES "public"."authors"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_articles_v_rels" ADD CONSTRAINT "_articles_v_rels_tags_fk" FOREIGN KEY ("tags_id") REFERENCES "public"."tags"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_articles_v_rels" ADD CONSTRAINT "_articles_v_rels_services_fk" FOREIGN KEY ("services_id") REFERENCES "public"."services"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_articles_v_rels" ADD CONSTRAINT "_articles_v_rels_articles_fk" FOREIGN KEY ("articles_id") REFERENCES "public"."articles"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_tags_fk" FOREIGN KEY ("tags_id") REFERENCES "public"."tags"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "articles_public_reviewer_idx" ON "articles" USING btree ("public_reviewer_id");
  CREATE INDEX "articles_rels_tags_id_idx" ON "articles_rels" USING btree ("tags_id");
  CREATE INDEX "articles_rels_services_id_idx" ON "articles_rels" USING btree ("services_id");
  CREATE INDEX "articles_rels_articles_id_idx" ON "articles_rels" USING btree ("articles_id");
  CREATE INDEX "_articles_v_version_version_public_reviewer_idx" ON "_articles_v" USING btree ("version_public_reviewer_id");
  CREATE INDEX "_articles_v_rels_tags_id_idx" ON "_articles_v_rels" USING btree ("tags_id");
  CREATE INDEX "_articles_v_rels_services_id_idx" ON "_articles_v_rels" USING btree ("services_id");
  CREATE INDEX "_articles_v_rels_articles_id_idx" ON "_articles_v_rels" USING btree ("articles_id");
  CREATE INDEX "payload_locked_documents_rels_tags_id_idx" ON "payload_locked_documents_rels" USING btree ("tags_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "articles_public_citations" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "articles_correction_history" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_articles_v_version_public_citations" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_articles_v_version_correction_history" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "tags" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "articles_public_citations" CASCADE;
  DROP TABLE "articles_correction_history" CASCADE;
  DROP TABLE "_articles_v_version_public_citations" CASCADE;
  DROP TABLE "_articles_v_version_correction_history" CASCADE;
  DROP TABLE "tags" CASCADE;
  ALTER TABLE "articles" DROP CONSTRAINT "articles_public_reviewer_id_authors_id_fk";
  
  ALTER TABLE "articles_rels" DROP CONSTRAINT "articles_rels_tags_fk";
  
  ALTER TABLE "articles_rels" DROP CONSTRAINT "articles_rels_services_fk";
  
  ALTER TABLE "articles_rels" DROP CONSTRAINT "articles_rels_articles_fk";
  
  ALTER TABLE "_articles_v" DROP CONSTRAINT "_articles_v_version_public_reviewer_id_authors_id_fk";
  
  ALTER TABLE "_articles_v_rels" DROP CONSTRAINT "_articles_v_rels_tags_fk";
  
  ALTER TABLE "_articles_v_rels" DROP CONSTRAINT "_articles_v_rels_services_fk";
  
  ALTER TABLE "_articles_v_rels" DROP CONSTRAINT "_articles_v_rels_articles_fk";
  
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_tags_fk";
  
  DROP INDEX "articles_public_reviewer_idx";
  DROP INDEX "articles_rels_tags_id_idx";
  DROP INDEX "articles_rels_services_id_idx";
  DROP INDEX "articles_rels_articles_id_idx";
  DROP INDEX "_articles_v_version_version_public_reviewer_idx";
  DROP INDEX "_articles_v_rels_tags_id_idx";
  DROP INDEX "_articles_v_rels_services_id_idx";
  DROP INDEX "_articles_v_rels_articles_id_idx";
  DROP INDEX "payload_locked_documents_rels_tags_id_idx";
  ALTER TABLE "articles" DROP COLUMN "content_type";
  ALTER TABLE "articles" DROP COLUMN "public_reviewer_id";
  ALTER TABLE "articles" DROP COLUMN "business_impact";
  ALTER TABLE "articles" DROP COLUMN "reading_time";
  ALTER TABLE "articles" DROP COLUMN "reviewed_at";
  ALTER TABLE "articles" DROP COLUMN "ai_disclosure";
  ALTER TABLE "articles_rels" DROP COLUMN "tags_id";
  ALTER TABLE "articles_rels" DROP COLUMN "services_id";
  ALTER TABLE "articles_rels" DROP COLUMN "articles_id";
  ALTER TABLE "_articles_v" DROP COLUMN "version_content_type";
  ALTER TABLE "_articles_v" DROP COLUMN "version_public_reviewer_id";
  ALTER TABLE "_articles_v" DROP COLUMN "version_business_impact";
  ALTER TABLE "_articles_v" DROP COLUMN "version_reading_time";
  ALTER TABLE "_articles_v" DROP COLUMN "version_reviewed_at";
  ALTER TABLE "_articles_v" DROP COLUMN "version_ai_disclosure";
  ALTER TABLE "_articles_v_rels" DROP COLUMN "tags_id";
  ALTER TABLE "_articles_v_rels" DROP COLUMN "services_id";
  ALTER TABLE "_articles_v_rels" DROP COLUMN "articles_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "tags_id";
  DROP TYPE "public"."enum_articles_content_type";
  DROP TYPE "public"."enum__articles_v_version_content_type";`)
}
