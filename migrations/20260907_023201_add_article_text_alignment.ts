import { MigrateDownArgs, MigrateUpArgs, sql } from "@payloadcms/db-postgres";

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    CREATE TYPE "public"."enum_articles_text_alignment" AS ENUM('justify', 'left', 'center', 'right');
    CREATE TYPE "public"."enum__articles_v_version_text_alignment" AS ENUM('justify', 'left', 'center', 'right');
    ALTER TABLE "articles" ADD COLUMN "text_alignment" "enum_articles_text_alignment" DEFAULT 'justify';
    ALTER TABLE "_articles_v" ADD COLUMN "version_text_alignment" "enum__articles_v_version_text_alignment" DEFAULT 'justify';
  `);
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "articles" DROP COLUMN "text_alignment";
    ALTER TABLE "_articles_v" DROP COLUMN "version_text_alignment";
    DROP TYPE "public"."enum_articles_text_alignment";
    DROP TYPE "public"."enum__articles_v_version_text_alignment";
  `);
}
