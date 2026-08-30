import { NextResponse } from "next/server";

const allowed = new Set(["cta_click", "whatsapp_click", "form_start", "form_attempt", "form_success", "form_failure"]);
const counts = new Map<string, number>();

export async function POST(request: Request) {
  if (!request.headers.get("content-type")?.includes("application/json")) return new NextResponse(null, { status: 204 });
  try {
    const body = await request.json();
    if (typeof body?.event !== "string" || !allowed.has(body.event) || (body.source !== undefined && typeof body.source !== "string")) return new NextResponse(null, { status: 204 });
    counts.set(body.event, (counts.get(body.event) || 0) + 1);
  } catch { /* métricas opcionais nunca bloqueiam o produto */ }
  return new NextResponse(null, { status: 204, headers: { "Cache-Control": "no-store" } });
}
