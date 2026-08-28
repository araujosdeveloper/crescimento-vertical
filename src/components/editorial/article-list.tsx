import type { ArticleListItem } from "@/lib/editorial/types";
import { ArticleCard } from "./article-card";
export function ArticleList({ items }: { items: ArticleListItem[] }) { return <div className="editorial-grid">{items.map((article) => <ArticleCard key={article.slug} article={article} />)}</div>; }
