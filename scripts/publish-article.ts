import { getPayload } from "payload";
import config from "../payload.config";

async function main() {
  const payload = await getPayload({ config });
  const admin = (
    await payload.find({
      collection: "users",
      where: { email: { equals: "araujosdeveloper@gmail.com" } },
      limit: 1,
      overrideAccess: true,
    })
  ).docs[0];

  const ids = (process.env.ARTICLE_IDS || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)
    .map(Number);

  for (const id of ids) {
    for (const status of ["in_review", "approved", "published"] as const) {
      await payload.update({
        collection: "articles",
        id,
        data: { workflowStatus: status },
        overrideAccess: true,
        user: admin,
        context: { publishArticle: true },
      });
    }
    console.log("PUBLISHED", id);
  }
}

main().catch((e) => {
  console.error("ERROR", e?.message ?? e);
  process.exit(1);
});
