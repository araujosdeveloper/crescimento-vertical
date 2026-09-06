#!/usr/bin/env bash
# =============================================================================
# Fase 11 — Relatório diário de métricas via Telegram.
#
# Coleta memória/disco/containers + métricas do app (/api/health/metrics) e
# envia um digest ao canal de revisão.
#
# Uso:  phase11-metrics-report.sh
# =============================================================================
set -euo pipefail

TELEGRAM_TOKEN_FILE="${TELEGRAM_TOKEN_FILE:-/opt/crescimento-vertical/.secrets/telegram-bot-token}"
CHAT_ID="${CHAT_ID:-5710991322}"
APP_CONTAINER="${APP_CONTAINER:-cv-phase2-staging-app}"

metrics="$(docker exec "$APP_CONTAINER" node -e "fetch('http://127.0.0.1:3000/api/health/metrics').then(r=>r.json()).then(d=>console.log(JSON.stringify(d))).catch(()=>console.log('{}'))" 2>/dev/null || echo '{}')"

mem="$(free -m | awk '/Mem:/{printf "%d MB usados / %d MB total", $3, $2}')"
disk="$(df -h / | awk 'NR==2{printf "%s usados / %s total (%s)", $3, $2, $5}')"
containers="$(docker ps --format '{{.Names}}: {{.Status}}' | grep -iE 'crescimento|hermes|n8n' | tr '\n' '; ')"

report="$(
  cat <<EOF
📊 Resumo diário — Crescimento Vertical
$(date -u '+%Y-%m-%d %H:%M UTC')

Memória: $mem
Disco: $disk
Métricas: $metrics

Containers: $containers
EOF
)"

token="$(cat "$TELEGRAM_TOKEN_FILE" 2>/dev/null || echo "")"
if [ -n "$token" ]; then
  python3 - "$token" "$CHAT_ID" "$report" <<'PYEOF'
import json, sys, urllib.request
token, chat_id, report = sys.argv[1], sys.argv[2], sys.argv[3]
body = json.dumps({"chat_id": chat_id, "text": report}).encode()
req = urllib.request.Request(f"https://api.telegram.org/bot{token}/sendMessage", data=body, headers={"Content-Type": "application/json"})
try:
    urllib.request.urlopen(req, timeout=10)
except Exception:
    pass
PYEOF
fi

echo "$report"
