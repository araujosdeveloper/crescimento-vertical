#!/usr/bin/env bash
# =============================================================================
# Fase 11 — Backup (PostgreSQL + mídia + configuração + Git).
#
# Uso:  phase11-backup.sh <BACKUP_ROOT> <daily|hourly>
#   daily  : dump completo (banco + mídia + config + bundle Git)
#   hourly : dump lógico do banco (pg_dump custom) + SHA256SUMS
#
# Destino: BACKUP_ROOT/phase11-<mode>-<UTC timestamp>/
# Retenção: 30 dias (diário) + 12 meses (mensal) — ver docs/43.
# Segredos não são copiados para o repositório; os arquivos ficam com 0600.
# =============================================================================
set -euo pipefail

BACKUP_ROOT="${1:?backup root required}"
MODE="${2:-daily}"
POSTGRES_CONTAINER="${POSTGRES_CONTAINER:-cv-phase2-staging-postgres}"
MEDIA_VOLUME="${MEDIA_VOLUME:-crescimento-vertical-phase2-staging_media}"
REPO_DIR="${REPO_DIR:-/opt/crescimento-vertical}"

TIMESTAMP="$(date -u +%Y%m%dT%H%M%SZ)"
DEST="$BACKUP_ROOT/phase11-$MODE-$TIMESTAMP"
umask 077
mkdir -p "$DEST"
chmod 700 "$DEST"

log() { echo "[phase11-backup] $*"; }

log "dump PostgreSQL ($POSTGRES_CONTAINER)"
docker exec "$POSTGRES_CONTAINER" sh -c 'pg_dump -U "$POSTGRES_USER" -d "$POSTGRES_DB" --format=custom' > "$DEST/postgres.dump"

if [ "$MODE" = "daily" ]; then
  log "mídia ($MEDIA_VOLUME)"
  docker run --rm -v "$MEDIA_VOLUME":/media -v "$DEST":/backup alpine tar -czf /backup/media.tar.gz -C /media . 2>/dev/null || log "mídia indisponível, continuando"

  log "bundle Git ($REPO_DIR)"
  git -C "$REPO_DIR" bundle create "$DEST/repo.bundle" --all

  log "configuração (compose, sem .env/secrets)"
  tar -czf "$DEST/config.tar.gz" -C "$REPO_DIR" docker-compose.hermes-editorial.yml docker-compose.phase2.yml payload.config.ts 2>/dev/null || log "config indisponível, continuando"
fi

log "SHA256SUMS"
(cd "$DEST" && sha256sum -- * > SHA256SUMS)

chmod 600 "$DEST"/*

log "ok: $DEST"
echo "$DEST"
