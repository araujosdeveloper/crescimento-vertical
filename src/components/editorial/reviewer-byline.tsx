import Link from "next/link";
import type { PublicAuthorCard } from "@/lib/editorial/types";
export function ReviewerByline({ reviewer }: { reviewer: PublicAuthorCard | null }) { return reviewer ? <span>Revisão: <Link href={`/autores/${reviewer.slug}`}>{reviewer.name}</Link></span> : null; }
