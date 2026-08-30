import { getPayload } from "payload";
import config from "../payload.config";

const payload = await getPayload({ config });
const now = new Date().toISOString();
const limit = Math.min(Math.max(Number(process.env.RETENTION_BATCH || 100), 1), 1000);
const expired = await payload.find({ collection: "leads", where: { retentionUntil: { less_than_equal: now } }, limit, depth: 0, overrideAccess: true });
if (process.env.APPLY_RETENTION !== "true") {
  console.log(`retention dry-run: ${expired.docs.length} registros elegíveis`);
} else {
  for (const lead of expired.docs) await payload.delete({ collection: "leads", id: lead.id, overrideAccess: true });
  console.log(`retention applied: ${expired.docs.length} registros removidos`);
}
process.exit(0);
