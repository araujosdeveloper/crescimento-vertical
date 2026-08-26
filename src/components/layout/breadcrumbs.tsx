import Link from "next/link";

import type { BreadcrumbItem } from "@/types/public";

export function Breadcrumbs({ items }: { items: BreadcrumbItem[] }) {
  return (
    <nav className="editorial-breadcrumbs" aria-label="Trilha de navegação">
      <ol>
        {items.map((item, index) => {
          const isLast = index === items.length - 1;
          return (
            <li key={item.href}>
              {isLast ? (
                <span aria-current="page">{item.name}</span>
              ) : (
                <Link href={item.href}>{item.name}</Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
