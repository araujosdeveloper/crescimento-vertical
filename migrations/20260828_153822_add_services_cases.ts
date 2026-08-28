import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_services_primary_c_t_a_type" AS ENUM('diagnostic', 'contact');
  CREATE TYPE "public"."enum_services_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__services_v_version_primary_c_t_a_type" AS ENUM('diagnostic', 'contact');
  CREATE TYPE "public"."enum__services_v_version_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum_cases_authorization_status" AS ENUM('pending', 'approved', 'denied');
  CREATE TYPE "public"."enum_cases_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__cases_v_version_authorization_status" AS ENUM('pending', 'approved', 'denied');
  CREATE TYPE "public"."enum__cases_v_version_status" AS ENUM('draft', 'published');
  CREATE TABLE "services_problems" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"value" varchar
  );
  
  CREATE TABLE "services_deliverables" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"value" varchar
  );
  
  CREATE TABLE "services_process_steps" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"value" varchar
  );
  
  CREATE TABLE "services_capabilities" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"value" varchar
  );
  
  CREATE TABLE "services" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"title" varchar,
  	"slug" varchar,
  	"short_description" varchar,
  	"positioning" varchar,
  	"target_audience" varchar,
  	"primary_c_t_a_type" "enum_services_primary_c_t_a_type",
  	"primary_c_t_a_label" varchar,
  	"featured" boolean DEFAULT false,
  	"order" numeric DEFAULT 0,
  	"active" boolean DEFAULT true,
  	"published_at" timestamp(3) with time zone,
  	"seo_meta_title" varchar,
  	"seo_meta_description" varchar,
  	"seo_canonical_url" varchar,
  	"seo_noindex" boolean DEFAULT false,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"_status" "enum_services_status" DEFAULT 'draft'
  );
  
  CREATE TABLE "_services_v_version_problems" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"value" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_services_v_version_deliverables" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"value" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_services_v_version_process_steps" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"value" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_services_v_version_capabilities" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"value" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_services_v" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"parent_id" integer,
  	"version_title" varchar,
  	"version_slug" varchar,
  	"version_short_description" varchar,
  	"version_positioning" varchar,
  	"version_target_audience" varchar,
  	"version_primary_c_t_a_type" "enum__services_v_version_primary_c_t_a_type",
  	"version_primary_c_t_a_label" varchar,
  	"version_featured" boolean DEFAULT false,
  	"version_order" numeric DEFAULT 0,
  	"version_active" boolean DEFAULT true,
  	"version_published_at" timestamp(3) with time zone,
  	"version_seo_meta_title" varchar,
  	"version_seo_meta_description" varchar,
  	"version_seo_canonical_url" varchar,
  	"version_seo_noindex" boolean DEFAULT false,
  	"version_updated_at" timestamp(3) with time zone,
  	"version_created_at" timestamp(3) with time zone,
  	"version__status" "enum__services_v_version_status" DEFAULT 'draft',
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"latest" boolean
  );
  
  CREATE TABLE "cases_metrics" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"label" varchar,
  	"value" varchar
  );
  
  CREATE TABLE "cases" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"title" varchar,
  	"slug" varchar,
  	"summary" varchar,
  	"client_display_name" varchar,
  	"authorization_status" "enum_cases_authorization_status",
  	"challenge" varchar,
  	"solution" varchar,
  	"results" varchar,
  	"period" varchar,
  	"testimonial" varchar,
  	"media_id" integer,
  	"seo_meta_title" varchar,
  	"seo_meta_description" varchar,
  	"seo_canonical_url" varchar,
  	"seo_noindex" boolean DEFAULT false,
  	"active" boolean DEFAULT true,
  	"published_at" timestamp(3) with time zone,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"_status" "enum_cases_status" DEFAULT 'draft'
  );
  
  CREATE TABLE "cases_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"services_id" integer
  );
  
  CREATE TABLE "_cases_v_version_metrics" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"label" varchar,
  	"value" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_cases_v" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"parent_id" integer,
  	"version_title" varchar,
  	"version_slug" varchar,
  	"version_summary" varchar,
  	"version_client_display_name" varchar,
  	"version_authorization_status" "enum__cases_v_version_authorization_status",
  	"version_challenge" varchar,
  	"version_solution" varchar,
  	"version_results" varchar,
  	"version_period" varchar,
  	"version_testimonial" varchar,
  	"version_media_id" integer,
  	"version_seo_meta_title" varchar,
  	"version_seo_meta_description" varchar,
  	"version_seo_canonical_url" varchar,
  	"version_seo_noindex" boolean DEFAULT false,
  	"version_active" boolean DEFAULT true,
  	"version_published_at" timestamp(3) with time zone,
  	"version_updated_at" timestamp(3) with time zone,
  	"version_created_at" timestamp(3) with time zone,
  	"version__status" "enum__cases_v_version_status" DEFAULT 'draft',
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"latest" boolean
  );
  
  CREATE TABLE "_cases_v_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"services_id" integer
  );
  
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "services_id" integer;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "cases_id" integer;
  ALTER TABLE "services_problems" ADD CONSTRAINT "services_problems_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."services"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "services_deliverables" ADD CONSTRAINT "services_deliverables_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."services"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "services_process_steps" ADD CONSTRAINT "services_process_steps_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."services"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "services_capabilities" ADD CONSTRAINT "services_capabilities_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."services"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_services_v_version_problems" ADD CONSTRAINT "_services_v_version_problems_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_services_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_services_v_version_deliverables" ADD CONSTRAINT "_services_v_version_deliverables_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_services_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_services_v_version_process_steps" ADD CONSTRAINT "_services_v_version_process_steps_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_services_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_services_v_version_capabilities" ADD CONSTRAINT "_services_v_version_capabilities_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_services_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_services_v" ADD CONSTRAINT "_services_v_parent_id_services_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."services"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "cases_metrics" ADD CONSTRAINT "cases_metrics_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."cases"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "cases" ADD CONSTRAINT "cases_media_id_media_id_fk" FOREIGN KEY ("media_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "cases_rels" ADD CONSTRAINT "cases_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."cases"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "cases_rels" ADD CONSTRAINT "cases_rels_services_fk" FOREIGN KEY ("services_id") REFERENCES "public"."services"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_cases_v_version_metrics" ADD CONSTRAINT "_cases_v_version_metrics_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_cases_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_cases_v" ADD CONSTRAINT "_cases_v_parent_id_cases_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."cases"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_cases_v" ADD CONSTRAINT "_cases_v_version_media_id_media_id_fk" FOREIGN KEY ("version_media_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_cases_v_rels" ADD CONSTRAINT "_cases_v_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."_cases_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_cases_v_rels" ADD CONSTRAINT "_cases_v_rels_services_fk" FOREIGN KEY ("services_id") REFERENCES "public"."services"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "services_problems_order_idx" ON "services_problems" USING btree ("_order");
  CREATE INDEX "services_problems_parent_id_idx" ON "services_problems" USING btree ("_parent_id");
  CREATE INDEX "services_deliverables_order_idx" ON "services_deliverables" USING btree ("_order");
  CREATE INDEX "services_deliverables_parent_id_idx" ON "services_deliverables" USING btree ("_parent_id");
  CREATE INDEX "services_process_steps_order_idx" ON "services_process_steps" USING btree ("_order");
  CREATE INDEX "services_process_steps_parent_id_idx" ON "services_process_steps" USING btree ("_parent_id");
  CREATE INDEX "services_capabilities_order_idx" ON "services_capabilities" USING btree ("_order");
  CREATE INDEX "services_capabilities_parent_id_idx" ON "services_capabilities" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "services_slug_idx" ON "services" USING btree ("slug");
  CREATE INDEX "services_updated_at_idx" ON "services" USING btree ("updated_at");
  CREATE INDEX "services_created_at_idx" ON "services" USING btree ("created_at");
  CREATE INDEX "services__status_idx" ON "services" USING btree ("_status");
  CREATE INDEX "_services_v_version_problems_order_idx" ON "_services_v_version_problems" USING btree ("_order");
  CREATE INDEX "_services_v_version_problems_parent_id_idx" ON "_services_v_version_problems" USING btree ("_parent_id");
  CREATE INDEX "_services_v_version_deliverables_order_idx" ON "_services_v_version_deliverables" USING btree ("_order");
  CREATE INDEX "_services_v_version_deliverables_parent_id_idx" ON "_services_v_version_deliverables" USING btree ("_parent_id");
  CREATE INDEX "_services_v_version_process_steps_order_idx" ON "_services_v_version_process_steps" USING btree ("_order");
  CREATE INDEX "_services_v_version_process_steps_parent_id_idx" ON "_services_v_version_process_steps" USING btree ("_parent_id");
  CREATE INDEX "_services_v_version_capabilities_order_idx" ON "_services_v_version_capabilities" USING btree ("_order");
  CREATE INDEX "_services_v_version_capabilities_parent_id_idx" ON "_services_v_version_capabilities" USING btree ("_parent_id");
  CREATE INDEX "_services_v_parent_idx" ON "_services_v" USING btree ("parent_id");
  CREATE INDEX "_services_v_version_version_slug_idx" ON "_services_v" USING btree ("version_slug");
  CREATE INDEX "_services_v_version_version_updated_at_idx" ON "_services_v" USING btree ("version_updated_at");
  CREATE INDEX "_services_v_version_version_created_at_idx" ON "_services_v" USING btree ("version_created_at");
  CREATE INDEX "_services_v_version_version__status_idx" ON "_services_v" USING btree ("version__status");
  CREATE INDEX "_services_v_created_at_idx" ON "_services_v" USING btree ("created_at");
  CREATE INDEX "_services_v_updated_at_idx" ON "_services_v" USING btree ("updated_at");
  CREATE INDEX "_services_v_latest_idx" ON "_services_v" USING btree ("latest");
  CREATE INDEX "cases_metrics_order_idx" ON "cases_metrics" USING btree ("_order");
  CREATE INDEX "cases_metrics_parent_id_idx" ON "cases_metrics" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "cases_slug_idx" ON "cases" USING btree ("slug");
  CREATE INDEX "cases_media_idx" ON "cases" USING btree ("media_id");
  CREATE INDEX "cases_updated_at_idx" ON "cases" USING btree ("updated_at");
  CREATE INDEX "cases_created_at_idx" ON "cases" USING btree ("created_at");
  CREATE INDEX "cases__status_idx" ON "cases" USING btree ("_status");
  CREATE INDEX "cases_rels_order_idx" ON "cases_rels" USING btree ("order");
  CREATE INDEX "cases_rels_parent_idx" ON "cases_rels" USING btree ("parent_id");
  CREATE INDEX "cases_rels_path_idx" ON "cases_rels" USING btree ("path");
  CREATE INDEX "cases_rels_services_id_idx" ON "cases_rels" USING btree ("services_id");
  CREATE INDEX "_cases_v_version_metrics_order_idx" ON "_cases_v_version_metrics" USING btree ("_order");
  CREATE INDEX "_cases_v_version_metrics_parent_id_idx" ON "_cases_v_version_metrics" USING btree ("_parent_id");
  CREATE INDEX "_cases_v_parent_idx" ON "_cases_v" USING btree ("parent_id");
  CREATE INDEX "_cases_v_version_version_slug_idx" ON "_cases_v" USING btree ("version_slug");
  CREATE INDEX "_cases_v_version_version_media_idx" ON "_cases_v" USING btree ("version_media_id");
  CREATE INDEX "_cases_v_version_version_updated_at_idx" ON "_cases_v" USING btree ("version_updated_at");
  CREATE INDEX "_cases_v_version_version_created_at_idx" ON "_cases_v" USING btree ("version_created_at");
  CREATE INDEX "_cases_v_version_version__status_idx" ON "_cases_v" USING btree ("version__status");
  CREATE INDEX "_cases_v_created_at_idx" ON "_cases_v" USING btree ("created_at");
  CREATE INDEX "_cases_v_updated_at_idx" ON "_cases_v" USING btree ("updated_at");
  CREATE INDEX "_cases_v_latest_idx" ON "_cases_v" USING btree ("latest");
  CREATE INDEX "_cases_v_rels_order_idx" ON "_cases_v_rels" USING btree ("order");
  CREATE INDEX "_cases_v_rels_parent_idx" ON "_cases_v_rels" USING btree ("parent_id");
  CREATE INDEX "_cases_v_rels_path_idx" ON "_cases_v_rels" USING btree ("path");
  CREATE INDEX "_cases_v_rels_services_id_idx" ON "_cases_v_rels" USING btree ("services_id");
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_services_fk" FOREIGN KEY ("services_id") REFERENCES "public"."services"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_cases_fk" FOREIGN KEY ("cases_id") REFERENCES "public"."cases"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "payload_locked_documents_rels_services_id_idx" ON "payload_locked_documents_rels" USING btree ("services_id");
  CREATE INDEX "payload_locked_documents_rels_cases_id_idx" ON "payload_locked_documents_rels" USING btree ("cases_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "services_problems" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "services_deliverables" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "services_process_steps" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "services_capabilities" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "services" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_services_v_version_problems" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_services_v_version_deliverables" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_services_v_version_process_steps" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_services_v_version_capabilities" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_services_v" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "cases_metrics" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "cases" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "cases_rels" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_cases_v_version_metrics" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_cases_v" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_cases_v_rels" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "services_problems" CASCADE;
  DROP TABLE "services_deliverables" CASCADE;
  DROP TABLE "services_process_steps" CASCADE;
  DROP TABLE "services_capabilities" CASCADE;
  DROP TABLE "services" CASCADE;
  DROP TABLE "_services_v_version_problems" CASCADE;
  DROP TABLE "_services_v_version_deliverables" CASCADE;
  DROP TABLE "_services_v_version_process_steps" CASCADE;
  DROP TABLE "_services_v_version_capabilities" CASCADE;
  DROP TABLE "_services_v" CASCADE;
  DROP TABLE "cases_metrics" CASCADE;
  DROP TABLE "cases" CASCADE;
  DROP TABLE "cases_rels" CASCADE;
  DROP TABLE "_cases_v_version_metrics" CASCADE;
  DROP TABLE "_cases_v" CASCADE;
  DROP TABLE "_cases_v_rels" CASCADE;
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_services_fk";
  
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_cases_fk";
  
  DROP INDEX "payload_locked_documents_rels_services_id_idx";
  DROP INDEX "payload_locked_documents_rels_cases_id_idx";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "services_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "cases_id";
  DROP TYPE "public"."enum_services_primary_c_t_a_type";
  DROP TYPE "public"."enum_services_status";
  DROP TYPE "public"."enum__services_v_version_primary_c_t_a_type";
  DROP TYPE "public"."enum__services_v_version_status";
  DROP TYPE "public"."enum_cases_authorization_status";
  DROP TYPE "public"."enum_cases_status";
  DROP TYPE "public"."enum__cases_v_version_authorization_status";
  DROP TYPE "public"."enum__cases_v_version_status";`)
}
