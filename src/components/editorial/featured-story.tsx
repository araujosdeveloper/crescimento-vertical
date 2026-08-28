import Link from "next/link";
import type { ArticleListItem } from "@/lib/editorial/types";
export function FeaturedStory({ article }: { article: ArticleListItem }) { return <article className="editorial-featured"><p className="section-kicker">Destaque · {article.contentTypeLabel}</p><h2 className="section-title"><Link href={`/conteudos/${article.slug}`}>{article.title}</Link></h2>{article.summary ? <p className="section-copy">{article.summary}</p> : null}</article>; }
