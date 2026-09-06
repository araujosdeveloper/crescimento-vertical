# Fase 11 — Segurança, observabilidade, backup e recuperação

## Estado vigente

A Fase 11 está **concluída e aceita** (aceite humano de 6/9/2026). As
pendências locais foram resolvidas (ADR-040 e ADR-041); a única exceção é a
cópia off-site, postergada para a Fase 12 por decisão expressa do responsável.

## Critério de saída

- alertas chegam ao responsável;
- restauração cumpre RPO ≤ 6 h e RTO ≤ 4 h;
- nenhuma vulnerabilidade crítica conhecida;
- imagens e dependências fixadas (sem `latest`);
- backups off-site e rollback testados.

## Estado do critério de saída

| Critério | Estado |
| --- | --- |
| Alertas ao responsável | ok (health-check + digest Telegram) |
| RPO ≤ 6 h / RTO ≤ 4 h | ok (cron 6 h + restauração isolada comprovada) |
| Nenhuma vuln crítica | ok (13 achados low/moderado transitivos do Payload) |
| Imagens/dependências fixadas | ok para imagens próprias (digest); Hermes/n8n `:latest` aceitos (ADR-041) |
| Backups off-site | **postergado para a Fase 12** (ADR-041) |
| Rollback testado | ok (restauração isolada + rotina mensal) |

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

### Revisão CORS/CSRF/SSRF (feita)

- **Formulário de leads** (`src/app/api/leads/route.ts` + `src/lib/lead-intake.ts`):
  CSRF mitigado por allowlist de `Origin` (`requestOriginAllowed`), token HMAC
  com expiração (`verifyFormToken`, janela 1800 s, `timingSafeEqual`),
  idempotência por chave e honeypot (`website`). Sem CORS aberto (mesma origem).
- **Runner editorial** (`services/hermes-editorial-runner/app.py`): HMAC-SHA256 +
  nonce + janela anti-replay + corpo ≤ 1 MiB + schema estrito; SSRF contido pela
  rede `internal` + egress proxy deny-by-default (`phase8-egress-proxy`) com
  allowlist 443. Sem SSRF contra o CMS/PostgreSQL (runner sem rede para eles).
- **Conector n8n** (`packages/n8n-nodes-crescimento-vertical`): HMAC sobre corpo
  bruto, URL interna, validação de schema antes de chamar o runner.

Nenhuma pendência material de CORS/CSRF/SSRF foi identificada nas integrações.

### Pendente

- CSP refinada por ambiente (a atual usa `unsafe-inline/unsafe-eval` exigidos
  pelo Next.js; avaliar nonces após o lançamento — decisão adiada por design).

## Observabilidade

### Feito

- **Health check + alerta** (`scripts/phase11-health-check.sh`): verifica os
  containers a cada 5 min (cron) e envia alerta via Telegram
  (`@AlertaHermes_Bot`, chat `5710991322`) se algum sair do estado `healthy`.
- **Digest diário de métricas** (`scripts/phase11-metrics-report.sh`): memória,
  disco, containers e métricas do app (`/api/health/metrics`) via Telegram.
- **Logs estruturados** (`src/lib/logger.ts`): JSON em uma linha por evento com
  `ts` (UTC), `level`, `service`, `env`, `release`, `requestId` e `message`,
  aplicado aos endpoints operacionais (`/api/leads`, `/api/health/metrics`).
  Sem PII/tokens/prompts (apenas identificadores e contadores).
- **Métricas do app** (`src/app/api/health/metrics/route.ts`): contagens de
  articles/leads/services/media/sources, uptime e **leads pendentes**
  (`lead-outbox` em `pending`).

### Revisão de PII em logs

Auditoria de `console.*`/`print`/`logging` em `src/`, `scripts/` e
`services/hermes-editorial-runner/`: nenhum log emite corpo de lead, e-mail,
telefone, token, cookie, prompt ou resposta integral. O runner declara
explicitamente “corpo integral nunca é logado” e usa mensagens `key=value`
mínimas; o processador de outbox loga apenas contadores (`claimed/sent/failed`).

### Pendente

- métricas de HTTP 5xx e latência p95 (exigem instrumentação de middleware ou
  ferramenta dedicada — decisão de solução de métricas);
- dashboard mínimo operacional (decisão de ferramenta a definir).

## Backup e recuperação

### Feito

- **Script de backup** (`scripts/phase11-backup.sh`): dump PostgreSQL (custom),
  mídia, configuração e bundle Git, com `SHA256SUMS`.
- **Cron** na VPS: lógico a cada 6 h (`hourly`) e completo diário às 3 h
  (`daily`), em `/opt/backups/crescimento-vertical`.
- **Teste de restauração isolada** (6/9/2026): dump restaurado em PostgreSQL 16
  descartável; contagens conferidas contra o banco de origem (articles=5,
  users=2, services=6, sources=21, media=6, authors=1, categories=5). Restore
  em segundos — RTO ≤ 4 h comprovado.
- **Retenção automática** (`scripts/phase11-retention.sh`): hourly 7 dias, daily
  30 dias, monthly 12 meses; promoção mensal automática no 1º dia do mês.
- **Rotina de restauração** (`scripts/phase11-restore-test.sh`): restaura o
  backup diário mais recente em PostgreSQL 16 descartável, valida `SHA256SUMS` e
  confere contagens, sem tocar produção/staging (teste mensal + manual).
- **Imagens base fixadas**: `node:22-alpine` e `postgres:16-alpine` pinados por
  digest no `Dockerfile` e no `docker-compose.phase2.yml` (ADR-040).

### Pendente

- cópia criptografada off-site (decisão de destino/credencial — ver abaixo).

## Runbooks

- `docs/41-runbook-operacional.md`;
- `docs/42-runbook-incidentes-e-rollback.md`;
- `docs/43-runbook-backup-e-restauracao.md`.

## Decisões bloqueantes para o critério de saída

Fechadas em 6/9/2026 (ADR-041, decisão expressa do responsável):

1. **Off-site postergado para a Fase 12** (pré-lançamento) — sem credencial de
   storage externo nesta data; risco registrado como atividade obrigatória da
   Fase 12.
2. **Dashboard mínimo = digest Telegram** (`phase11-metrics-report.sh` +
   `/api/health/metrics`); 5xx/p95 documentados como melhoria futura.
3. **Imagens compartilhadas `:latest`** (Hermes/n8n) aceitas com risco
   documentado; atualização governada pelo operador do host.

## Próximo passo

Prosseguir para a Fase 12, cujo pré-lançamento deve incluir a cópia off-site de
backup (ADR-041).
