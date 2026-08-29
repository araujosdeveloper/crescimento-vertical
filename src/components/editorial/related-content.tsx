import Link from "next/link";
import type { ArticleListItem } from "@/lib/editorial/types";
export function RelatedContent({ items }: { items: ArticleListItem[] }) { if (!items.length) return null; return <section><h2 className="text-2xl font-semibold">Conteúdos relacionados</h2><ul className="mt-3 space-y-2">{items.slice(0, 4).map((item) => <li key={item.slug}><Link className="underline" href={`/conteudos/${item.slug}`}>{item.title}</Link></li>)}</ul></section>; }
