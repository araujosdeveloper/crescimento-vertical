"use client";

import { ArrowUpRight, Menu, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useId, useRef, useState } from "react";

import { ContactLink } from "@/components/contact-link";
import { isNavigationItemCurrent, PUBLIC_NAVIGATION } from "@/lib/navigation";
import { PRIMARY_CONTACT_LABEL } from "@/lib/site";

const FOCUSABLE =
  'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])';

export function MobileNavigation() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const menuId = useId();
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const trigger = triggerRef.current;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const focusables = () =>
      Array.from(
        panelRef.current?.querySelectorAll<HTMLElement>(FOCUSABLE) || [],
      );
    queueMicrotask(() => focusables()[0]?.focus());

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        setOpen(false);
        return;
      }
      if (event.key !== "Tab") return;
      const elements = focusables();
      if (elements.length === 0) return;
      const first = elements[0];
      const last = elements[elements.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
      trigger?.focus();
    };
  }, [open]);

  return (
    <>
      <button
        ref={triggerRef}
        className="mobile-menu-button lg:hidden"
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Abrir menu"
        aria-expanded={open}
        aria-controls={menuId}
      >
        <Menu aria-hidden="true" size={21} />
      </button>

      {open ? (
        <div
          ref={panelRef}
          className="mobile-menu lg:hidden"
          id={menuId}
          role="dialog"
          aria-modal="true"
          aria-label="Menu principal"
        >
          <div className="mobile-menu-head">
            <span>Menu</span>
            <button
              className="mobile-menu-close"
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Fechar menu"
            >
              <X aria-hidden="true" size={21} />
            </button>
          </div>
          <nav className="mobile-menu-links" aria-label="Navegação mobile">
            {PUBLIC_NAVIGATION.map((item) => (
              <Link
                className="mobile-nav-link"
                href={item.href}
                key={item.href}
                aria-current={
                  isNavigationItemCurrent(pathname, item) ? "page" : undefined
                }
                onClick={() => setOpen(false)}
              >
                {item.label}
              </Link>
            ))}
            <ContactLink
              className="button-primary mobile-contact-link"
              onClick={() => setOpen(false)}
            >
              {PRIMARY_CONTACT_LABEL}
              <ArrowUpRight aria-hidden="true" size={16} />
            </ContactLink>
          </nav>
        </div>
      ) : null}
    </>
  );
}
