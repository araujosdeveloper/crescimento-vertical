# Fundação editorial — Payload + PostgreSQL (Fase 2A)

Este documento descreve a fundação editorial implementada em código na Fase 2A:
Payload CMS integrado ao Next.js existente, banco PostgreSQL dedicado, modelos
editoriais, permissões, migrações, testes e CI.

A Fase 2A entrega apenas o que é **implementado em código**. Não estão
concluídos: deploy, credenciais reais nem integração Hermes/n8n. Esses itens
permanecem pendentes até as fases seguintes. O primeiro usuário administrador
foi criado no staging durante a validação da Fase 2A.

## Escopo da Fase 2A

Incluído:

- Integração do Payload 3 ao Next.js 16.3.0 (rotas `/admin` e `/api`).
- PostgreSQL 16 dedicado com migrações versionadas (sem `push` automático).
- Coleções: users, authors, categories, media, sources, research-dossiers e
  articles.
- Roles, controle de acesso e hooks de workflow no servidor.
- Tipos gerados (`payload-types.ts`) e migration inicial versionada.
- Dockerfile adaptado (sharp no Alpine, mídia persistente, non-root).
- Compose de validação com banco dedicado e rede interna exclusiva.
- Testes (Vitest) e workflow de CI (GitHub Actions com PostgreSQL efêmero).

Fora do escopo desta fase:

- Páginas públicas do blog e experiência de leitura (Fases 4 e 5).
- Integração Hermes e n8n (Fases 8 e 9).
- Seed de conteúdo.
- Deploy/ativação em staging ou produção.
- Backup automatizado, observabilidade e hardening de rede (Fase 11).

## Arquitetura

