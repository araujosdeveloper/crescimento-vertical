# Runbook de incidentes e rollback

## Princípios

1. Preservar evidência antes de qualquer limpeza.
2. Não apagar logs, state ou falhas históricas.
3. Rollback é reversão ao último estado bom conhecido, nunca improviso.

## Rollback do app (staging)

1. Identificar a imagem anterior saudável (histórico do Compose/git).
2. Reverter a tag no `docker-compose.phase2.yml` para a imagem anterior.
3. `docker compose --env-file .env.phase2.staging -f docker-compose.phase2.yml up -d app`
4. Verificar `/`, `/admin`, healthchecks e 404.

## Rollback do runner (Hermes)

1. Garantir dupla trava fechada (sem `execution-enable`, `RUNNER_EXECUTION_ENABLED=false`).
2. Reverter a tag no `docker-compose.hermes-editorial.yml`.
3. `docker compose --env-file .env.hermes-editorial -f docker-compose.hermes-editorial.yml up -d --no-deps --no-build --pull never cv-hermes-editorial-runner`
4. Verificar `/health` e `user_version` do SQLite (não descer de versão).

## Rollback de banco (dados)

1. Usar o backup validado mais recente (`docs/43`).
2. Restaurar em PostgreSQL descartável e validar antes de apontar o app.
3. Aplicar migrations idempotentes.

## Classificação de incidente

| Nível | Exemplo | Ação |
| --- | --- | --- |
| Crítico | publicação indevida, perda de dados, segredo exposto | parar, preservar evidência, rollback |
| Alto | 5xx em produção, runner fora do contrato | investigar, rollback se necessário |
| Médio | conteúdo com erro factual, alerta de custo | correção com histórico (correções) |

## Checklist de resposta

- [ ] Registrar horário, sintoma e impacto.
- [ ] Preservar logs/evidência (não apagar).
- [ ] Determinar a versão/imagem boa anterior.
- [ ] Executar rollback documentado.
- [ ] Validar a recuperação.
- [ ] Registrar em docs/10 e, se aplicável, ADR.
