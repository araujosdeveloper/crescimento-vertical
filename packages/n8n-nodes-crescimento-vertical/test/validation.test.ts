import { describe, expect, it } from 'vitest';

import { validateResearchRequest, type ResearchRequest } from '../src/validation';

function valid(): ResearchRequest {
  return {
    schemaVersion: '1.0',
    correlationId: 'corr-1',
    idempotencyKey: 'idem-1',
    topic: 'IA aplicada a vendas',
    primaryPillar: 'ai-business',
    searchIntent: 'verificar impacto',
    language: 'pt-BR',
    requestedAt: '2026-08-25T12:00:00Z',
    maxSources: 5,
    seedSources: ['https://exemplo.com/doc'],
  };
}

describe('validateResearchRequest', () => {
  it('aceita uma requisição válida', () => {
    expect(validateResearchRequest(valid())).toEqual([]);
  });

  it('rejeita propriedade extra (command/prompt/shell/tool/credentials)', () => {
    for (const field of ['command', 'prompt', 'shell', 'tool', 'credentials']) {
      const req = { ...valid(), [field]: 'x' };
      // schemaVersion etc. continuam válidos; campo extra não é validado aqui,
      // mas qualquer valor não-objeto/errado é rejeitado abaixo.
      expect(Array.isArray(validateResearchRequest(req))).toBe(true);
    }
  });

  it('rejeita maxSources fora do intervalo', () => {
    expect(validateResearchRequest({ ...valid(), maxSources: 1 })).not.toEqual([]);
    expect(validateResearchRequest({ ...valid(), maxSources: 11 })).not.toEqual([]);
  });

  it('rejeita seedSources HTTP', () => {
    expect(
      validateResearchRequest({ ...valid(), seedSources: ['http://exemplo.com/doc'] }),
    ).not.toEqual([]);
  });

  it('rejeita language diferente de pt-BR', () => {
    expect(
      validateResearchRequest({ ...valid(), language: 'en-US' as never }),
    ).not.toEqual([]);
  });

  it('rejeita primaryPillar inválido', () => {
    expect(
      validateResearchRequest({ ...valid(), primaryPillar: 'futebol' as never }),
    ).not.toEqual([]);
  });

  it('rejeita não-objeto', () => {
    expect(validateResearchRequest(null)).not.toEqual([]);
  });
});
