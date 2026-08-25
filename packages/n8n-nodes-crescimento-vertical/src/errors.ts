/**
 * Erro sanitizado para operações do runner.
 *
 * NUNCA inclui o segredo, a URL completa com credenciais ou o corpo da
 * requisição. O status HTTP é preservado para decisões do nó.
 */
export class HermesApiError extends Error {
  constructor(
    public readonly statusCode: number | undefined,
    message: string,
  ) {
    super(message);
    this.name = 'HermesApiError';
  }
}

/** Reduz qualquer erro a uma mensagem segura, sem segredos nem stack crua. */
export function toSafeMessage(error: unknown): string {
  if (error instanceof HermesApiError) {
    return error.message;
  }
  const message = error instanceof Error ? error.message : String(error);
  return message
    .replace(/(secret|key|token|password)=[^&\s]+/gi, '$1=[REDACTED]')
    .slice(0, 300);
}
