# Fase 11 — Segurança, observabilidade, backup e recuperação

## Estado vigente

A Fase 11 está em execução. A Fase 10 foi aceita em 5 de setembro de 2026. O
objetivo é tornar a operação segura, observável e recuperável antes da Fase 12
(lançamento).

## Critério de saída

- alertas chegam ao responsável;
- restauração cumpre RPO ≤ 6 h e RTO ≤ 4 h;
- nenhuma vulnerabilidade crítica conhecida;
- imagens e dependências fixadas (sem `latest`);
- backups off-site e rollback testados.

## Segurança

### Feito

- **Headers de segurança** (`src/middleware.ts`): CSP, `X-Frame-Options: DENY`,
  `X-Content-Type-Options: nosniff`, `Referrer-Policy`,
  `Permissions-Policy`, HSTS — aplicados a todas as rotas.
- **Rate limiting** no endpoint de leads (`src/app/api/leads/route.ts`):
  10 requisições/minuto por IP (via `x-forwarded-for`), com resposta `429`.
- **Varredura de segredos** no CI (Gitleaks histórico completo) — ativo.
- **Dependências** (`npm audit --omit=dev`): 13 achados (1 baixo, 12 moderados),
  todos **transitivos do Payload 3.88.0** (DOMPurify via Monaco, esbuild via
  drizzle-kit, `payload`), sem correção segura disponível na versão estável
  mais recente. Nenhuma vulnerabilidade alta ou crítica; o `esbuild` é do
  servidor de desenvolvimento (não exposto em produção).

### Pendente

- CSP refinada por ambiente (a atual usa `unsafe-inline/unsafe-eval` exigidos
  pelo Next.js; avaliar nonces após o lançamento).
- Revisão de CORS/CSRF/SSRF nas integrações n8n e no webhook do runner.
- Política de atualização do n8n/Hermes compartilhados.

## Observabilidade

### Pendente

- Logs estruturados (JSON, UTC, nível, serviço, ambiente, release, requestId);
- métricas: uptime, HTTP 5xx, latência p95, CPU/RAM/disco, PostgreSQL, jobs,
  custos, workflows, leads pendentes;
- alertas entregues ao responsável (canal a definir);
- dashboard mínimo operacional;
- ausência de PII/tokens/prompts em logs.

## Backup e recuperação

### Pendente (implementar nesta fase)

- PostgreSQL lógico a cada 6 h (`pg_dump` custom);
- backup completo diário (banco + mídia + configuração + Git bundle);
- retenção 30 dias (diário) + 12 meses (mensal);
- cópia criptografada off-site;
- teste mensal de restauração isolada;
- RPO ≤ 6 h e RTO ≤ 4 h.

## Runbooks

- `docs/41-runbook-operacional.md`;
- `docs/42-runbook-incidentes-e-rollback.md`;
- `docs/43-runbook-backup-e-restauracao.md`.

## Próximo passo

Implementar o script de backup automatizado (cron) e os runbooks; depois testar
a restauração isolada e documentar o resultado.
