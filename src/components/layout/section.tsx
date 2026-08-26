import type { ComponentPropsWithoutRef, ReactNode } from "react";

interface SectionProps extends ComponentPropsWithoutRef<"section"> {
  children: ReactNode;
}

export function Section({ children, className = "", ...props }: SectionProps) {
  return (
    <section className={`section-pad ${className}`.trim()} {...props}>
      {children}
    </section>
  );
}
