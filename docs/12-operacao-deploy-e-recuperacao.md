# Operação, deploy e recuperação

## Ambientes

### Local

- Docker Compose próprio.
- Dados sintéticos.
- Sem conexão com Telegram ou CMS de produção.
- E-mails e webhooks capturados por serviços de desenvolvimento.

### Staging

- Subdomínio a definir na Fase 1.
- Autenticação adicional.
- noindex e bloqueio em robots.
- Credenciais exclusivas.
- Banco próprio.
- Cópia sanitizada somente quando necessária e autorizada.

### Produção

- crescimentovertical.com e www redirecionado para a forma canônica.
- TLS.
- Banco privado.
- Backups e monitoramento.
- Sem seed fictício.

## Pipeline de deploy

1. Branch e revisão.
2. CI aprovada.
3. Build imutável identificado pelo commit.
4. Implantação em staging.
5. Testes de aceite.
6. Backup pré-produção.
7. Migração expandir.
8. Deploy.
9. Smoke test.
10. Verificação de métricas e logs.
11. Migração contrair somente em release posterior.

## Healthchecks

### Web

- GET /api/health/live: processo responde.
- GET /api/health/ready: banco e dependências essenciais respondem.

### Banco

- pg_isready.
- Query simples com usuário limitado.

### Editorial

- CMS acessível internamente.
- Último job do Hermes.
- Última execução bem-sucedida dos workflows.
- Fila de falha.

Healthcheck público não revela versão, host, credencial ou detalhes do banco.

## Logs

- JSON estruturado.
- timestamp UTC.
- level.
- service.
- environment.
- release/commit.
- requestId.
- editorialRunId quando aplicável.
- mensagem sanitizada.

Não registrar corpo integral de lead, token, cookie ou prompt com segredo.

## Monitoramento

- Uptime do domínio e healthcheck.
- Taxa de erro HTTP.
- Latência p95.
- uso de CPU, RAM e disco.
- conexões e tamanho do PostgreSQL.
- falhas de workflow.
- falhas e custo do Hermes.
- fila de drafts aguardando revisão.
- formulários iniciados e concluídos.

## Backup

### PostgreSQL

- Backup lógico a cada 6 horas.
- Backup diário completo.
- Retenção diária por 30 dias.
- Retenção mensal por 12 meses.
- Criptografia e cópia fora da VPS.

### Mídia

- Versionamento ou replicação no armazenamento.
- Inventário periódico.
- Backup de metadados e permissões.

### Configuração

- Compose, migrations e documentação no Git.
- Secrets em cofre/arquivo protegido com backup operacional seguro.
- Export controlado de workflows n8n, sem credenciais.
- Skill e schemas do Hermes no Git.

### Backup integral da Fase 2A (staging)

Na validação final da Fase 2A foi criado um backup integral do estado do staging:

- Caminho: `/opt/backups/crescimento-vertical/phase2a-staging-8db0090-20260824-231850`.
- Tamanho aproximado: 196 MB.
- Permissões: diretório 700 e arquivos 600.
- Conteúdo: `.env` do staging/phase2 (sem valores versionados), `Dockerfile`,
  Compose de staging e phase2, dump PostgreSQL (`payload-postgres.dump`),
  `payload-media.tar.gz`, imagem Docker (`images.tar`), bundle Git
  (`repository.bundle`), snapshots de estado dos containers e `SHA256SUMS`.
- Verificações executadas sem restaurar nem extrair: `sha256sum -c`,
  `git bundle verify`, `pg_restore --list` e validação de `payload-media.tar.gz`.
- O backup preserva produção e o staging antigo como referência de rollback.

A rotação do BasicAuth após a exposição do hash anterior foi concluída: o backup
pré-rotação (hash anterior) difere do estado atual, e o novo hash é idêntico em
`.env.staging`, em `.env.phase2.staging` e nos labels BasicAuth dos dois
containers. O staging antigo e o candidate foram recriados exclusivamente para
aplicar o novo hash; produção e PostgreSQL foram preservados. TLS, BasicAuth e
Admin foram validados. O backup anterior à rotação foi preservado.
Nenhum hash, senha ou valor de `.env` é registrado no repositório.

### Backup pré-deploy da Fase 2B (staging)

Na Fase 2B foi criado um backup root-only antes do deploy (docs/20):

- Caminho: `/opt/backups/crescimento-vertical/phase2b-predeploy-bdb129f-20260825-025211`.
- Permissões: diretório 700 e arquivos 600.
- Conteúdo: bundle Git (main + branch Fase 2B), dump PostgreSQL custom, tar do
  volume de mídia, imagem `cv-phase2-staging-app`, `Dockerfile`,
  `docker-compose.phase2.yml`, `.env` (600), `inspect-*.json` e `SHA256SUMS`.
- Verificações executadas: `sha256sum -c`, `git bundle verify`,
  `pg_restore --list`, integridade do tar de mídia e `docker load` da imagem sem
  iniciar container.

## Recuperação

- RPO: até 6 horas.
- RTO: até 4 horas.
- Teste de restauração mensal em ambiente isolado.
- Registrar duração, falhas e hash do backup.
- Backup não testado não é considerado proteção.

## Rollback

### Aplicação

- Manter imagem anterior.
- Reapontar Traefik ou serviço para release anterior.
- Verificar compatibilidade do schema.

### Banco

- Preferir migrações compatíveis e rollback de aplicação.
- Restaurar banco somente quando impacto for conhecido e autorizado.
- Nunca executar down migration destrutiva automaticamente.

### Conteúdo

- Usar versões do Payload para reverter documento.
- Preservar nota de correção quando conteúdo já foi público.

### Staging blue-green (Fase 2A)

O staging da Fase 2A usa roteamento controlado por `PHASE2_TRAEFIK_ENABLE`.
Reverter para o staging antigo sem apagar dados: definir
`PHASE2_TRAEFIK_ENABLE=false` e recriar somente o container `cv-phase2-staging-app`.
Banco e volumes do candidate permanecem preservados. Detalhes em
docs/18-deploy-phase2-staging.md.

### Runner editorial (Fase 3B)

Reverter o runner sem afetar o Hermes ou o n8n (docs/25): parar/remover apenas
`cv-hermes-editorial-runner`; preservar o volume `runner-state` para análise;
remover o perfil `crescimento-vertical-editorial` somente por comando explícito
futuro; confirmar `default` e o gateway (PID 153) intactos.

### Conector n8n (Fase 3C)

Reverter o n8n (docs/27): restaurar `image: docker.n8n.io/n8nio/n8n` no
Compose persistente e recriar apenas `n8n`; restaurar o volume `n8n_data` e o
SQLite a partir do backup pré-recreate (`/opt/backups/crescimento-vertical/
phase3c-pre-n8n-*`). Traefik, runner, Hermes, Payload, PostgreSQL, produção e
staging permanecem intactos.

## Rotina operacional

### Diária

- Uptime, erros, disco e backups.
- Fila editorial e falhas.
- Leads não processados.

### Semanal

- Conteúdo envelhecido.
- links quebrados.
- métricas de aquisição e conversão.
- dependências com alerta crítico.

### Mensal

- restauração;
- permissões;
- custos;
- fontes editoriais;
- retenção de dados;
- desempenho de clusters e serviços.
