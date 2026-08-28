import { draftMode } from "next/headers";
import { NextResponse, type NextRequest } from "next/server";
import { getPayload } from "payload";

import config from "@payload-config";
import { isEditorialUser } from "@/lib/roles";
import { normalizePreviewSlug } from "@/lib/preview";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const slug = normalizePreviewSlug(request.nextUrl.searchParams.get("slug"));
    if (!slug) {
      return NextResponse.json({ error: "Preview inválido." }, { status: 400 });
    }

    const payload = await getPayload({ config });
    const { user } = await payload.auth({ headers: request.headers });
    if (!isEditorialUser(user)) {
      return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
    }

    const preview = await payload.find({
      collection: "articles",
      where: { slug: { equals: slug } },
      draft: true,
      overrideAccess: false,
      user,
      limit: 1,
      depth: 0,
    });
    if (!preview.docs[0]) {
      return NextResponse.json({ error: "Conteúdo não encontrado." }, { status: 404 });
    }

    const mode = await draftMode();
    mode.enable();
    return NextResponse.redirect(new URL(`/preview/conteudos/${slug}`, request.url));
  } catch {
    return NextResponse.json({ error: "Preview indisponível." }, { status: 500 });
  }
}