~~~text
Next.js + Payload CMS (single app)
  |  Rotas públicas: /, /api/health/*
  |  Admin: /admin   REST: /api
  |
PostgreSQL 16 (rede interna exclusiva, sem porta publicada)
  |
  mídia persistente (volume nomeado)
~~~

- O Payload roda dentro do mesmo processo Next.js (App Router), sem segundo
  frontend.
- O banco usa a rede interna exclusiva e nunca é exposto publicamente.
- A aplicação também participa da rede externa `n8n_default` somente para o
  Traefik alcançá-la.

## Versões instaladas (exatas)

| Pacote | Versão |
| --- | --- |
| next | 16.3.0 |
| react / react-dom | 19.2.7 |
| payload | 3.88.0 |
| @payloadcms/next | 3.88.0 |
| @payloadcms/db-postgres | 3.88.0 |
| @payloadcms/richtext-lexical | 3.88.0 |
| sharp | 0.35.3 |
| sharp no standalone | 0.35.3 |
| vitest | 4.1.0 |
| vite | 7.3.6 |

GraphQL não foi instalado nem habilitado: não existem rotas GraphQL e o endpoint
não é criado. O pacote `graphql` eventualmente presente em `node_modules` é
dependência transitiva do próprio Payload e não é usado pela aplicação.

## Coleções

### users

Autenticação habilitada (`auth`), com `roles` (`admin`, `editor`, `reviewer`,
`researcher`, `automation`), `name`, `active` e `lastLoginAt`. Rate limit de
login (`maxLoginAttempts: 5`, `lockTime: 5 min`). O primeiro usuário
administrador foi criado manualmente no staging (validação da Fase 2A).

### authors

`name` (obrigatório), `slug` (único), `biography`, `photo` (upload → media) e
`active`. Leitura pública.

### categories

`name` (obrigatório), `slug` (único), `description` e `active`. Leitura pública.

### media

Upload habilitado com `alt` obrigatório, `caption` e `credit`. Mime types
restritos a imagens seguras (`jpeg`, `png`, `webp`, `gif`, `avif`, `svg`),
tamanhos derivados (`thumbnail`, `card`, `feature`) e `focalPoint`. O
`staticDir` aponta para um diretório montado como volume persistente
(`PAYLOAD_MEDIA_DIR`, padrão `./media`).

### sources

`title`, `publisher`, `url` (único), `sourceType`, `sourceLevel` (A/B/C),
`author`, `publishedAt`, `collectedAt`, `editorialNotes` e `reliability`
(`unverified` | `verified` | `rejected`). **Não é exposta integralmente pela API
pública**: a leitura exige usuário editorial autenticado.

### research-dossiers

`topic`, `summary`, `keyFindings` (array), `sources`, `risksAndDivergences`,
`status` (`research` | `validated` | `rejected`), `provenance` (grupo com
`origin`, `runId`, `collectedAt`, `notes`) e `assignee` (→ users). Não é pública.

### articles

`title` (obrigatório), `slug` (único, gerado do título), `excerpt`, `content`
(rich text/Lexical), `heroImage`, `author`, `category`, `tags` (array), `sources`,
`dossier`, `publishedAt`, `workflowStatus`, grupo `seo` (`seoTitle`,
`seoDescription`, `canonicalUrl`, `noindex`). Versões e drafts habilitados
(`versions: { drafts: true }`).

## Papéis e permissões

| Ação | admin | editor | reviewer | researcher | automation |
| --- | --- | --- | --- | --- | --- |
| Gerir usuários | Sim | Não | Não | Não | Não |
| Criar/editar artigos | Sim | Sim | Editar | Não | Rascunho |
| Aprovar/publicar | Sim | Não | Sim | Não | Não |
| Criar/editar dossiês | Sim | Não | Não | Sim | Sim |
| Criar/editar fontes | Sim | Não | Não | Sim | Sim |
| Gerir taxonomia (autores/categorias) | Sim | Sim | Não | Não | Não |
| Upload de mídia | Sim | Sim | Sim | Não | Não |
| Excluir qualquer documento | Sim | Não | Não | Não | Não |

Regras implementadas no servidor:

- Público lê somente artigos publicados, com `publishedAt` válido.
- `sources` e `research-dossiers` nunca são lidos sem autenticação.
- `automation` nunca aprova, publica, exclui usuários nem altera permissões.
- `automation` e `researcher` não alteram `workflowStatus`.
- Transições inválidas são bloqueadas no hook `beforeChange`.

## Workflow editorial

Estados (`workflowStatus`): `draft`, `in_review`, `approved`, `published`,
`archived`.

Transições permitidas (verificadas no servidor em `enforceWorkflowRules`):

~~~text
draft ──> in_review ──> approved ──> published ──> archived
  ^          |              |                          |
  |          └── draft <────┘                          |
  └────────────────────────────────────────────────────┘ (somente admin)
~~~

- `editor`: `draft → in_review` e `in_review → draft`.
- `reviewer`: `in_review → approved`, `approved → published`,
  `in_review → draft`, `approved → draft`, `published → archived`.
- `admin`: todas as transições válidas.
- `automation`: apenas cria/edita em `draft`.

Publicação exige, no servidor, antes de criar a versão publicada:

1. `workflowStatus === "published"` e papel com permissão (admin/reviewer);
2. `title`, `excerpt`, `content`, `author` e `category` preenchidos;
3. ao menos uma fonte com `reliability === "verified"`.

O hook força `_status` de acordo com o workflow, impedindo publicação fora do
fluxo, e preenche `publishedAt` na primeira publicação. Cada transição emite um
registro estruturado de auditoria (`auditWorkflowChange`).

## Migrações

O diretório `migrations/` contém a migração inicial versionada
(`20260824_191516_initial_foundation.ts` + snapshot `.json` + `index.ts`).

`push` está desativado (`push: false` no adapter): o schema só muda por
migração, nunca por `push` automático.

Scripts npm:

| Script | Ação |
| --- | --- |
| `npm run payload` | CLI do Payload |
| `npm run generate:types` | Regenera `src/payload-types.ts` |
| `npm run generate:importmap` | Regenera o import map do admin |
| `npm run migrate:create -- <nome>` | Gera nova migração a partir do schema |
| `npm run migrate` | Aplica migrações pendentes |
| `npm run migrate:status` | Lista o estado das migrações |

Procedimento:

1. Criar: `DATABASE_URL=... PAYLOAD_SECRET=... npm run migrate:create -- nome`.
2. Revisar o arquivo gerado em `migrations/`.
3. Aplicar: `DATABASE_URL=... PAYLOAD_SECRET=... npm run migrate`.
4. Validar: `npm run migrate:status` (coluna `Ran`).
5. Rollback: `npm run payload migrate:down` quando necessário; nunca executar
   `down` destrutivo automaticamente em produção (ver docs/12).

As migrações foram validadas em banco vazio e aplicadas com sucesso nesta fase.

## Docker e armazenamento

- `Dockerfile` multi-stage, non-root (`nextjs:nodejs`), `output: standalone`
  preservado, `sharp` funcional no Alpine (binários musl pré-compilados) e
  diretório `/app/media` criado e atribuído ao usuário da aplicação. Possui um
  alvo `migrate` (non-root) para migrações one-shot.
- `docker-compose.phase2.yml` é o compose blue-green do staging
  (docs/18-deploy-phase2-staging.md): serviço exclusivo de PostgreSQL 16 Alpine,
  volume persistente exclusivo, rede interna exclusiva, sem porta publicada,
  healthcheck, limites de recursos, `cap_drop`, `read_only` (app), `tmpfs` e
  rotação de logs. A aplicação participa da rede externa `n8n_default` somente
  para o Traefik.
- Banco e mídia nunca são expostos diretamente.
- A produção continua sem dependência do novo banco; o staging antigo segue
  ativo como rollback.

## Testes

Vitest (`tests/`):

- `permissions.test.ts` — matriz de permissões por papel.
- `editorial.test.ts` — transições, bloqueio de publicação por automation/editor,
  exigência de fonte validada e acesso público somente a publicados.
- `env.test.ts` — validação das variáveis obrigatórias.
- `preview.test.ts` — preview seguro, mesmo origin, saída e usuário inativo.
- `cms.integration.test.ts` — ciclo editorial e mídia em PostgreSQL descartável.
- `cms-recovery.integration.test.ts` — restore, autenticação, relações e mídia.

Execução: `npm test` (ou `npm run test:watch`).

Na formalização da Fase 3 não houve nova coleção, migration ou dependência.
`services`/`cases`, taxonomia ampliada, captação, `editorialRuns` e
redirects/globals futuros permanecem nas respectivas fases do roteiro.

## CI

`.github/workflows/ci.yml` executa, com PostgreSQL efêmero (`postgres:16-alpine`):

1. `npm ci`
2. `npm run lint`
3. `npm run typecheck`
4. `npm test`
5. `npm run migrate` + `npm run migrate:status`
6. `npm run build`

Nenhum segredo real está no workflow; os valores são descartáveis de CI.

## Variáveis de ambiente

Nomes exigidos (valores reais nunca são versionados):

- `DATABASE_URL`
- `PAYLOAD_SECRET`
- `POSTGRES_DB`
- `POSTGRES_USER`
- `POSTGRES_PASSWORD`
- `PAYLOAD_MEDIA_DIR` (opcional)

A validação está em `src/lib/env.ts` e o `.env.example` documenta apenas nomes e
exemplos inofensivos.

## Validação no staging (Fase 2A)

A fundação editorial foi ativada e validada no staging em blue-green
(docs/18-deploy-phase2-staging.md), sem tocar produção nem o staging antigo:

- Payload Admin acessível; PostgreSQL 16 dedicado saudável.
- Primeiro administrador criado manualmente; um único usuário ativo com role
  `admin`.
- Coleções editoriais vazias (authors, categories, media, sources,
  research_dossiers e articles).
- Migração inicial aplicada (`20260824_191516_initial_foundation`).
- Backup integral criado e verificado (caminho e tamanho em docs/12 e docs/15).
- BasicAuth com rotação concluída (backup pré-rotação com hash anterior difere
  do estado atual; novo hash idêntico em `.env.staging`, `.env.phase2.staging`
  e nos labels BasicAuth dos dois containers).

## Não concluído (deliberadamente)

- Produção editorial (deploy em produção).
- Integração Hermes/n8n.
- Páginas públicas do blog e conteúdo editorial real.
- Migração de DNS (@ e www).
# Atualização Fase 5

O modelo editorial foi estendido sem alterar a fronteira de autenticação:
`contentType`, `tags`, revisor público, citações snapshot, correções, reading
time e relações. A migration `20260828_182146_add_phase5_editorial` é versionada
e foi testada em PostgreSQL vazio.
