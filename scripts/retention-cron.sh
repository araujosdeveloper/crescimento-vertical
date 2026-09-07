#!/usr/bin/env bash
# =============================================================================
# Fase 12 — Retenção de leads (LGPD).
#
# Remove leads com retentionUntil vencido. Roda dentro do container `migrate`
# (que tem acesso ao banco de produção).
#
# Uso:  retention-cron.sh   (aplica a retenção)
# =============================================================================
set -euo pipefail

REPO="/opt/crescimento-vertical"

docker compose --env-file "$REPO/.env.production" -f "$REPO/docker-compose.production.yml" \
  --profile migrate run --rm -T \
  -e APPLY_RETENTION=true \
  -v "$REPO/scripts:/app/scripts:ro" \
  migrate npx tsx /app/scripts/retention-leads.ts
