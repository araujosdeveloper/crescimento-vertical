import type { SafeImage } from "@/lib/editorial/types";

/**
 * Imagem pública segura: usa `<img>` com `alt` obrigatório e carregamento
 * preguiçoso. Evita `<Image>` do Next para não depender de configuração de
 * domínio/remote patterns para mídia servida pelo Payload.
 */
export function ArticleImage({
  image,
  className,
  sizes,
}: {
  image: SafeImage;
  className?: string;
  sizes?: string;
}) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={image.url}
      alt={image.alt}
      width={image.width}
      height={image.height}
      loading="lazy"
      decoding="async"
      sizes={sizes}
      className={className}
    />
  );
}
