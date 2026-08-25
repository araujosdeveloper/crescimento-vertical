import type { Where } from "payload";

/**
 * Filtro defensivo aplicado a TODA consulta pública de artigos.
 *
 * - `_status` publicado (redundante com `draft: false`, por defesa em
 *   profundidade);
 * - `workflowStatus` publicado (regra editorial da Fase 2A);
 * - `publishedAt` menor ou igual ao instante atual (artigos agendados no futuro
 *   nunca aparecem).
 */
export function publicArticlesWhere(now: Date = new Date()): Where {
  return {
    and: [
      { _status: { equals: "published" } },
      { workflowStatus: { equals: "published" } },
      { publishedAt: { less_than_equal: now.toISOString() } },
    ],
  };
}

/** Combina o filtro público com uma condição adicional (ex.: slug ou categoria). */
export function withPublicArticlesWhere(
  extra: Where,
  now: Date = new Date(),
): Where {
  const base = publicArticlesWhere(now);
  const conditions = Array.isArray(base.and) ? (base.and as Where[]) : [];
  return { and: [...conditions, extra] };
}
