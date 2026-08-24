import type { AnchorHTMLAttributes, ReactNode } from "react";
import {
  PRIMARY_CONTACT_IS_EXTERNAL,
  PRIMARY_CONTACT_URL,
} from "@/lib/site";

type ContactLinkProps = Omit<
  AnchorHTMLAttributes<HTMLAnchorElement>,
  "href" | "rel" | "target"
> & {
  children: ReactNode;
};

export function ContactLink({ children, ...props }: ContactLinkProps) {
  return (
    <a
      {...props}
      href={PRIMARY_CONTACT_URL}
      rel={PRIMARY_CONTACT_IS_EXTERNAL ? "noreferrer" : undefined}
      target={PRIMARY_CONTACT_IS_EXTERNAL ? "_blank" : undefined}
    >
      {children}
    </a>
  );
}
