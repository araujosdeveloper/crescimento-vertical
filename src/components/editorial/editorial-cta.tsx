import { ArrowRight } from "lucide-react";

import { ContactLink } from "@/components/contact-link";
import { PRIMARY_CONTACT_LABEL } from "@/lib/site";

/**
 * CTA comercial contextual. Fica após o conteúdo, sem interromper a leitura.
 */
export function EditorialCTA() {
  return (
    <aside className="editorial-cta">
      <p className="section-kicker">Fale com a Crescimento Vertical</p>
      <h2>Quer aplicar isso no seu negócio?</h2>
      <p>
        Estruture a presença digital da sua empresa com inteligência artificial,
        automação e performance.
      </p>
      <ContactLink className="button-primary">
        {PRIMARY_CONTACT_LABEL} <ArrowRight size={18} />
      </ContactLink>
    </aside>
  );
}
