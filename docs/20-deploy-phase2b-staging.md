# Deploy do portal editorial público no staging (Fase 2B)

Este documento registra o deploy isolado e a validação da Fase 2B no candidato
de staging (`cv-phase2-staging-app`), preservando produção, staging antigo e
PostgreSQL.

## Estado implantado

- Branch: `feat/portal-phase-2b-public-editorial`.
- HEAD implantado: `bdb129f6eb0b7f6d1f4a779ab2005023b515e3d2`.
- Imagem validada: `crescimento-vertical:phase2b-staging-bdb129f`.
- Migração aplicada: `20260825_013756_add_article_featured` (Fase 2B), além da
  `20260824_191516_initial_foundation` (Fase 2A). Nenhuma pendente.

## Preflight

- Branch/HEAD confirmados; working tree limpa; `HEAD` local igual ao remoto;
  `main` = `11fe4be4282bb9afa42bc253feefa770ab4609a3`.
- Quatro containers running/healthy.
- Banco antes do deploy: `users=1`, admin ativo `=1`, demais coleções `=0`.

## Correção documental

O primeiro administrador **não** está pendente: já existe no staging (criado na
validação da Fase 2A). Documentos que listavam "primeiro usuário administrador"
como pendente foram corrigidos (docs/17, docs/19, docs/15 e ROTEIRO-MESTRE),
sem registrar nome ou e-mail.

## Backup pré-deploy

Caminho: `/opt/backups/crescimento-vertical/phase2b-predeploy-bdb129f-20260825-025211`.

- Permissões: diretório 700, arquivos 600.
- Conteúdo: `repository.bundle` (main + branch Fase 2B), dump PostgreSQL custom,
  `media.tar.gz`, imagem `cv-phase2-staging-app` (`cv-phase2-staging-app-image.tar`),
  `Dockerfile`, `docker-compose.phase2.yml`, `.env.phase2.staging` e `.env.staging`
  (600), `inspect-*.json` dos quatro containers, `migrations/` e `SHA256SUMS`.
- Validações executadas: `sha256sum -c` (OK), `git bundle verify` (2 refs,
  histórico completo), `pg_restore --list` (286 entradas), integridade do tar de
  mídia e `docker load` da imagem sem iniciar container.

## Deploy

1. Compose validado (`docker compose config --quiet`).
2. Imagem `app` e alvo `migrate` construídos a partir do HEAD `bdb129f`.
3. Serviço `migrate` executado one-shot (aplicou a migration da Fase 2B).
4. `migrate:status`: Fase 2A e Fase 2B aplicadas; nenhuma pendente.
5. Recreado somente `cv-phase2-staging-app`; PostgreSQL preservado.
6. Container `cv-phase2-staging-app` ficou `healthy`.
7. Imagem marcada como `crescimento-vertical:phase2b-staging-bdb129f`.

### Correção durante o deploy

`SITE_NOINDEX` estava presente em `.env.phase2.staging`, mas não era repassado ao
`environment:` do serviço `app`. Rotas dinâmicas (`sitemap.xml` e metadados das
páginas `force-dynamic`) liam a variável como indefinida e geravam sitemap
não vazio / meta `index,follow`. Correção: `SITE_NOINDEX: ${SITE_NOINDEX}` no
`environment:` do serviço `app` de `docker-compose.phase2.yml`; após revalidar,
o sitemap passou a retornar vazio e os metadados a `noindex`.

## Validação interna (dentro do candidato)

| Rota | Resultado |
| --- | --- |
| `/` | 200; sem cards editoriais vazios; meta noindex |
| `/conteudos` | 200; estado vazio honesto |
| `/api/health/live` | 200 |
| `/api/health/ready` | 200 |
| `/admin` | 200 |
| `/feed.xml` | 200; XML válido; 0 itens |
| `/sitemap.xml` | 200; XML válido; 0 URLs |
| `/robots.txt` | 200; `Disallow: /` |
| `/conteudos/<slug-inexistente>` | 404 |
| `/categorias/<inexistente>` | 404 |
| `/autores/<inexistente>` | 404 |

Nenhuma rota retornou 500. Com o banco vazio, o feed e o sitemap não contêm
artigos e a home não renderiza cards editoriais.

## Validação externa (https://staging.crescimentovertical.com)

- Sem BasicAuth: 401.
- TLS válido (certificado Let's Encrypt para `staging.crescimentovertical.com`).
- `X-Robots-Tag: noindex, nofollow, noarchive`.
- Nenhuma nova porta publicada (`app` 3000/tcp e `postgres` 5432/tcp internos).
- Traefik direciona o staging ao candidato Fase 2B (`PHASE2_TRAEFIK_ENABLE=true`,
  router `Host(staging.crescimentovertical.com)` com prioridade 200).

## Preservação dos dados

Agregados após migration e deploy (sem criar registros):

- `users=1`, admin ativo `=1`;
- `articles=0`, `authors=0`, `categories=0`, `media=0`, `sources=0`,
  `research_dossiers=0`.

IDs dos containers antes/depois:

| Container | Antes | Depois | Observação |
| --- | --- | --- | --- |
| `crescimento-vertical` (produção) | `1af439f02200` | `1af439f02200` | igual |
| `crescimento-vertical-staging` (antigo) | `58f2c01c2220` | `58f2c01c2220` | igual |
| `cv-phase2-staging-postgres` | `886c99b1b922` | `886c99b1b922` | igual |
| `cv-phase2-staging-app` (candidato) | `b495fbc09ee7` | `8ba86f676f44` | único alterado |

Todos permanecem running/healthy.

## Rollback

Reverter o candidato: restaurar a imagem `cv-phase2-staging-app` do backup ou
reapontar `PHASE2_TRAEFIK_ENABLE=false` (docs/12 e docs/18). O banco e os volumes
do candidate estão preservados; a migration da Fase 2B é reversível (`down`).

## Homologação visual

Aprovada pelo operador em 25 de agosto de 2026:

- home homologada visualmente;
- `/conteudos` homologado no estado vazio;
- responsividade aprovada (360, 390, 768, 1024 e 1440 px);
- ausência de conteúdo fictício.

As páginas populadas serão novamente verificadas com o primeiro conteúdo real.

## Pendências

- Conteúdo editorial real ainda pendente.
- Produção e DNS (@ e www) ainda não migrados.
- Integração Hermes/n8n não iniciada.
