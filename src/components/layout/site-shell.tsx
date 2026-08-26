import type { ReactNode } from "react";

import { FloatingWhatsAppButton } from "@/components/floating-whatsapp-button";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { SkipLink } from "@/components/layout/skip-link";

export function SiteShell({ children }: { children: ReactNode }) {
  return (
    <>
      <SkipLink />
      <SiteHeader />
      <main id="main-content" tabIndex={-1} className="public-main">
        {children}
      </main>
      <SiteFooter />
      <FloatingWhatsAppButton />
    </>
  );
}
