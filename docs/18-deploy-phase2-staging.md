# Deploy blue-green do staging — Fase 2A

Este documento registra a ativação da fundação editorial (Fase 2A) no staging
em arquitetura blue-green, sem alterar produção e mantendo o staging antigo
como rollback.

## Topologia

- Projeto Compose exclusivo: `crescimento-vertical-phase2-staging`.
- Containers: `cv-phase2-staging-app`, `cv-phase2-staging-postgres` e
  `cv-phase2-staging-migrate` (one-shot).
- Volumes exclusivos: `crescimento-vertical-phase2-staging_media` e
  `crescimento-vertical-phase2-staging_postgres-data`.
- Rede interna exclusiva: `crescimento-vertical-phase2-staging_internal`
  (app + postgres). A aplicação também participa de `n8n_default` somente para
  o Traefik. O PostgreSQL não entra em `n8n_default` e não publica portas.

## Roteamento controlado

- O candidate usa `Host(staging.crescimentovertical.com)`, `websecure`,
  `mytlschallenge`, BasicAuth (reutiliza `STAGING_BASIC_AUTH_USERS`) e
  `X-Robots-Tag: noindex, nofollow, noarchive`.
- O router do candidate tem `priority=200`; o staging antigo mantém a
  prioridade padrão (0). Quando habilitado, o candidate vence o roteamento.
- O controle é feito por `PHASE2_TRAEFIK_ENABLE` (`traefik.enable`):
  - `false` (padrão): o candidate não recebe tráfego; o staging antigo atende.
  - `true`: o candidate assume o host, ficando o staging antigo como fallback.

## Segredos

`.env.phase2.staging` (permissão 600, ignorado pelo Git) contém:

- `STAGING_HOST`, configurações públicas e `STAGING_BASIC_AUTH_USERS` reutilizados
  de `.env.staging`;
- `PAYLOAD_SECRET` (gerado com `openssl rand -hex 64`);
- `POSTGRES_PASSWORD` (gerado com `openssl rand -hex 32`);
- `POSTGRES_DB`, `POSTGRES_USER`, `DATABASE_URL` (hostname interno `postgres`),
  `SITE_NOINDEX=true` e `PHASE2_TRAEFIK_ENABLE`.

Nenhum valor é versionado nem exibido em logs.

## Ativação (resumo)

~~~bash
# Build
docker compose --env-file .env.phase2.staging -f docker-compose.phase2.yml build app migrate

# Banco
docker compose --env-file .env.phase2.staging -f docker-compose.phase2.yml up -d postgres

# Migrações
docker compose --env-file .env.phase2.staging -f docker-compose.phase2.yml --profile migrate run --rm migrate

# Candidate interno (Traefik desabilitado)
docker compose --env-file .env.phase2.staging -f docker-compose.phase2.yml up -d app

# Habilitar roteamento (altera .env.phase2.staging para true) e recriar SÓ o app
docker compose --env-file .env.phase2.staging -f docker-compose.phase2.yml up -d app
~~~

O PostgreSQL não é recriado ao habilitar o roteamento; somente o `app`.

## Migrações

O serviço `migrate` (perfil `migrate`) roda o alvo `migrate` do `Dockerfile`
(non-root), com o payload CLI, `payload.config.ts` e `migrations/`. Comandos:

~~~bash
# Aplicar
docker compose --env-file .env.phase2.staging -f docker-compose.phase2.yml --profile migrate run --rm migrate

# Status
docker compose --env-file .env.phase2.staging -f docker-compose.phase2.yml --profile migrate run --rm --no-deps migrate \
  node node_modules/payload/bin.js migrate:status
~~~

## Rollback (procedimento — não executado nesta fase)

Reverter o roteamento para o staging antigo sem apagar nada:

1. `PHASE2_TRAEFIK_ENABLE=false` em `.env.phase2.staging`.
2. Recriar somente o app do candidate:
   `docker compose --env-file .env.phase2.staging -f docker-compose.phase2.yml up -d app`.
3. O router do candidate deixa de existir em Traefik; o staging antigo volta a
   atender automaticamente.
4. Banco e volumes do candidate (`postgres-data`, `media`) permanecem intactos.
   Nunca remover volumes.

## Validação executada

- Interna (dentro do container/rede): `/` 200, `/api/health/live` 200,
  `/api/health/ready` 200, `/admin` 200, `/api/users` 403, `/api/sources` 403,
  `/api/research-dossiers` 403, `/api/articles` 200 vazio.
- Nenhum usuário, autor, categoria, mídia, fonte, dossiê ou artigo criado.
- Pública sem autenticação: HTTPS válido, HTTP 401, `www-authenticate: Basic`,
  `X-Robots-Tag: noindex, nofollow, noarchive`.
- Produção e staging antigo permaneceram running/healthy sem recriação.

## Primeiro usuário administrador (manual, pelo operador)

O teste autenticado e a criação do primeiro administrador são manuais:

1. Acessar `https://staging.crescimentovertical.com/admin` com o BasicAuth.
2. Usar o formulário de "create first user" do Payload (o banco está vazio).
3. Atribuir a role `admin` ao primeiro usuário.

## Restrições

- Não alterar produção, `docker-compose.yml`, `.env.staging` ou o Traefik global.
- Não executar `docker compose` do projeto de produção.
- Não recriar `crescimento-vertical` nem `crescimento-vertical-staging`.

## Validação final (executada)

Validação documental (somente leitura) que registra o estado final da Fase 2A:

- Git: working tree limpa e branch sincronizada com origin em
  `8db009006701a7ab51d6e8ee623cfa90e4906cf1`.
- Candidate (`cv-phase2-staging-app`) e PostgreSQL (`cv-phase2-staging-postgres`)
  running/healthy; produção e staging antigo preservados e saudáveis.
- Payload Admin acessível (`/admin` 200); healthchecks live/ready 200.
- Primeiro administrador criado manualmente: um único usuário ativo com role
  `admin`.
- Demais coleções vazias: authors=0, categories=0, media=0, sources=0,
  research_dossiers=0 e articles=0.
- Migração aplicada: `20260824_191516_initial_foundation`.
- Backup integral em
  `/opt/backups/crescimento-vertical/phase2a-staging-8db0090-20260824-231850`
  (aproximadamente 196 MB, permissões 700/600), verificado com `sha256sum -c`,
  `git bundle verify`, `pg_restore --list` e validação de `payload-media.tar.gz`
  sem restaurar nem extrair.
- BasicAuth: rotação após exposição do hash anterior verificada como pendente
  (backup pré-rotação idêntico ao estado atual).
- Rollback disponível conforme o procedimento acima (não executado).

Continuam pendentes: páginas públicas do blog, conteúdo editorial real,
integração Hermes/n8n, produção editorial e migração de @ e www.
