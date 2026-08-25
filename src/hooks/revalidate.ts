import type { CollectionAfterChangeHook } from "payload";

import { revalidateEditorial } from "../lib/editorial/revalidate";

/**
 * Revalida o cache público após qualquer mudança editorial. Nunca bloqueia a
 * operação: falhas de revalidação são registradas e ignoradas.
 */
export const revalidateEditorialContent: CollectionAfterChangeHook = async ({
  doc,
  collection,
}) => {
  try {
    if (collection?.slug === "articles") {
      await revalidateEditorial(
        typeof doc?.slug === "string" ? doc.slug : undefined,
      );
    } else if (
      collection?.slug === "authors" ||
      collection?.slug === "categories"
    ) {
      await revalidateEditorial();
    }
  } catch (error) {
    console.error("[editorial] revalidação de cache falhou:", error);
  }

  return doc;
};
