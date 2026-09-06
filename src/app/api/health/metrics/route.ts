import { NextResponse } from "next/server";
import { getPayload } from "payload";
import config from "@payload-config";

export const dynamic = "force-dynamic";

async function count(payload: Awaited<ReturnType<typeof getPayload>>, collection: "articles" | "leads" | "services" | "media" | "sources") {
  try {
    return (await payload.count({ collection, overrideAccess: true })).totalDocs;
  } catch {
    return -1;
  }
}

export async function GET() {
  try {
    const payload = await getPayload({ config });
    const [articles, leads, services, media, sources] = await Promise.all([
      count(payload, "articles"),
      count(payload, "leads"),
      count(payload, "services"),
      count(payload, "media"),
      count(payload, "sources"),
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
      },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch {
    return NextResponse.json({ ok: false }, { status: 503 });
  }
}
