import { loadLeadSmtpConfig } from "@/lib/lead-smtp-config";

export const dynamic = "force-dynamic";

export function GET() {
  try {
    loadLeadSmtpConfig();
  } catch {
    return Response.json({ status: "degraded", reason: "notification_transport_unavailable" }, { status: 503, headers: { "Cache-Control": "no-store, max-age=0" } });
  }
  return Response.json(
    { status: "ready" },
    {
      headers: {
        "Cache-Control": "no-store, max-age=0",
      },
    },
  );
}
