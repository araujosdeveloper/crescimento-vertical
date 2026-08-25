export const PRIMARY_PILLARS = [
  'ai-business',
  'automation',
  'sales-attendance',
  'sites-conversion',
  'tools-integrations',
] as const;

export type PrimaryPillar = (typeof PRIMARY_PILLARS)[number];

export interface ResearchRequest {
  schemaVersion: '1.0';
  correlationId: string;
  idempotencyKey: string;
  topic: string;
  primaryPillar: PrimaryPillar;
  searchIntent: string;
  language: 'pt-BR';
  requestedAt: string;
  maxSources: number;
  seedSources?: string[];
}

function hasText(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

function isHttpsUrl(value: unknown): boolean {
  if (typeof value !== 'string' || value.trim() === '') {
    return false;
  }
  try {
    const url = new URL(value);
    return url.protocol === 'https:';
  } catch {
    return false;
  }
}

/**
 * Valida a requisição de pesquisa localmente (espelho de
 * `editorial-research-request.v1.schema.json`). Retorna a lista de erros.
 */
export function validateResearchRequest(value: unknown): string[] {
  const errors: string[] = [];
  if (typeof value !== 'object' || value === null) {
    return ['Requisição inválida: objeto esperado.'];
  }
  const req = value as Record<string, unknown>;

  if (req.schemaVersion !== '1.0') {
    errors.push('schemaVersion deve ser "1.0".');
  }
  if (!hasText(req.correlationId) || req.correlationId.length > 200) {
    errors.push('correlationId é obrigatório (1–200 caracteres).');
  }
  if (!hasText(req.idempotencyKey) || req.idempotencyKey.length > 200) {
    errors.push('idempotencyKey é obrigatório (1–200 caracteres).');
  }
  if (!hasText(req.topic) || req.topic.length > 500) {
    errors.push('topic é obrigatório (1–500 caracteres).');
  }
  if (!PRIMARY_PILLARS.includes(req.primaryPillar as PrimaryPillar)) {
    errors.push('primaryPillar inválido.');
  }
  if (!hasText(req.searchIntent) || req.searchIntent.length > 200) {
    errors.push('searchIntent é obrigatório (1–200 caracteres).');
  }
  if (req.language !== 'pt-BR') {
    errors.push('language deve ser "pt-BR".');
  }
  if (
    typeof req.requestedAt !== 'string' ||
    Number.isNaN(Date.parse(req.requestedAt))
  ) {
    errors.push('requestedAt deve ser uma data ISO-8601 válida.');
  }
  if (
    typeof req.maxSources !== 'number' ||
    !Number.isInteger(req.maxSources) ||
    req.maxSources < 2 ||
    req.maxSources > 10
  ) {
    errors.push('maxSources deve ser um inteiro entre 2 e 10.');
  }
  if (req.seedSources !== undefined) {
    if (!Array.isArray(req.seedSources)) {
      errors.push('seedSources deve ser uma lista.');
    } else if (
      req.seedSources.length > 10 ||
      !req.seedSources.every(isHttpsUrl)
    ) {
      errors.push('seedSources deve conter no máximo 10 URLs HTTPS.');
    }
  }
  return errors;
}
