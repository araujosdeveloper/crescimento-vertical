"use client";

import { ArrowUpRight, Menu, X } from "lucide-react";
import { useState } from "react";
import { BrandLogo } from "@/components/brand-logo";
import { WHATSAPP_URL } from "@/lib/site";

const links = [
  ["Início", "#inicio"],
  ["Soluções", "#solucoes"],
  ["Processo", "#processo"],
  ["Diferenciais", "#diferenciais"],
  ["Contato", "#contato"],
];

export function Header() {
  const [open, setOpen] = useState(false);

  return (
    <header className="site-header">
      <div className="header-shell">
        <a className="brand" href="#inicio" aria-label="Crescimento Vertical - início">
          <BrandLogo />
        </a>

        <nav className="hidden items-center gap-8 lg:flex" aria-label="Navegação principal">
          {links.map(([label, href]) => (
            <a className="nav-link" href={href} key={href}>{label}</a>
          ))}
        </nav>

        <a className="header-cta button-primary hidden md:inline-flex" href={WHATSAPP_URL} target="_blank" rel="noreferrer">
          Falar com especialista <ArrowUpRight size={16} />
        </a>

        <button
          className="mobile-menu-button md:hidden"
          onClick={() => setOpen((value) => !value)}
          aria-label={open ? "Fechar menu" : "Abrir menu"}
          aria-expanded={open}
        >
          {open ? <X size={21} /> : <Menu size={21} />}
        </button>
      </div>

      {open && (
        <div className="mobile-menu md:hidden">
          <nav className="container-shell flex flex-col gap-1" aria-label="Navegação mobile">
            {links.map(([label, href]) => (
              <a className="rounded-lg px-3 py-3 text-sm text-slate-300 hover:bg-white/5 hover:text-white" href={href} key={href} onClick={() => setOpen(false)}>{label}</a>
            ))}
            <a className="button-primary mt-3 justify-center" href={WHATSAPP_URL} target="_blank" rel="noreferrer" onClick={() => setOpen(false)}>Falar com especialista <ArrowUpRight size={16} /></a>
          </nav>
        </div>
      )}
    </header>
  );
}
