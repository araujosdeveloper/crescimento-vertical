#!/usr/bin/env bash
# =============================================================================
# Fase 11/12 — Backup (PostgreSQL produção + mídia + n8n + runner + Git).
#
# Uso:  phase11-backup.sh <BACKUP_ROOT> <daily|hourly>
#   daily  : completo (produção + staging + mídia + n8n + runner + Git)
#   hourly : dump lógico da produção (pg_dump custom) + SHA256SUMS
#
# Destino: BACKUP_ROOT/phase11-<mode>-<UTC timestamp>/
# Retenção: 30 dias (diário) + 12 meses (mensal) — ver docs/43.
# Segredos não são copiados para o repositório; os arquivos ficam com 0600.
# =============================================================================
set -euo pipefail

BACKUP_ROOT="${1:?backup root required}"
MODE="${2:-daily}"
PROD_PG="${PROD_PG:-cv-production-postgres}"
STAGING_PG="${STAGING_PG:-cv-phase2-staging-postgres}"
MEDIA_VOLUME="${MEDIA_VOLUME:-crescimento-vertical-production_media}"
N8N_VOLUME="${N8N_VOLUME:-n8n_data}"
RUNNER_VOLUME="${RUNNER_VOLUME:-crescimento-vertical-hermes-editorial_runner-state}"
REPO_DIR="${REPO_DIR:-/opt/crescimento-vertical}"

TIMESTAMP="$(date -u +%Y%m%dT%H%M%SZ)"
DEST="$BACKUP_ROOT/phase11-$MODE-$TIMESTAMP"
umask 077
mkdir -p "$DEST"
chmod 700 "$DEST"

log() { echo "[phase11-backup] $*"; }

vol_path() {
  docker volume inspect "$1" --format '{{.Mountpoint}}' 2>/dev/null || true
}

log "dump PostgreSQL produção ($PROD_PG)"
docker exec "$PROD_PG" sh -c 'pg_dump -U "$POSTGRES_USER" -d "$POSTGRES_DB" --format=custom --no-owner --no-acl' > "$DEST/postgres.dump"

if [ "$MODE" = "daily" ]; then
  log "dump PostgreSQL staging ($STAGING_PG)"
  if docker exec "$STAGING_PG" sh -c 'pg_dump -U "$POSTGRES_USER" -d "$POSTGRES_DB" --format=custom --no-owner --no-acl' > "$DEST/postgres-staging.dump" 2>/dev/null; then
    : # ok
  else
    log "staging indisponível, continuando"
    rm -f "$DEST/postgres-staging.dump"
  fi

  log "mídia produção ($MEDIA_VOLUME)"
  MEDIA_PATH="$(vol_path "$MEDIA_VOLUME")"
  if [ -n "$MEDIA_PATH" ] && [ -d "$MEDIA_PATH" ]; then
    tar -czf "$DEST/media.tar.gz" -C "$MEDIA_PATH" .
  else
    log "mídia indisponível, continuando"
  fi

  log "n8n (SQLite, $N8N_VOLUME)"
  N8N_PATH="$(vol_path "$N8N_VOLUME")"
  if [ -n "$N8N_PATH" ] && [ -f "$N8N_PATH/database.sqlite" ]; then
    python3 "$REPO_DIR/scripts/phase11-backup-sqlite.py" "$N8N_PATH/database.sqlite" "$DEST/n8n.sqlite" || log "n8n backup falhou, continuando"
  else
    log "n8n indisponível, continuando"
  fi

  log "runner-state (SQLite, $RUNNER_VOLUME)"
  RUNNER_PATH="$(vol_path "$RUNNER_VOLUME")"
  if [ -n "$RUNNER_PATH" ] && [ -f "$RUNNER_PATH/jobs.sqlite3" ]; then
    python3 "$REPO_DIR/scripts/phase11-backup-sqlite.py" "$RUNNER_PATH/jobs.sqlite3" "$DEST/runner-state.sqlite3" || log "runner-state backup falhou, continuando"
  else
    log "runner-state indisponível, continuando"
  fi

  log "bundle Git ($REPO_DIR)"
  git -C "$REPO_DIR" bundle create "$DEST/repo.bundle" --all

  log "configuração (compose, sem .env/secrets)"
  tar -czf "$DEST/config.tar.gz" -C "$REPO_DIR" docker-compose.hermes-editorial.yml docker-compose.phase2.yml docker-compose.production.yml payload.config.ts 2>/dev/null || log "config indisponível, continuando"
fi

log "SHA256SUMS"
(cd "$DEST" && sha256sum -- * > SHA256SUMS)

chmod 600 "$DEST"/*

log "ok: $DEST"
echo "$DEST"
