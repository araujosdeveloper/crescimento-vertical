# Runbook de backup e restauração

## Backup

- **Diário (completo):** banco + mídia + configuração + bundle Git.
  `scripts/phase11-backup.sh /opt/backups/crescimento-vertical daily`
- **A cada 6 h (lógico):** dump custom do PostgreSQL.
  `scripts/phase11-backup.sh /opt/backups/crescimento-vertical hourly`

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

- **Envio** (diário, após o backup das 3h):
  `scripts/phase11-offsite-backup.sh /opt/backups/crescimento-vertical`
  usando GPG AES-256 + boto3 para storage S3-compatível. Requer as variáveis
  `OFFSITE_*` (segredos por arquivo em `.secrets/`, nunca versionados).
- **Restauração off-site**: baixar o objeto, `gpg --decrypt --passphrase-file`,
  descompactar e seguir o procedimento de restauração isolada acima.
- Cron sugerido: `0 4 * * * scripts/phase11-offsite-backup.sh ...` (após o
  backup diário), quando as credenciais existirem.
