# Runbook operacional

## Serviços (staging)

| Container | Papel | Observação |
| --- | --- | --- |
| `cv-phase2-staging-app` | aplicação (Next.js + Payload) | healthy; `--env-file .env.phase2.staging` |
| `cv-phase2-staging-postgres` | PostgreSQL 16 | sem porta pública |
| `cv-hermes-editorial-runner` | runner Hermes (governança) | execução desabilitada (dupla trava) |
| `cv-phase8-egress-proxy` | proxy de egress (DeepSeek/Tavily) | allowlist 443 |
| `n8n-n8n-1` | n8n (orquestração) | compartilhado; workflows CV-01..04 |

## Operações comuns

- **Redeploy do app (staging):**
  `docker compose --env-file .env.phase2.staging -f docker-compose.phase2.yml build && docker compose --env-file .env.phase2.staging -f docker-compose.phase2.yml up -d app`
- **Migração:**
  `docker compose --env-file .env.phase2.staging -f docker-compose.phase2.yml --profile migrate run --rm migrate`
- **Recreate do runner (fechado):**
  `docker compose --env-file .env.hermes-editorial -f docker-compose.hermes-editorial.yml up -d --no-deps --no-build --pull never cv-hermes-editorial-runner`
- **Healthchecks:**
  `/api/health/live`, `/api/health/ready`, runner `:8100/health`.

## Produção editorial (Fase 9 ativa)

- Workflows n8n: CV-01 (intake), CV-02 (Telegram), CV-03 (decisão), CV-04 (monitoramento).
- Publicação: revisão humana no Payload Admin (`draft → in_review → approved → published`).
- Bot Telegram `@AlertaHermes_Bot` (chat de revisão `5710991322`).

## Regras

- Runner permanece com `RUNNER_EXECUTION_ENABLED=false` e sem `execution-enable` (dupla trava).
- `retry3` proibido; publicação automática proibida.
- Não alterar DNS, Traefik global, redes compartilhadas ou containers fora do escopo sem autorização.
