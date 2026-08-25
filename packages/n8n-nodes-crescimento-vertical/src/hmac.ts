import { createHmac, randomBytes } from 'crypto';

export const SIGNATURE_HEADER = 'X-CV-Signature';
export const TIMESTAMP_HEADER = 'X-CV-Timestamp';
export const NONCE_HEADER = 'X-CV-Nonce';

/** Gera um nonce criptograficamente seguro (32 caracteres hexadecimais). */
export function createNonce(): string {
  return randomBytes(16).toString('hex');
}

/** Assina a mensagem `{timestamp}.{nonce}.{body}` com HMAC-SHA256. */
export function sign(
  timestamp: string,
  nonce: string,
  bodyBytes: Buffer,
  secret: string,
): string {
  const message = Buffer.concat([
    Buffer.from(`${timestamp}.${nonce}.`, 'utf8'),
    bodyBytes,
  ]);
  return createHmac('sha256', secret).update(message).digest('hex');
}
