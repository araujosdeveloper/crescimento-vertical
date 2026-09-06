#!/usr/bin/env bash
# =============================================================================
# Fase 11 — Retenção automática de backups.
#
#   hourly  : 7 dias
#   daily   : 30 dias
#   monthly : 12 meses (365 dias)
#
# No 1º dia do mês (UTC), promove o backup diário mais recente para o diretório
# mensal. Rodar depois do backup diário das 3h (ordem: backup → retenção).
#
# Uso:  phase11-retention.sh <BACKUP_ROOT>
# =============================================================================
set -euo pipefail

BACKUP_ROOT="${1:?backup root required}"
umask 077

log() { echo "[phase11-retention] $*"; }

prune_older_than() {
  local pattern="$1" days="$2" label="$3"
  local count=0
  while IFS= read -r -d '' path; do
    log "removendo ${label} antigo: $(basename "$path")"
    rm -rf -- "$path"
    count=$((count + 1))
  done < <(find "$BACKUP_ROOT" -maxdepth 1 -type d -name "$pattern" -mtime +"$days" -print0 2>/dev/null)
  log "${label} removidos: $count"
}

prune_older_than "phase11-hourly-*" 7 "hourly"
prune_older_than "phase11-daily-*" 30 "daily"
prune_older_than "phase11-monthly-*" 365 "monthly"

# Promoção mensal (cópia do diário mais recente).
if [ "$(date -u +%d)" = "01" ]; then
  latest_daily="$(find "$BACKUP_ROOT" -maxdepth 1 -type d -name 'phase11-daily-*' -printf '%T@ %p\n' 2>/dev/null | sort -rn | head -1 | cut -d' ' -f2-)"
  if [ -n "$latest_daily" ]; then
    monthly_name="phase11-monthly-$(date -u +%Y%m)"
    monthly_dest="$BACKUP_ROOT/$monthly_name"
    if [ ! -e "$monthly_dest" ]; then
      cp -a "$latest_daily" "$monthly_dest"
      log "mensal promovido: $monthly_name (de $(basename "$latest_daily"))"
    else
      log "mensal já existe: $monthly_name"
    fi
  fi
fi

log "retenção concluída"
