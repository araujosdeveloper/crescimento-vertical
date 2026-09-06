#!/usr/bin/env bash
# =============================================================================
# Etapa 1 — Ciclo editorial (1 pauta por execução).
#
# Fluxo: dossiê (runner) → rascunho → completar → capa → notificar Telegram.
# A publicação final permanece manual (aprovação humana no Payload Admin).
#
# Uso:  cycle.sh [--index N]
# =============================================================================
set -euo pipefail

REPO="/opt/crescimento-vertical"
DIR="$REPO/scripts/editorial"
PAUTAS="$DIR/pautas.json"
POINTER="$DIR/consumed.txt"
ERRLOG="$(mktemp)"

log() { echo "[editorial-cycle] $*"; }

next_index() {
  local idx
  idx=$(cat "$POINTER" 2>/dev/null || echo 0)
  echo "$idx"
}

pauta_at() {
  python3 - "$PAUTAS" "$1" <<'PY'
import json, sys
data = json.load(open(sys.argv[1]))
i = int(sys.argv[2])
if i >= len(data):
    sys.exit(0)
print(json.dumps(data[i], ensure_ascii=False))
PY
}

INDEX="$(next_index)"
if [ "$1" = "--index" ]; then
  INDEX="${2:?índice ausente}"
elif [ -n "$1" ]; then
  INDEX="$1"
fi
PAUTA="$(pauta_at "$INDEX")"
if [ -z "$PAUTA" ]; then
  log "fila esgotada (índice $INDEX). Adicione pautas em pautas.json."
  exit 0
fi

TOPIC=$(python3 -c "import json,sys; print(json.loads(sys.argv[1])['topic'])" "$PAUTA")
PILLAR=$(python3 -c "import json,sys; print(json.loads(sys.argv[1])['primaryPillar'])" "$PAUTA")
SERVICE=$(python3 -c "import json,sys; print(json.loads(sys.argv[1])['serviceSlug'])" "$PAUTA")
CTYPE=$(python3 -c "import json,sys; print(json.loads(sys.argv[1])['contentType'])" "$PAUTA")

case "$PILLAR" in
  ai-business) CAT_SLUG=inteligencia-artificial; CAT_NAME="Inteligência Artificial";;
  automation) CAT_SLUG=automacao; CAT_NAME="Automação";;
  sales-attendance) CAT_SLUG=vendas-e-atendimento; CAT_NAME="Vendas e Atendimento";;
  sites-conversion) CAT_SLUG=sites-e-conversao; CAT_NAME="Sites e Conversão";;
  tools-integrations) CAT_SLUG=ferramentas-e-integracoes; CAT_NAME="Ferramentas e Integrações";;
  *) log "pilar desconhecido: $PILLAR"; exit 1;;
esac

CORR="cv-$(date -u +%Y%m%dT%H%M%SZ)"
IDEM="$(printf '%s' "$TOPIC" | sha256sum | cut -c1-32)"
SEARCH_INTENT="$TOPIC ($CTYPE)"

log "pauta #$INDEX: $TOPIC ($PILLAR)"

# ------------------------------------------------------------------ 1. Dossiê
REQUEST=$(python3 - "$TOPIC" "$PILLAR" "$SEARCH_INTENT" "$CORR" "$IDEM" <<'PY'
import datetime, json, sys
topic, pillar, intent, corr, idem = sys.argv[1:6]
print(json.dumps({
    "schemaVersion": "1.0",
    "correlationId": corr,
    "idempotencyKey": idem,
    "topic": topic,
    "primaryPillar": pillar,
    "searchIntent": intent,
    "language": "pt-BR",
    "requestedAt": datetime.datetime.now(datetime.timezone.utc).isoformat(),
    "maxSources": 4,
}))
PY
)

DOSSIER_FILE="$(mktemp)"
log "gerando dossiê (runner)..."
if ! docker exec -i -e REQUEST_BODY="$REQUEST" cv-hermes-editorial-runner /opt/hermes/.venv/bin/python - < "$DIR/runner-request.py" > "$DOSSIER_FILE" 2>"$ERRLOG"; then
  log "FALHA no runner:"; tail -5 "$ERRLOG"; cat "$DOSSIER_FILE"; exit 1
