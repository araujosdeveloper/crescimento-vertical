export function Skeleton({ label = "Carregando conteúdo" }: { label?: string }) {
  return (
    <div className="skeleton" role="status" aria-live="polite" aria-busy="true">
      <span className="sr-only">{label}</span>
      <span className="skeleton-line skeleton-line-wide" aria-hidden="true" />
      <span className="skeleton-line" aria-hidden="true" />
      <span className="skeleton-line skeleton-line-short" aria-hidden="true" />
    </div>
  );
}
