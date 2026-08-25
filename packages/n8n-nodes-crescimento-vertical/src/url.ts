import { URL } from 'url';

export const RUNNER_HOST = 'cv-hermes-editorial-runner';
export const RUNNER_PORT = '8100';
export const RUNNER_ALLOWED_URL = `http://${RUNNER_HOST}:${RUNNER_PORT}`;

/**
 * Valida que a URL do runner seja exclusivamente a URL interna HTTP.
 *
 * Regras:
 * - protocolo exclusivamente `http`;
 * - hostname exclusivamente `cv-hermes-editorial-runner`;
 * - porta `8100` (a exposta pelo Compose do runner);
 * - sem username, password, query string ou fragment;
 * - nunca aceita uma URL vinda de item/expressão (é sempre o valor literal da
 *   credencial).
 */
export function validateRunnerBaseUrl(value: unknown): string {
  if (typeof value !== 'string' || value.trim() === '') {
    throw new Error('Runner base URL inválida.');
  }

  let parsed: URL;
  try {
    parsed = new URL(value);
  } catch {
    throw new Error('Runner base URL não é uma URL válida.');
  }

  if (parsed.protocol !== 'http:') {
    throw new Error('Runner base URL deve usar somente http (rede interna).');
  }
  if (parsed.hostname !== RUNNER_HOST) {
    throw new Error('Runner base URL deve apontar somente para o host interno.');
  }
  if (parsed.port !== RUNNER_PORT) {
    throw new Error(`Runner base URL deve usar a porta interna ${RUNNER_PORT}.`);
  }
  if (parsed.username || parsed.password) {
    throw new Error('Runner base URL não pode conter credenciais.');
  }
  if (parsed.search || parsed.hash) {
    throw new Error('Runner base URL não pode conter query string ou fragment.');
  }

  return value.trim().replace(/\/+$/, '');
}