fi
if python3 -c "import json,sys; d=json.load(open(sys.argv[1])); sys.exit(0 if 'error' in d else 1)" "$DOSSIER_FILE"; then
  log "dossiê falhou: $(cat "$DOSSIER_FILE")"; exit 1
fi
log "dossiê ok."

# Título final (do dossiê, com fallback no tópico).
NEW_TITLE=$(python3 -c "import json,sys; d=json.load(open(sys.argv[1])); print((d.get('title') or '').strip() or sys.argv[2])" "$DOSSIER_FILE" "$TOPIC")
SEO_DESC=$(python3 -c "import json,sys; d=json.load(open(sys.argv[1])); print((d.get('dek') or '')[:160])" "$DOSSIER_FILE")

# ------------------------------------------------- 2-4. Rascunho/completar/capa
run_tsx() {
  docker compose --env-file "$REPO/.env.production" -f "$REPO/docker-compose.production.yml" \
    --profile migrate run --rm -T \
    -e PAYLOAD_MEDIA_DIR=/app/media \
    -v "crescimento-vertical-production_media:/app/media" \
    -v "$REPO/scripts:/app/scripts:ro" \
    -v "$DOSSIER_FILE:/tmp/dossier.json:ro" \
    migrate npx tsx "$1" 2>"$ERRLOG"
}

log "criando rascunho..."
DRAFT_OUT="$(TITLE="$TOPIC" run_tsx /app/scripts/editorial/create-draft.ts 2>&1)"
echo "$DRAFT_OUT" | tail -1
ARTICLE_ID=$(echo "$DRAFT_OUT" | grep -oE 'DRAFT_(CREATED|EXISTS) [0-9]+' | awk '{print $2}' | tail -1)
[ -z "$ARTICLE_ID" ] && { log "não obteve id do rascunho: $DRAFT_OUT"; exit 1; }

log "completando artigo (id $ARTICLE_ID)..."
DOSSIER_PATH=/tmp/dossier.json ARTICLE_TITLE="$TOPIC" NEW_TITLE="$NEW_TITLE" \
  CATEGORY_SLUG="$CAT_SLUG" CATEGORY_NAME="$CAT_NAME" SERVICE_SLUG="$SERVICE" \
  SEO_TITLE="$NEW_TITLE" SEO_DESCRIPTION="$SEO_DESC" \
  run_tsx /app/scripts/produce-article.ts 2>&1 | tail -2

log "gerando capa..."
COVER_TITLE="$NEW_TITLE" ARTICLE_ID="$ARTICLE_ID" \
  run_tsx /app/scripts/generate-article-cover.ts 2>&1 | tail -1

# ----------------------------------------------------------------- 5. Notificar
TOKEN_FILE="$REPO/.secrets/telegram-bot-token"
CHAT_ID="5710991322"
if [ -f "$TOKEN_FILE" ]; then
  TOKEN="$(cat "$TOKEN_FILE")"
  MSG="Nova pauta pronta para revisão
Título: $NEW_TITLE
Pilar: $PILLAR
Artigo ID: $ARTICLE_ID

Revise no Payload Admin e aprove para publicar."
  curl -s "https://api.telegram.org/bot$TOKEN/sendMessage" \
    -H "Content-Type: application/json" \
    -d "$(python3 -c "import json,sys; print(json.dumps({'chat_id': sys.argv[1], 'text': sys.argv[2]}))" "$CHAT_ID" "$MSG")" \
    >/dev/null 2>&1 || true
fi

# ------------------------------------------------------------------ Avançar
printf '%s\n' "$((INDEX + 1))" > "$POINTER"
rm -f "$DOSSIER_FILE" "$ERRLOG"
log "concluído. Rascunho $ARTICLE_ID aguardando aprovação humana."
