"use client";

import { ChevronDown, Menu, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useId, useRef, useState } from "react";

import { NAVIGATION_CTA, HOME_NAVIGATION, isNavigationItemCurrent, NAVIGATION_GROUPS } from "@/lib/navigation";

const FOCUSABLE = 'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])';

export function MobileNavigation() {
  const [open, setOpen] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);
  const pathname = usePathname();
  const menuId = useId();
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    const trigger = triggerRef.current;
    document.body.style.overflow = "hidden";
    const focusables = () => Array.from(panelRef.current?.querySelectorAll<HTMLElement>(FOCUSABLE) || []);
    queueMicrotask(() => focusables()[0]?.focus());
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") { event.preventDefault(); setOpen(false); setExpanded(null); return; }
      if (event.key !== "Tab") return;
      const elements = focusables(); if (!elements.length) return;
      const first = elements[0]; const last = elements[elements.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => { document.removeEventListener("keydown", onKeyDown); document.body.style.overflow = previousOverflow; trigger?.focus(); };
  }, [open]);

  const close = () => { setOpen(false); setExpanded(null); };
  return (
    <>
      <button ref={triggerRef} className="mobile-menu-button" type="button" onClick={() => setOpen(true)} aria-label="Abrir menu" aria-expanded={open} aria-controls={menuId}>
        <Menu aria-hidden="true" size={21} />
      </button>
      {open ? (
        <div ref={panelRef} className="mobile-menu" id={menuId} role="dialog" aria-modal="true" aria-label="Menu principal">
          <div className="mobile-menu-head"><span>Menu</span><button className="mobile-menu-close" type="button" onClick={close} aria-label="Fechar menu"><X aria-hidden="true" size={21} /></button></div>
          <nav className="mobile-menu-links" aria-label="Navegação mobile">
            <Link className="mobile-nav-link mobile-nav-home" href={HOME_NAVIGATION.href} aria-current={isNavigationItemCurrent(pathname, HOME_NAVIGATION) ? "page" : undefined} onClick={close}>{HOME_NAVIGATION.label}</Link>
            {NAVIGATION_GROUPS.map((group) => {
              const groupId = `${menuId}-${group.id}`;
              const isExpanded = expanded === group.id;
              return <div className="mobile-nav-group" key={group.id}>
                <button className="mobile-nav-link mobile-nav-group-trigger" type="button" aria-expanded={isExpanded} aria-controls={groupId} onClick={() => setExpanded(isExpanded ? null : group.id)}>{group.label}<ChevronDown aria-hidden="true" size={18} className={isExpanded ? "nav-chevron is-open" : "nav-chevron"} /></button>
                {isExpanded ? <div className="mobile-nav-submenu" id={groupId}>
                  <Link className="mobile-nav-sublink mobile-nav-overview" href={group.href} aria-current={isNavigationItemCurrent(pathname, { id: group.id, label: group.label, href: group.href }) ? "page" : undefined} onClick={close}>Visão geral</Link>
                  {group.items.filter((item) => item.href !== group.href).map((item) => <Link className="mobile-nav-sublink" href={item.href} key={item.id} aria-current={isNavigationItemCurrent(pathname, item) ? "page" : undefined} onClick={close}>{item.label}</Link>)}
                </div> : null}
              </div>;
            })}
            <Link className="button-primary mobile-contact-link" href={NAVIGATION_CTA.href} onClick={close}>{NAVIGATION_CTA.label}</Link>
          </nav>
        </div>
      ) : null}
    </>
  );
}
