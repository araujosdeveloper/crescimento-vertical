import Link from "next/link";

function pageHref(basePath: string, page: number): string {
  return page <= 1 ? basePath : `${basePath}?page=${page}`;
}

export function Pagination({
  page,
  totalPages,
  hasNextPage,
  hasPrevPage,
  basePath,
}: {
  page: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
  basePath: string;
}) {
  if (totalPages <= 1) {
    return null;
  }

  return (
    <nav className="editorial-pagination" aria-label="Paginação">
      {hasPrevPage ? (
        <Link className="button-secondary" href={pageHref(basePath, page - 1)}>
          Anterior
        </Link>
      ) : (
        <span aria-hidden="true" />
      )}
      <span className="editorial-pagination-label">
        Página {page} de {totalPages}
      </span>
      {hasNextPage ? (
        <Link className="button-secondary" href={pageHref(basePath, page + 1)}>
          Próxima
        </Link>
      ) : (
        <span aria-hidden="true" />
      )}
    </nav>
  );
}
