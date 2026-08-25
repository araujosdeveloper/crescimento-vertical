import http from 'http';
import { AddressInfo } from 'net';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { HermesClient } from '../src/client';
import { sign, SIGNATURE_HEADER, TIMESTAMP_HEADER, NONCE_HEADER } from '../src/hmac';

const SECRET = 'test-secret-value';

let server: http.Server;
let baseUrl: string;
let handler: http.RequestListener;
const received: Array<{ headers: http.IncomingHttpHeaders; body: string }> = [];

function jsonHandler(status: number, payload: unknown): http.RequestListener {
  return (req, res) => {
    const chunks: Buffer[] = [];
    req.on('data', (c: Buffer) => chunks.push(c));
    req.on('end', () => {
      const body = Buffer.concat(chunks).toString('utf8');
      received.push({ headers: req.headers, body });
      res.writeHead(status, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(payload));
    });
  };
}

beforeAll(async () => {
  handler = jsonHandler(200, { ok: true });
  await new Promise<void>((resolve) => {
    server = http.createServer((req, res) => handler(req, res));
    server.listen(0, '127.0.0.1', () => {
      const addr = server.address() as AddressInfo;
      baseUrl = `http://127.0.0.1:${addr.port}`;
      resolve();
    });
  });
});

afterAll(async () => {
  await new Promise<void>((resolve) => server.close(() => resolve()));
});

describe('HermesClient', () => {
  it('assina exatamente os mesmos bytes enviados', async () => {
    received.length = 0;
    handler = jsonHandler(200, { ok: true });
    const client = new HermesClient({ baseUrl, secret: SECRET });
    const body = { correlationId: 'c1', n: 1 };
    await client.request('POST', '/v1/validate', body);

    expect(received).toHaveLength(1);
    const sentBody = received[0].body;
    const ts = received[0].headers[TIMESTAMP_HEADER.toLowerCase()] as string;
    const nonce = received[0].headers[NONCE_HEADER.toLowerCase()] as string;
    const sig = received[0].headers[SIGNATURE_HEADER.toLowerCase()] as string;

    expect(sentBody).toBe(JSON.stringify(body));
    expect(sig).toBe(sign(ts, nonce, Buffer.from(sentBody, 'utf8'), SECRET));
  });

  it('gera nonce diferente a cada requisição', async () => {
    received.length = 0;
    handler = jsonHandler(200, { ok: true });
    const client = new HermesClient({ baseUrl, secret: SECRET });
    await client.request('GET', '/health');
    await client.request('GET', '/health');
    expect(received).toHaveLength(2);
    const n1 = received[0].headers[NONCE_HEADER.toLowerCase()] as string;
    const n2 = received[1].headers[NONCE_HEADER.toLowerCase()] as string;
    expect(n1).not.toBe(n2);
  });

  it('usa timestamp Unix em segundos dentro da tolerância', async () => {
    received.length = 0;
    handler = jsonHandler(200, { ok: true });
    const before = Math.floor(Date.now() / 1000);
    const client = new HermesClient({ baseUrl, secret: SECRET });
    await client.request('GET', '/health');
    const after = Math.floor(Date.now() / 1000);
    const ts = Number(received[0].headers[TIMESTAMP_HEADER.toLowerCase()]);
    expect(ts).toBeGreaterThanOrEqual(before - 1);
    expect(ts).toBeLessThanOrEqual(after + 1);
  });

  it('retorna status (não lança) para 401/409/503', async () => {
    handler = jsonHandler(503, { error: 'execution_disabled' });
    const client = new HermesClient({ baseUrl, secret: SECRET });
    const res = await client.request('POST', '/v1/jobs', { a: 1 });
    expect(res.status).toBe(503);
    expect(res.body).toEqual({ error: 'execution_disabled' });

    handler = jsonHandler(401, { error: 'invalid_signature' });
    const res401 = await client.request('GET', '/health');
    expect(res401.status).toBe(401);
    expect(res401.body).toEqual({ error: 'invalid_signature' });

    handler = jsonHandler(409, { error: 'nonce_replayed' });
    const res409 = await client.request('GET', '/health');
    expect(res409.status).toBe(409);
  });

  it('falha por timeout sem expor segredo', async () => {
    handler = (_req, res) => {
      setTimeout(() => res.end(), 2000);
    };
    const client = new HermesClient({ baseUrl, secret: SECRET, timeoutMs: 100 });
    await expect(client.request('GET', '/health')).rejects.toThrow(/timeout/);
  });

  it('falha por resposta grande sem expor segredo', async () => {
    handler = (_req, res) => {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end('x'.repeat(200_000));
    };
    const client = new HermesClient({ baseUrl, secret: SECRET, maxResponseBytes: 1024 });
    await expect(client.request('GET', '/health')).rejects.toThrow(/response_too_large/);
  });

  it('nunca expõe o segredo em mensagens de erro', async () => {
    handler = jsonHandler(500, { error: 'internal' });
    const client = new HermesClient({ baseUrl, secret: SECRET });
    const res = await client.request('GET', '/health');
    expect(JSON.stringify(res)).not.toContain(SECRET);
  });
});
