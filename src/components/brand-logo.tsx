export function BrandLogo({ footer = false }: { footer?: boolean }) {
  if (!footer) {
    return (
      <span className="header-brand-logo" aria-label="Crescimento Vertical">
        <svg className="header-brand-icon" viewBox="0 0 24 24" aria-hidden="true">
          <rect x="2" y="14" width="5" height="8" rx="1" />
          <rect x="9.5" y="9" width="5" height="13" rx="1" />
          <rect x="17" y="3" width="5" height="19" rx="1" />
        </svg>
        <span className="header-brand-wordmark">
          <span>Crescimento</span>
          <strong>Vertical</strong>
        </span>
      </span>
    );
  }

  return (
    <span className="brand-logo brand-logo-footer" aria-label="Crescimento Vertical">
      <span className="brand-symbol" aria-hidden="true">
        <i />
        <i />
        <i />
        <b />
      </span>
      <span className="brand-wordmark">
        <span>Crescimento</span>
        <strong>Vertical</strong>
      </span>
    </span>
  );
}
