"use client";

import { ChevronDown } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import { BrandLogo } from "@/components/brand-logo";
import { MobileNavigation } from "@/components/layout/mobile-navigation";
import {
  HOME_NAVIGATION,
  isNavigationItemCurrent,
  NAVIGATION_CTA,
  NAVIGATION_GROUPS,
} from "@/lib/navigation";

export function SiteHeader() {
  const pathname = usePathname();
  const [openGroup, setOpenGroup] = useState<string | null>(null);
  const triggerRefs = useRef<Record<string, HTMLButtonElement | null>>({});

  useEffect(() => {
    if (!openGroup) return;
    const closeOnOutside = (event: MouseEvent) => {
      if (!(event.target instanceof Node) || !(event.target as Element).closest(".nav-group")) {
        setOpenGroup(null);
      }
    };
    const closeOnKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        triggerRefs.current[openGroup]?.focus();
        setOpenGroup(null);
      }
    };
    document.addEventListener("mousedown", closeOnOutside);
    document.addEventListener("keydown", closeOnKey);
    return () => {
      document.removeEventListener("mousedown", closeOnOutside);
      document.removeEventListener("keydown", closeOnKey);
    };
  }, [openGroup]);

  return (
    <header className="site-header">
      <div className="header-shell">
        <Link className="brand" href="/" aria-label="Crescimento Vertical - início">
          <BrandLogo />
        </Link>
        <nav className="site-navigation" aria-label="Navegação principal">
          <Link className="nav-link" href={HOME_NAVIGATION.href} aria-current={isNavigationItemCurrent(pathname, HOME_NAVIGATION) ? "page" : undefined}>
            {HOME_NAVIGATION.label}
          </Link>
          {NAVIGATION_GROUPS.map((group) => {
            const menuId = `nav-menu-${group.id}`;
            const expanded = openGroup === group.id;
            const groupCurrent = group.items.some((item) => isNavigationItemCurrent(pathname, item));
            return (
              <div className="nav-group" key={group.id}>
                <button
                  ref={(element) => { triggerRefs.current[group.id] = element; }}
                  className="nav-link nav-group-trigger"
                  type="button"
                  aria-haspopup="true"
                  aria-current={groupCurrent ? "page" : undefined}
                  aria-expanded={expanded}
                  aria-controls={menuId}
                  onClick={() => setOpenGroup(expanded ? null : group.id)}
                >
                  {group.label}<ChevronDown aria-hidden="true" size={15} className={expanded ? "nav-chevron is-open" : "nav-chevron"} />
                </button>
                {expanded ? (
                  <div className="nav-dropdown" id={menuId} role="menu" aria-label={group.label}>
                    <Link className="nav-dropdown-overview" href={group.href} role="menuitem" onClick={() => setOpenGroup(null)} aria-current={isNavigationItemCurrent(pathname, { id: group.id, label: group.label, href: group.href }) ? "page" : undefined}>
                      <strong>{group.label}</strong><span>{group.description}</span>
                    </Link>
                    {group.items.filter((item) => item.href !== group.href).map((item) => (
                      <Link key={item.id} className="nav-dropdown-link" href={item.href} role="menuitem" onClick={() => setOpenGroup(null)} aria-current={isNavigationItemCurrent(pathname, item) ? "page" : undefined}>
                        {item.label}
                      </Link>
                    ))}
                  </div>
                ) : null}
              </div>
            );
          })}
          <Link className="header-cta button-primary" href={NAVIGATION_CTA.href}>{NAVIGATION_CTA.label}</Link>
        </nav>
        <MobileNavigation />
      </div>
    </header>
  );
}
