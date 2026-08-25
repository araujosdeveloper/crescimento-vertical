import { describe, expect, it } from 'vitest';

import { CrescimentoVerticalHermesApi } from '../credentials/CrescimentoVerticalHermesApi.credentials';

describe('CrescimentoVerticalHermesApi', () => {
  it('expõe nome e tipo corretos', () => {
    const cred = new CrescimentoVerticalHermesApi();
    expect(cred.name).toBe('crescimentoVerticalHermesApi');
    expect(cred.displayName).toContain('Crescimento Vertical');
  });

  it('define runnerBaseUrl (string) e hmacSecret (password)', () => {
    const cred = new CrescimentoVerticalHermesApi();
    const baseUrl = cred.properties.find((p) => p.name === 'runnerBaseUrl');
    const secret = cred.properties.find((p) => p.name === 'hmacSecret');
    expect(baseUrl).toBeDefined();
    expect(baseUrl?.type).toBe('string');
    expect(baseUrl?.default).toBe('http://cv-hermes-editorial-runner:8100');
    expect(secret).toBeDefined();
    expect(secret?.type).toBe('string');
    expect((secret as { typeOptions?: { password?: boolean } }).typeOptions?.password).toBe(true);
  });
});
