import { getAllPublishedArticles } from "@/lib/editorial/data";
import { buildFeedXml } from "@/lib/editorial/feed";

export const dynamic = "force-dynamic";

export async function GET() {
  const articles = await getAllPublishedArticles();
  const xml = buildFeedXml(articles);

  return new Response(xml, {
    headers: {
      "Content-Type": "application/rss+xml; charset=utf-8",
      "Cache-Control": "public, s-maxage=300, stale-while-revalidate=60",
    },
  });
}
