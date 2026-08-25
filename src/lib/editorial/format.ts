const DATE_FORMATTER = new Intl.DateTimeFormat("pt-BR", {
  day: "2-digit",
  month: "long",
  year: "numeric",
  timeZone: "America/Sao_Paulo",
});

const DATE_TIME_FORMATTER = new Intl.DateTimeFormat("pt-BR", {
  day: "2-digit",
  month: "long",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  timeZone: "America/Sao_Paulo",
});

function toDate(value: string | null | undefined): Date | null {
  if (!value) {
    return null;
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return null;
  }
  return date;
}

export function formatDate(value: string | null | undefined): string | null {
  const date = toDate(value);
  return date ? DATE_FORMATTER.format(date) : null;
}

export function formatDateTime(value: string | null | undefined): string | null {
  const date = toDate(value);
  return date ? DATE_TIME_FORMATTER.format(date) : null;
}
