"use client";

import { Container } from "@/components/layout/container";
import { Section } from "@/components/layout/section";
import { ErrorState } from "@/components/ui/interface-state";

export default function EditorialError({ reset }: { reset: () => void }) {
  return (
    <Section>
      <Container>
        <ErrorState
          title="Não foi possível carregar esta página"
          description="Tente novamente. Se o problema continuar, volte mais tarde."
          action={
            <button className="button-primary" type="button" onClick={reset}>
              Tentar novamente
            </button>
          }
        />
      </Container>
    </Section>
  );
}
