#!/usr/bin/env bash
# =============================================================================
# Fase 11 — Teste de restauração isolada (rotina mensal ou manual).
#
# Restaura o backup diário mais recente em um PostgreSQL 16 descartável e
# confere as contagens, sem tocar nos containers de produção/staging.
#
# Uso:  phase11-restore-test.sh <BACKUP_ROOT> [--keep]
#   --keep : mantém o container descartável para inspeção (default remove).
# =============================================================================
set -euo pipefail

BACKUP_ROOT="${1:?backup root required}"
KEEP="${2:-}"
SRC_CONTAINER="${SRC_CONTAINER:-cv-phase2-staging-postgres}"
TMP_NET="cv-restore-test-$(date +%s)"
TMP_CONTAINER="cv-restore-postgres-$(date +%s)"

log() { echo "[phase11-restore-test] $*"; }

cleanup() {
  docker rm -f "$TMP_CONTAINER" >/dev/null 2>&1 || true
  docker network rm "$TMP_NET" >/dev/null 2>&1 || true
}

latest_backup="$(find "$BACKUP_ROOT" -maxdepth 1 -type d -name 'phase11-daily-*' -printf '%T@ %p\n' 2>/dev/null | sort -rn | head -1 | cut -d' ' -f2-)"
if [ -z "$latest_backup" ]; then
  log "nenhum backup diário encontrado"
  exit 1
fi
DUMP="$latest_backup/postgres.dump"
[ -f "$DUMP" ] || { log "dump não encontrado: $DUMP"; exit 1; }

log "validando SHA256SUMS de $(basename "$latest_backup")"
(cd "$latest_backup" && sha256sum -c SHA256SUMS >/dev/null) || { log "checksum falhou"; exit 1; }

log "subindo PostgreSQL 16 descartável"
docker network create "$TMP_NET" >/dev/null
docker run -d --name "$TMP_CONTAINER" --network "$TMP_NET" \
  -e POSTGRES_DB=restore -e POSTGRES_USER=restore -e POSTGRES_PASSWORD=restore \
  postgres:16-alpine >/dev/null
trap cleanup EXIT

ready=false
for _ in $(seq 1 30); do
  if docker exec "$TMP_CONTAINER" pg_isready -U restore -d restore >/dev/null 2>&1; then ready=true; break; fi
  sleep 1
done
if [ "$ready" != "true" ]; then
  log "PostgreSQL descartável não ficou pronto"
  exit 1
fi

log "restaurando dump (pg_restore)"
docker exec -i "$TMP_CONTAINER" pg_restore -U restore -d restore --clean --if-exists < "$DUMP" >/dev/null

log "contagens restauradas"
docker exec "$TMP_CONTAINER" psql -U restore -d restore -Atc \
  "SELECT 'articles='||count(*) FROM articles UNION ALL SELECT 'users='||count(*) FROM users UNION ALL SELECT 'services='||count(*) FROM services UNION ALL SELECT 'sources='||count(*) FROM sources UNION ALL SELECT 'media='||count(*) FROM media UNION ALL SELECT 'authors='||count(*) FROM authors UNION ALL SELECT 'categories='||count(*) FROM categories;"

if [ "$KEEP" = "--keep" ]; then
  trap - EXIT
  log "container mantido: $TMP_CONTAINER (rede $TMP_NET)"
else
  cleanup
  trap - EXIT
fi

log "restauração isolada concluída"
