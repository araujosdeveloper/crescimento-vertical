/**
 * Registro de métricas em memória (processo único do standalone server).
 *
 * Coleta leve e sem dependência: contagem de requisições, erros, respostas 5xx
 * e amostras de latência para p95. Nunca registra PII nem corpos de requisição.
 */
type Snapshot = {
  requests: number;
  errors: number;
  status5xx: number;
  latencyP95Ms: number;
  memoryRssMb: number;
};

const MAX_LATENCY_SAMPLES = 2000;
const registry = {
  requests: 0,
  errors: 0,
  status5xx: 0,
  latencies: [] as number[],
};

export function recordHttpStatus(status: number, durationMs: number): void {
  registry.requests += 1;
  if (status >= 500) registry.status5xx += 1;
  registry.latencies.push(Math.max(0, durationMs));
  if (registry.latencies.length > MAX_LATENCY_SAMPLES) registry.latencies.shift();
}

export function recordError(): void {
  registry.errors += 1;
}

export function metricsSnapshot(): Snapshot {
  const sorted = [...registry.latencies].sort((a, b) => a - b);
  const p95 = sorted.length
    ? sorted[Math.min(sorted.length - 1, Math.floor(sorted.length * 0.95))]
    : 0;
  return {
    requests: registry.requests,
    errors: registry.errors,
    status5xx: registry.status5xx,
    latencyP95Ms: p95,
    memoryRssMb: Math.round(process.memoryUsage().rss / 1024 / 1024),
  };
}
