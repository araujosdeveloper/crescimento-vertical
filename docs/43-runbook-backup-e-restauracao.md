# Runbook de backup e restauração

## Backup

- **Diário (completo):** PostgreSQL **produção** + PostgreSQL staging + mídia
  produção + **n8n (SQLite)** + **runner-state (SQLite)** + configuração +
  bundle Git.
  `scripts/phase11-backup.sh /opt/backups/crescimento-vertical daily`
- **A cada 6 h (lógico):** dump custom do PostgreSQL **produção**.
  `scripts/phase11-backup.sh /opt/backups/crescimento-vertical hourly`

> **Correção (7/9/2026):** o backup apontava para o PostgreSQL/mídia de
> **staging**; passou a apontar para **produção** e a incluir n8n e runner.
> Os bancos SQLite (n8n e runner) são copiados de forma consistente via
> `scripts/phase11-backup-sqlite.py` (API `sqlite3.backup`).

Cron sugerido (na VPS):

```
0 */6 * * *  /opt/crescimento-vertical/scripts/phase11-backup.sh /opt/backups/crescimento-vertical hourly >> /var/log/cv-backup.log 2>&1
0 3 * * *    /opt/crescimento-vertical/scripts/phase11-backup.sh /opt/backups/crescimento-vertical daily  >> /var/log/cv-backup.log 2>&1
0 4 * * *    /opt/crescimento-vertical/scripts/phase11-retention.sh /opt/backups/crescimento-vertical >> /var/log/cv-backup.log 2>&1
0 5 1 * *    /opt/crescimento-vertical/scripts/phase11-restore-test.sh /opt/backups/crescimento-vertical >> /var/log/cv-restore.log 2>&1
```

Retenção: 30 dias (diário) e 12 meses (mensal), aplicada por
`scripts/phase11-retention.sh`; dumps horários retidos por 7 dias. O teste de
restauração isolada roda no 1º dia de cada mês via
`scripts/phase11-restore-test.sh`.

### Validação do backup

1. `cd <backup> && sha256sum -c SHA256SUMS`
2. `git bundle verify repo.bundle`
3. `pg_restore --list postgres.dump | head` (catálogo íntegro)
4. `tar -tzf media.tar.gz | head`
5. `python3 -c "import sqlite3; sqlite3.connect('n8n.sqlite').execute('PRAGMA integrity_check')"`
   (e o mesmo para `runner-state.sqlite3`)

## Restauração (isolada)

1. Subir um PostgreSQL 16 descartável (novo container, porta interna).
2. `pg_restore --clean --if-exists -d <db> postgres.dump`
3. `docker run --rm -v <novo-volume-media>:/media -v <backup>:/backup alpine tar -xzf /backup/media.tar.gz -C /media`
4. Subir o app apontando para o novo banco/mídia e verificar `/admin`, `/`, healthchecks.
5. Remover o ambiente descartável.

## RPO / RTO

- **RPO ≤ 6 h** (dump lógico a cada 6 h).
- **RTO ≤ 4 h** (restauração de dump + mídia em PostgreSQL descartável).

## Cópia off-site criptografada (Fase 12 — ADR-041)

### Cloudflare R2 (provedor escolhido)

Configurado e validado em 6/9/2026: envio de teste + round-trip (download →
`gpg --decrypt` → `sha256sum -c`) OK. Cron diário às 3h30 UTC.

1. Criar bucket no R2 e um **R2 API Token** (Access Key ID + Secret Access Key).
2. Endpoint: `https://<account-id>.r2.cloudflarestorage.com` (Account ID no
   dashboard). O script usa boto3 com path-style (padrão do R2).
3. Segredos locais (nunca versionados):
   - `.secrets/offsite-access-key` (Access Key ID)
   - `.secrets/offsite-secret-key` (Secret Access Key)
   - `.secrets/offsite-gpg-passphrase` (senha gerada com `openssl rand -hex 32`)
   - `chmod 600` em todos.
4. Variáveis de ambiente do script (`OFFSITE_*`): endpoint, bucket, caminhos dos
   três arquivos acima e prefixo (padrão `crescimento-vertical`).

### Envio e restauração

- **Envio** (diário, após o backup das 3h):
  `scripts/phase11-offsite-backup.sh /opt/backups/crescimento-vertical`
  usando GPG AES-256 + boto3. Cron sugerido:
  `0 4 * * * ... phase11-offsite-backup.sh ...` (após o backup diário).
- **Restauração off-site**: baixar o objeto, `gpg --decrypt --passphrase-file`,
  descompactar e seguir o procedimento de restauração isolada acima.
