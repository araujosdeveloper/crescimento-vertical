export interface PaginationMeta {
  totalDocs: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

/** Normaliza o parâmetro de página recebido de `searchParams`. */
export function normalizePage(value: unknown, fallback = 1): number {
  const parsed =
    typeof value === "number"
      ? value
      : typeof value === "string"
        ? Number(value)
        : Number.NaN;

  if (!Number.isFinite(parsed) || parsed < 1) {
    return fallback;
  }

  return Math.floor(parsed);
}

export function computePagination(
  totalDocs: number,
  page: number,
  pageSize: number,
): PaginationMeta {
  const totalPages =
    pageSize > 0 ? Math.max(0, Math.ceil(totalDocs / pageSize)) : 0;

  return {
    totalDocs,
    totalPages,
    hasNextPage: page < totalPages,
    hasPrevPage: page > 1,
  };
}
