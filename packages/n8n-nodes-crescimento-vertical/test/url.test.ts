import { describe, expect, it } from 'vitest';

import { RUNNER_ALLOWED_URL, validateRunnerBaseUrl } from '../src/url';

describe('validateRunnerBaseUrl', () => {
  it('aceita a URL interna correta', () => {
    expect(validateRunnerBaseUrl('http://cv-hermes-editorial-runner:8100')).toBe(
      RUNNER_ALLOWED_URL,
    );
  });

  it('aceita a URL interna com barra final', () => {
    expect(validateRunnerBaseUrl('http://cv-hermes-editorial-runner:8100/')).toBe(
      RUNNER_ALLOWED_URL,
    );
  });

  it('rejeita protocolo HTTPS', () => {
    expect(() => validateRunnerBaseUrl('https://cv-hermes-editorial-runner:8100')).toThrow();
  });

  it('rejeita hostname externo', () => {
    expect(() => validateRunnerBaseUrl('http://example.com:8100')).toThrow();
  });

  it('rejeita porta diferente', () => {
    expect(() => validateRunnerBaseUrl('http://cv-hermes-editorial-runner:9999')).toThrow();
  });

  it('rejeita URL com credenciais', () => {
    expect(() =>
      validateRunnerBaseUrl('http://user:pass@cv-hermes-editorial-runner:8100'),
    ).toThrow();
  });

  it('rejeita URL com query string', () => {
    expect(() =>
      validateRunnerBaseUrl('http://cv-hermes-editorial-runner:8100?x=1'),
    ).toThrow();
  });

  it('rejeita URL com fragment', () => {
    expect(() => validateRunnerBaseUrl('http://cv-hermes-editorial-runner:8100#frag')).toThrow();
  });

  it('rejeita valores não-string (ex.: expressão/input)', () => {
    expect(() => validateRunnerBaseUrl(12345)).toThrow();
    expect(() => validateRunnerBaseUrl('')).toThrow();
  });
});
