import Link from "next/link";
import type { PublicAuthorCard } from "@/lib/editorial/types";
export function AuthorByline({ author }: { author: PublicAuthorCard | null }) { return author ? <Link href={`/autores/${author.slug}`}>{author.name}</Link> : null; }
