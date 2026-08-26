import { MessageCircle } from "lucide-react";
import { WHATSAPP_URL } from "@/lib/site";

export function FloatingWhatsAppButton() {
  if (!WHATSAPP_URL) {
    return null;
  }

  return (
    <a
      className="floating-whatsapp"
      href={WHATSAPP_URL}
      target="_blank"
      rel="noreferrer"
      aria-label="Fale conosco pelo WhatsApp"
    >
      <MessageCircle aria-hidden="true" size={21} />
      <span>Fale conosco</span>
    </a>
  );
}
