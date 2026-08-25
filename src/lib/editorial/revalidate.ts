import { EDITORIAL_REVALIDATE_PATHS, EDITORIAL_TAGS } from "./constants";

/**
 * Revalidação sob demanda do conteúdo editorial público.
 *
 * Chamada após publicação, atualização ou retirada de artigo (e após mudanças
 * em autores/categorias). Revalida todos os caminhos públicos: home, hub,
 * sitemap e feed, além das tags do cache de dados.
 *
 * É melhor esforço: falhas de revalidação NUNCA bloqueiam a operação
 * editorial.
 */
export async function revalidateEditorial(slug?: string): Promise<void> {
  try {
    const { revalidatePath, revalidateTag } = await import("next/cache");

    for (const tag of Object.values(EDITORIAL_TAGS)) {
      // `expire: 0` invalida imediatamente (equivale ao comportamento antigo
      // de revalidateTag, sem deprecation warning do Next 16).
      revalidateTag(tag, { expire: 0 });
    }

    for (const path of EDITORIAL_REVALIDATE_PATHS) {
      revalidatePath(path);
    }

    if (slug) {
      revalidatePath(`/conteudos/${slug}`);
    }
  } catch (error) {
    console.error("[editorial] falha ao revalidar cache:", error);
  }
}
