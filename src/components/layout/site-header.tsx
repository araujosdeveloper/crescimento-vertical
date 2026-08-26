"use client";

import { ArrowUpRight } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { BrandLogo } from "@/components/brand-logo";
import { ContactLink } from "@/components/contact-link";
import { MobileNavigation } from "@/components/layout/mobile-navigation";
import { isNavigationItemCurrent, PUBLIC_NAVIGATION } from "@/lib/navigation";
import { PRIMARY_CONTACT_LABEL } from "@/lib/site";

export function SiteHeader() {
  const pathname = usePathname();
  return (
    <header className="site-header">
      <div className="header-shell">
        <Link className="brand" href="/" aria-label="Crescimento Vertical - início">
          <BrandLogo />
        </Link>
        <nav className="site-navigation hidden items-center gap-8 lg:flex" aria-label="Navegação principal">
          {PUBLIC_NAVIGATION.map((item) => (
            <Link
              className="nav-link"
              href={item.href}
              key={item.href}
              aria-current={
                isNavigationItemCurrent(pathname, item) ? "page" : undefined
              }
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <ContactLink className="header-cta button-primary hidden lg:inline-flex">
          {PRIMARY_CONTACT_LABEL} <ArrowUpRight aria-hidden="true" size={16} />
        </ContactLink>
        <MobileNavigation key={pathname} />
      </div>
    </header>
  );
}
