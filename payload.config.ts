import { postgresAdapter } from "@payloadcms/db-postgres";
import { lexicalEditor } from "@payloadcms/richtext-lexical";
import path from "path";
import { buildConfig } from "payload";
import { fileURLToPath } from "url";
import sharp from "sharp";

import { Articles } from "./src/collections/Articles";
import { Authors } from "./src/collections/Authors";
import { Categories } from "./src/collections/Categories";
import { Media } from "./src/collections/Media";
import { ResearchDossiers } from "./src/collections/ResearchDossiers";
import { Sources } from "./src/collections/Sources";
import { Users } from "./src/collections/Users";
import { Services } from "./src/collections/Services";
import { Cases } from "./src/collections/Cases";
import { Tags } from "./src/collections/Tags";
import { Leads } from "./src/collections/Leads";
import { LeadOutbox } from "./src/collections/LeadOutbox";

const filename = fileURLToPath(import.meta.url);
const dirname = path.dirname(filename);

export default buildConfig({
  serverURL: process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000",
  admin: {
    user: Users.slug,
    importMap: {
      baseDir: path.resolve(dirname, "src"),
    },
  },
  collections: [
    Users,
    Authors,
    Categories,
    Media,
    Sources,
    ResearchDossiers,
    Articles,
    Services,
    Cases,
    Tags,
    Leads,
    LeadOutbox,
  ],
  editor: lexicalEditor(),
  secret: process.env.PAYLOAD_SECRET || "",
  typescript: {
    outputFile: path.resolve(dirname, "src", "payload-types.ts"),
  },
  db: postgresAdapter({
    pool: {
      connectionString: process.env.DATABASE_URL || "",
    },
    migrationDir: path.resolve(dirname, "migrations"),
    push: false,
  }),
  sharp,
  defaultDepth: 1,
  maxDepth: 3,
  plugins: [],
});
