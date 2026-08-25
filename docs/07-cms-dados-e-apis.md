# CMS, dados e APIs

## Escolha

Payload CMS integrado ao Next.js com adaptador PostgreSQL. O CMS fornece painel,
controle de acesso, drafts, versões, preview e API sem criar um segundo frontend.

## Estado implementado (Fase 2A)

A fundação em código está em docs/17-fundacao-editorial-payload.md. As coleções
implementadas são: `users`, `authors`, `categories`, `media`, `sources`,
`research-dossiers` e `articles` (equivalente ao “posts” descrito abaixo). Os
papéis implementados são `admin`, `editor`, `reviewer`, `researcher` e
`automation` (substituindo os nomes provisórios `commercial`/`hermes-service`).
As demais coleções (services, cases, ctas, leads, newsletter, editorialRuns,
redirects, pages) permanecem previstas para as fases seguintes.

## Estado implementado (Fase 2B)

A Fase 2B adicionou a camada pública de leitura (docs/19):

- `src/lib/editorial/` (server-only): Payload Local API com `overrideAccess:false`,
  `draft:false`, filtro defensivo de publicados e DTOs públicos estritos.
- Campo `featured` em `articles` (migration `20260825_013756_add_article_featured`).
- Publicação passou a exigir `heroImage` e tetos de SEO (60/160 caracteres).
- Cache com revalidação sob demanda via `unstable_cache` + `revalidateTag`
  (tags `editorial-articles/authors/categories`).
- GraphQL continua desativado; nenhum `overrideAccess:true` em consulta pública.

## Coleções

### users

- name
- email
- password
- roles: admin, editor, reviewer, commercial, hermes-service
- active
- lastLoginAt
- mfaStatus quando suportado pela solução escolhida

### posts

- title
- slug
- dek
- contentType
- primaryPillar
- category
- tags
- authors
- reviewer
- heroMedia
- excerpt
- content
- businessImpact
- sources
- claims
- relatedServices
- contextualCTA
- factCheckStatus
- riskLevel
- publishedAt
- updatedAt
- reviewedAt
- correctionNote
- readingTime
- seo
- editorialRun
- _status do Payload

Drafts, autosave e versões ficam habilitados. Conteúdo público exige status
published e publishedAt válido.

### categories

- name
- slug
- description
- seo
- active
- order

### tags

- name
- slug
- description
- indexable

Tags nascem como noindex e só se tornam indexáveis quando houver volume,
diferenciação e conteúdo introdutório.

### authors

- name
- slug
- role
- biography
- photo
- expertise
- socialLinks
- active

### sources

- publisher
- domain
- sourceLevel
- allowed
- notes
- lastReviewedAt

### media

- file
- alt
- caption
- credit
- license
- sourceUrl
- focalPoint
- usageRestrictions

### services

- title
- slug
- promise
- targetAudience
- problems
- deliverables
- process
- faq
- primaryCTA
- seo
- active

### cases

- title
- slug
- clientDisplayName
- authorizationStatus
- challenge
- solution
- results
- metrics
- period
- relatedServices
- testimonial
- media
- seo
- _status

### ctas

- name
- type
- label
- destination
- service
- trackingKey
- active

### leads

- name
- email
- phone
- company
- role
- companySize
- challenge
- serviceInterest
- sourceUrl
- referrer
- utm
- consentAt
- consentTextVersion
- status
- owner
- createdAt
- retentionUntil

Leads nunca são retornados em API pública.

### newsletterSubscribers

- email
- name
- status
- consentAt
- source
- verificationAt
- unsubscribedAt

### editorialRuns

- runId
- idempotencyKey
- schemaVersion
- hermesRunId
- status
- payload
- normalizedSources
- validationErrors
- post
- reviewer
- decision
- decisionAt
- executionHistory
- createdAt

### redirects

- from
- to
- type: 301 ou 302
- active
- reason
- createdAt

### pages

- title
- slug
- pageType
- blocks
- seo
- _status

## Globals

- siteSettings
- navigation
- footer
- editorialPolicy
- contactSettings
- analyticsSettings sem segredos
- defaultSEO

## Modelo SEO

- metaTitle
- metaDescription
- canonicalUrl opcional
- noIndex
- noFollow
- openGraphMedia
- schemaType
- focusKeyword interno

## Controle de acesso

Papéis implementados na Fase 2A (ver docs/17 para a matriz completa):

| Papel | Conteúdo | Publicar | Usuários | Leads | Configuração |
| --- | --- | --- | --- | --- | --- |
| admin | Total | Sim | Sim | Sim (futuro) | Sim |
| editor | Criar/editar artigos | Não | Não | Não | Não |
| reviewer | Revisar/decidir | Sim | Não | Não | Não |
| researcher | Dossiês e fontes | Não | Não | Não | Não |
| automation | Dossiês e rascunhos | Não | Não | Não | Não |

Permissões serão implementadas no servidor. Ocultar botão no painel não substitui
controle de acesso.

## Workflows n8n

### CV-01 Hermes Intake

- Recebe dossiê.
- Valida HMAC, timestamp, schema e idempotencyKey.
- Normaliza URLs.
- Consulta duplicação.
- Cria EditorialRun.
- Cria draft.
- Enfileira notificação.

### CV-02 Telegram Approval

- Envia resumo, fontes, risco e link de preview.
- Aceita APROVAR, REJEITAR ou REVISAR.
- Confirma identidade do aprovador.
- Persiste decisão.
- Não publica diretamente.

### CV-03 CMS Publish

- Confirma decisão válida e draft correspondente.
- Executa validações finais.
- Define publishedAt e _status.
- Solicita revalidação de cache.
- Confirma URL pública.
- Registra resultado.

### CV-04 Monitoring and Corrections

- Verifica links, atualizações de fonte e conteúdos envelhecidos.
- Cria tarefa de revisão.
- Nunca altera texto publicado sem nova decisão.

## Segurança de API

- HTTPS.
- HMAC com segredo rotacionável.
- Timestamp com janela curta.
- Idempotency-Key obrigatório.
- Limite de corpo.
- JSON Schema versionado.
- Rate limiting.
- Usuário de serviço exclusivo.
- Logs com correlação, sem segredo.
- Resposta uniforme para não vazar estrutura interna.

## Idempotência

- editorialRuns.idempotencyKey possui índice único.
- Repetição com mesmo corpo retorna o recurso existente.
- Mesmo idempotencyKey com corpo diferente é conflito e gera alerta.
- Retentativa de publicação verifica status atual antes de agir.

## Migrações

- Geradas e versionadas no Git.
- Testadas em banco vazio e cópia sanitizada.
- Backup antes de produção.
- Migração reversível quando possível.
- Alteração destrutiva exige etapa expandir → migrar → contrair.
- Schema push automático não é permitido em produção.

## Retenção

- Versões editoriais: política inicial de 100 por documento, revisável.
- Logs técnicos: 30 dias, salvo incidente.
- EditorialRuns: 24 meses para auditoria.
- Leads: conforme base legal e política aprovada.
- Inscrições canceladas: manter apenas evidência mínima de opt-out.
