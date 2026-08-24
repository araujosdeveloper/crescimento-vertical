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
