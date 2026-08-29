import type { SafeImage } from "@/lib/editorial/types";
import Image from "next/image";

/**
 * Imagem pública segura e otimizada pelo pipeline do Next.
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
    <Image
      src={image.url}
      alt={image.alt}
      width={image.width || 1200}
      height={image.height || 675}
      loading="lazy"
      decoding="async"
      sizes={sizes}
      className={className}
    />
  );
}
