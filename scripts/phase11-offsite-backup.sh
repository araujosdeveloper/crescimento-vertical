#!/usr/bin/env bash
# =============================================================================
# Fase 12 — Cópia off-site criptografada de backup (ADR-041).
#
# Criptografa o backup diário mais recente com GPG (AES-256) e envia para um
# storage S3-compatível (AWS S3, Backblaze B2, Cloudflare R2, etc.) via boto3.
#
# Uso:  phase11-offsite-backup.sh <BACKUP_ROOT>
# Env (valores nunca versionados; segredos por arquivo):
#   OFFSITE_ENDPOINT_URL        (ex.: https://s3.us-east-005.backblazeb2.com)
#   OFFSITE_BUCKET
#   OFFSITE_ACCESS_KEY_FILE     (caminho do arquivo com a access key)
#   OFFSITE_SECRET_KEY_FILE     (caminho do arquivo com a secret key)
#   OFFSITE_GPG_PASSPHRASE_FILE (caminho do arquivo com a senha de criptografia)
#   OFFSITE_PREFIX              (padrão: crescimento-vertical)
# =============================================================================
set -euo pipefail

BACKUP_ROOT="${1:?backup root required}"
umask 077

log() { echo "[phase11-offsite] $*"; }

ENDPOINT_URL="${OFFSITE_ENDPOINT_URL:?OFFSITE_ENDPOINT_URL required}"
BUCKET="${OFFSITE_BUCKET:?OFFSITE_BUCKET required}"
ACCESS_KEY_FILE="${OFFSITE_ACCESS_KEY_FILE:?OFFSITE_ACCESS_KEY_FILE required}"
SECRET_KEY_FILE="${OFFSITE_SECRET_KEY_FILE:?OFFSITE_SECRET_KEY_FILE required}"
PASSPHRASE_FILE="${OFFSITE_GPG_PASSPHRASE_FILE:?OFFSITE_GPG_PASSPHRASE_FILE required}"
PREFIX="${OFFSITE_PREFIX:-crescimento-vertical}"

latest_daily="$(find "$BACKUP_ROOT" -maxdepth 1 -type d -name 'phase11-daily-*' -printf '%T@ %p\n' 2>/dev/null | sort -rn | head -1 | cut -d' ' -f2-)"
if [ -z "$latest_daily" ]; then
  log "nenhum backup diário encontrado"
  exit 1
fi
stamp="$(basename "$latest_daily")"
object="$PREFIX/$stamp.tar.gz.gpg"

tmp="$(mktemp -d)"
trap 'rm -rf "$tmp"' EXIT

log "criptografando $stamp (GPG AES-256)"
tar -C "$latest_daily" -czf "$tmp/payload.tar.gz" .
gpg --batch --yes --symmetric --cipher-algo AES256 --passphrase-file "$PASSPHRASE_FILE" \
  -o "$tmp/$stamp.tar.gz.gpg" "$tmp/payload.tar.gz"
rm -f "$tmp/payload.tar.gz"

log "enviando $object para $BUCKET"
AWS_ACCESS_KEY_ID="$(cat "$ACCESS_KEY_FILE")" \
AWS_SECRET_ACCESS_KEY="$(cat "$SECRET_KEY_FILE")" \
python3 - "$tmp/$stamp.tar.gz.gpg" "$BUCKET" "$object" "$ENDPOINT_URL" <<'PY'
import sys
import boto3
from botocore.client import Config

src, bucket, key, endpoint = sys.argv[1], sys.argv[2], sys.argv[3], sys.argv[4]
s3 = boto3.client("s3", endpoint_url=endpoint, config=Config(s3={"addressing_style": "path"}))
s3.upload_file(src, bucket, key)
print("uploaded", key)
PY

log "off-site ok: $object"
