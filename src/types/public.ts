import type { ReactNode } from "react";

export type NavigationKind = "route" | "section";

export interface NavigationItem {
  label: string;
  href: `/${string}`;
  kind: NavigationKind;
}

export interface BreadcrumbItem {
  name: string;
  href: `/${string}`;
}

export interface CallToAction {
  label: string;
  href: string;
  external?: boolean;
}

/** Contrato para integração futura; não constitui catálogo comercial. */
export interface FutureServiceReference {
  id: string;
  slug: string;
  title: string;
}

export interface InterfaceStateContent {
  title: string;
  description?: string;
  action?: ReactNode;
}
