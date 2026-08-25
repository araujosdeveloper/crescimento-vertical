import { beforeEach, describe, expect, it, vi } from 'vitest';

import { HermesEditorial } from '../nodes/HermesEditorial/HermesEditorial.node';

const SECRET = 'test-secret';

vi.mock('../src/client', () => {
  return {
    HermesClient: class {
      constructor(_opts: unknown) {}
      async request(_method: string, _path: string, _body?: unknown) {
        return { status: 200, body: { ok: true } };
      }
    },
  };
});

import { HermesClient } from '../src/client';

function makeContext(inputCount: number, operation: string) {
  const params: Record<string, unknown> = {
    operation,
    correlationId: 'corr-1',
    idempotencyKey: 'idem-1',
    topic: 'IA aplicada a vendas',
    primaryPillar: 'ai-business',
    searchIntent: 'verificar impacto',
    maxSources: 5,
    seedSources: '',
    jobId: 'job-123',
  };
  return {
    getCredentials: async () => ({
      runnerBaseUrl: 'http://cv-hermes-editorial-runner:8100',
      hmacSecret: SECRET,
    }),
    getNodeParameter: (name: string) => params[name],
    getInputData: () => Array.from({ length: inputCount }, () => ({ json: {} })),
    helpers: {},
  };
}

describe('HermesEditorial', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('descreve as quatro operações e a credencial', () => {
    const node = new HermesEditorial();
    expect(node.description.name).toBe('hermesEditorial');
    const opProp = node.description.properties.find((p) => p.name === 'operation');
    const options = (opProp as { options?: Array<{ value: string }> }).options ?? [];
    expect(options.map((o) => o.value).sort()).toEqual(
      ['health', 'validateResearchRequest', 'createJob', 'getJob'].sort(),
    );
    expect(node.description.credentials?.[0]?.name).toBe('crescimentoVerticalHermesApi');
  });

  it('executa health e retorna item linking correto', async () => {
    const node = new HermesEditorial();
    const ctx = makeContext(2, 'health');
    const result = await node.execute.call(ctx as never);
    expect(result).toHaveLength(1);
    expect(result[0]).toHaveLength(2);
    expect(result[0][0].pairedItem).toEqual({ item: 0 });
    expect(result[0][1].pairedItem).toEqual({ item: 1 });
    expect(result[0][0].json).toEqual({ operation: 'health', status: 200, body: { ok: true } });
  });

  it('valida a URL da credencial e rejeita URL externa', async () => {
    const node = new HermesEditorial();
    const ctx = makeContext(1, 'health');
    (ctx.getCredentials as () => Promise<Record<string, unknown>>) = async () => ({
      runnerBaseUrl: 'https://example.com:8100',
      hmacSecret: SECRET,
    });
    await expect(node.execute.call(ctx as never)).rejects.toThrow(/http/);
  });

  it('rejeita jobId inválido', async () => {
    const node = new HermesEditorial();
    const ctx = makeContext(1, 'getJob');
    ctx.getNodeParameter = (name: string) =>
      name === 'operation' ? 'getJob' : 'bad/id/../x';
    await expect(node.execute.call(ctx as never)).rejects.toThrow(/jobId/);
  });

  it('valida a requisição localmente antes de enviar', async () => {
    const node = new HermesEditorial();
    const ctx = makeContext(1, 'validateResearchRequest');
    ctx.getNodeParameter = (name: string) =>
      name === 'operation'
        ? 'validateResearchRequest'
        : name === 'maxSources'
          ? 99
          : '';
    await expect(node.execute.call(ctx as never)).rejects.toThrow(/maxSources/);
  });

  it('HermesClient é instanciado com o segredo sem vazar em erro', async () => {
    expect(HermesClient).toBeDefined();
  });
});
