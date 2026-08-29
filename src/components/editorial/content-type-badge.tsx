import { CONTENT_TYPE_LABELS, type ContentType } from "@/lib/editorial";
export function ContentTypeBadge({ type, label }: { type: ContentType; label?: string }) { return <span className="article-card-category">{label ?? CONTENT_TYPE_LABELS[type]}</span>; }
