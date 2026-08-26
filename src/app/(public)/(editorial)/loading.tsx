import { Container } from "@/components/layout/container";
import { Section } from "@/components/layout/section";
import { Skeleton } from "@/components/ui/skeleton";

export default function EditorialLoading() {
  return (
    <Section aria-label="Carregando página editorial">
      <Container>
        <Skeleton />
      </Container>
    </Section>
  );
}
