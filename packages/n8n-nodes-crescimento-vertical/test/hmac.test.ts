import { describe, expect, it } from 'vitest';

import { createNonce, sign } from '../src/hmac';

describe('hmac', () => {
  it('produz um vetor HMAC conhecido (mensagem {timestamp}.{nonce}.{body})', () => {
    const sig = sign('1700000000', 'nonce', Buffer.from('', 'utf8'), 'secret');
    expect(sig).toBe('eea1a6bb0314070f61adb18c9f5d130b556c97e980537c76256db20a1c4b0874');
  });

  it('assina o corpo com o timestamp e o nonce como prefixo', () => {
    const body = Buffer.from('{"a":1}', 'utf8');
    const sig1 = sign('1700000000', 'n1', body, 'secret');
    const sig2 = sign('1700000000', 'n2', body, 'secret');
    const sig3 = sign('1700000001', 'n1', body, 'secret');
    const sig4 = sign('1700000000', 'n1', Buffer.from('{"a":2}', 'utf8'), 'secret');
    expect(sig1).not.toBe(sig2);
    expect(sig1).not.toBe(sig3);
    expect(sig1).not.toBe(sig4);
  });

  it('gera nonce diferente a cada chamada', () => {
    const a = createNonce();
    const b = createNonce();
    expect(a).not.toBe(b);
    expect(a).toMatch(/^[0-9a-f]{32}$/);
  });
});
