import { NextResponse } from "next/server";
import { getPayload } from "payload";
import config from "@payload-config";
import { log } from "@/lib/logger";

export const dynamic = "force-dynamic";

async function count(payload: Awaited<ReturnType<typeof getPayload>>, collection: "articles" | "leads" | "services" | "media" | "sources") {
  try {
    return (await payload.count({ collection, overrideAccess: true })).totalDocs;
  } catch {
    return -1;
  }
}

async function pendingOutbox(payload: Awaited<ReturnType<typeof getPayload>>) {
  try {
    return (await payload.count({ collection: "lead-outbox", where: { state: { equals: "pending" } }, overrideAccess: true })).totalDocs;
  } catch {
    return -1;
  }
}

export async function GET() {
  try {
    const payload = await getPayload({ config });
    const [articles, leads, services, media, sources, outboxPending] = await Promise.all([
      count(payload, "articles"),
      count(payload, "leads"),
      count(payload, "services"),
      count(payload, "media"),
      count(payload, "sources"),
      pendingOutbox(payload),
    ]);
    return NextResponse.json(
      {
        ok: true,
        ts: new Date().toISOString(),
        uptimeSeconds: Math.round(process.uptime()),
        articles,
        leads,
        services,
        media,
        sources,
        outboxPending,
      },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch {
    log("error", "metrics_failed", { route: "health-metrics" });
    return NextResponse.json({ ok: false }, { status: 503 });
  }
}
