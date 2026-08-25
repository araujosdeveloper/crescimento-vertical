import { RichText } from "@payloadcms/richtext-lexical/react";

/**
 * Renderiza o conteúdo Lexical de um artigo. O conteúdo já chega sanitizado
 * pelo workflow editorial (aprovação humana). Links recebem rel/target seguros
 * pelo conversor padrão do Payload.
 */
export function EditorialContent({ content }: { content: unknown }) {
  if (!content || typeof content !== "object") {
    return null;
  }
  return <RichText data={content as never} className="editorial-prose" />;
}
