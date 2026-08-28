import { draftMode } from "next/headers";
import { NextResponse, type NextRequest } from "next/server";

import { safeSameOriginPath } from "@/lib/preview";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const mode = await draftMode();
  mode.disable();
  const target = safeSameOriginPath(
    request.nextUrl.searchParams.get("redirect"),
    "/conteudos",
    request.nextUrl,
  );
  return NextResponse.redirect(new URL(target, request.url));
}
