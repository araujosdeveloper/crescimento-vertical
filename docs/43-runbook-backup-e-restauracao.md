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
0 4 1 * *    cp -a <backup-diário-mais-recente> /opt/backups/crescimento-vertical/monthly/phase11-monthly-$(date +%Y%m)  # mensal
```

Retenção: 30 dias (diário) e 12 meses (mensal).

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
