#!/usr/bin/env bash
# =============================================================================
# Fase 11 — Health check + alerta via Telegram.
#
# Verifica o estado `healthy` dos containers da Crescimento Vertical e envia
# alerta ao canal de revisão do Telegram se algum estiver fora do estado.
#
# Uso:  phase11-health-check.sh
# Env:  TELEGRAM_TOKEN_FILE (padrão .secrets/telegram-bot-token)
#       CHAT_ID (padrão 5710991322)
# =============================================================================
set -euo pipefail

TELEGRAM_TOKEN_FILE="${TELEGRAM_TOKEN_FILE:-/opt/crescimento-vertical/.secrets/telegram-bot-token}"
CHAT_ID="${CHAT_ID:-5710991322}"
CONTAINERS="cv-phase2-staging-app cv-phase2-staging-postgres cv-hermes-editorial-runner cv-phase8-egress-proxy n8n-n8n-1"

failed=""
for container in $CONTAINERS; do
  running="$(docker inspect "$container" --format '{{.State.Running}}' 2>/dev/null || echo false)"
  health="$(docker inspect "$container" --format '{{if .State.Health}}{{.State.Health.Status}}{{end}}' 2>/dev/null || echo "")"
  if [ "$running" != "true" ]; then
    failed="$failed $container(down)"
  elif [ -n "$health" ] && [ "$health" != "healthy" ]; then
    failed="$failed $container($health)"
  fi
done

if [ -n "$failed" ]; then
  msg="⚠️ Alerta Crescimento Vertical — serviço fora do healthy:$failed"
  echo "$msg"
  token="$(cat "$TELEGRAM_TOKEN_FILE" 2>/dev/null || echo "")"
  if [ -n "$token" ]; then
    curl -s "https://api.telegram.org/bot$token/sendMessage" \
      -H "Content-Type: application/json" \
      -d "{\"chat_id\":\"$CHAT_ID\",\"text\":\"$msg\"}" > /dev/null 2>&1 || true
  fi
  exit 1
fi

echo "health ok"
