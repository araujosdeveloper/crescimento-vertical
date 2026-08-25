import http from 'http';
import { URL } from 'url';

import { HermesApiError } from './errors';
import {
  createNonce,
  NONCE_HEADER,
  SIGNATURE_HEADER,
  sign,
  TIMESTAMP_HEADER,
} from './hmac';

export interface HermesClientOptions {
  baseUrl: string;
  secret: string;
  timeoutMs?: number;
  maxResponseBytes?: number;
}

export interface HermesApiResponse {
  status: number;
  body: unknown;
}

/**
 * Cliente HTTP para o runner. Serializa o corpo uma única vez, assina
 * exatamente os mesmos bytes enviados e não faz retry automático.
 */
export class HermesClient {
  private readonly timeoutMs: number;
  private readonly maxResponseBytes: number;

  constructor(private readonly options: HermesClientOptions) {
    this.timeoutMs = options.timeoutMs ?? 10_000;
    this.maxResponseBytes = options.maxResponseBytes ?? 1_048_576;
  }

  async request(
    method: 'GET' | 'POST',
    path: string,
    body?: unknown,
  ): Promise<HermesApiResponse> {
    const bodyString = body === undefined ? undefined : JSON.stringify(body);
    const bodyBytes = Buffer.from(bodyString ?? '', 'utf8');
    const timestamp = String(Math.floor(Date.now() / 1000));
    const nonce = createNonce();
    const signature = sign(timestamp, nonce, bodyBytes, this.options.secret);

    const headers: Record<string, string> = {
      [SIGNATURE_HEADER]: signature,
      [TIMESTAMP_HEADER]: timestamp,
      [NONCE_HEADER]: nonce,
    };
    if (bodyString !== undefined) {
      headers['Content-Type'] = 'application/json';
      headers['Content-Length'] = String(bodyBytes.length);
    }

    return new Promise<HermesApiResponse>((resolve, reject) => {
      const url = new URL(this.options.baseUrl + path);
      const req = http.request(
        {
          hostname: url.hostname,
          port: url.port,
          path: `${url.pathname}${url.search}`,
          method,
          headers,
          timeout: this.timeoutMs,
        },
        (res) => {
          const chunks: Buffer[] = [];
          let size = 0;
          res.on('data', (chunk: Buffer) => {
            size += chunk.length;
            if (size > this.maxResponseBytes) {
              req.destroy(new Error('response_too_large'));
              return;
            }
            chunks.push(chunk);
          });
          res.on('end', () => {
            const raw = Buffer.concat(chunks).toString('utf8');
            let parsed: unknown = raw;
            try {
              parsed = JSON.parse(raw);
            } catch {
              // mantém o texto bruto
            }
            resolve({ status: res.statusCode ?? 0, body: parsed });
          });
        },
      );

      req.on('timeout', () => req.destroy(new Error('timeout')));
      req.on('error', (err) => reject(this.sanitizeTransportError(err)));
      if (bodyBytes.length > 0) {
        req.write(bodyBytes);
      }
      req.end();
    });
  }

  private sanitizeTransportError(err: Error): HermesApiError {
    const msg = err.message;
    if (msg === 'timeout') {
      return new HermesApiError(undefined, 'timeout: o runner não respondeu a tempo.');
    }
    if (msg === 'response_too_large') {
      return new HermesApiError(undefined, 'response_too_large: resposta excedeu o limite.');
    }
    return new HermesApiError(undefined, `falha de rede ao acessar o runner (${msg}).`);
  }
}
