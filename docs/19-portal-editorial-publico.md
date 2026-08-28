# Portal editorial público (Fase 2B)

Este documento descreve o portal editorial público implementado em código na
Fase 2B: camada pública de dados server-only, rotas de conteúdo, SEO técnico,
cache/revalidação e testes — tudo sobre a fundação Payload + PostgreSQL da Fase
2A, sem integrar Hermes ou n8n.

## Escopo

Incluído:

- Camada pública de dados server-only em `src/lib/editorial/` (Payload Local
  API + DTOs públicos).
- Rotas públicas: `/conteudos`, `/conteudos/[slug]`, `/categorias/[slug]`,
  `/autores/[slug]`, `/feed.xml`, `sitemap.xml` e not-found editorial.
- Seção "Conteúdos para crescer" na home, antes do CTA final.
- SEO técnico: `generateMetadata`, canonical, Open Graph, Twitter cards,
  JSON-LD (Article e BreadcrumbList), sitemap dinâmico e RSS.
- Cache e revalidação sob demanda.
- Campo `featured` (destaque) em Articles + migration versionada.
- Publicação passa a exigir imagem destacada e limites de meta title/description.

Fora do escopo (permanece pendente):

- Integração Hermes e n8n (Fases 8 e 9).
- Conteúdo editorial real.
- Deploy/ativação em produção e homologação visual.
- Migração de DNS (@ e www).

Staging implantado e validado em docs/20-deploy-phase2b-staging.md.

## Arquitetura implementada

~~~text
Next.js (App Router, server components)
  ├─ src/lib/editorial/          ← camada pública server-only
  │    ├─ constants.ts            (TTL, tags, limites de SEO)
  │    ├─ types.ts                (DTOs públicos)
  │    ├─ mappers.ts              (Payload → DTO, whitelist de campos)
  │    ├─ query.ts                (filtro defensivo de artigos publicados)
  │    ├─ data.ts                 (Payload Local API + cache)
  │    ├─ seo.ts                  (metadata, canonical, JSON-LD)
  │    ├─ feed.ts                 (RSS 2.0)
  │    ├─ links.ts                (segurança de links externos)
  │    ├─ pagination.ts           (paginação)
  │    ├─ format.ts               (datas pt-BR)
  │    └─ revalidate.ts           (revalidação sob demanda)
  ├─ src/components/editorial/    ← componentes públicos (cards, prosa, CTA)
  ├─ src/app/conteudos/           ← hub paginado + artigo + not-found
  ├─ src/app/categorias/          ← categoria + not-found
  ├─ src/app/autores/             ← autor + not-found
  ├─ src/app/feed.xml/            ← RSS
  └─ src/app/sitemap.ts           ← sitemap dinâmico

Payload CMS (mesmo processo)
PostgreSQL 16 (rede interna exclusiva)
~~~

## Rotas públicas

| Rota | Finalidade |
| --- | --- |
| `/conteudos` | Hub editorial paginado (12 por página) |
| `/conteudos/[slug]` | Artigo completo (imagem, autor, categoria, data, conteúdo, CTA) |
| `/categorias/[slug]` | Conteúdos publicados da categoria |
| `/autores/[slug]` | Perfil público seguro e artigos do autor |
| `/feed.xml` | RSS somente com artigos publicados |
| `/sitemap.xml` | Sitemap dinâmico somente com URLs publicáveis |
| not-found | 404 estilizado (raiz + editorial) |

## Modelo editorial público

### Articles

Reutiliza os campos da Fase 2A e adiciona somente `featured` (destaque,
checkbox, default `false`). O grupo SEO usa os campos existentes `seoTitle`,
`seoDescription` e `canonicalUrl` (mapeados para `metaTitle`, `metaDescription` e
`canonicalUrl` nos DTOs públicos).

Regras adicionadas na publicação (server-side, em `enforceWorkflow`):

- imagem destacada (`heroImage`) obrigatória;
- `seoTitle` ≤ 60 caracteres e `seoDescription` ≤ 160 (recomendado, aplicado
  como teto na publicação);
- permanecem as regras da Fase 2A (título, resumo, conteúdo, autor, categoria e
  ao menos uma fonte `verified`).

### Authors / Categories

Sem novos campos. O perfil público expõe somente `name`, `slug`, `biography` e
`photo` (sem e-mail ou dados administrativos). Categorias só aparecem no portal
quando possuem pelo menos um artigo publicado.

## Camada pública de dados (server-only)

`src/lib/editorial/data.ts` usa Payload Local API com:

- `overrideAccess: false` (o controle de acesso da Fase 2A continua valendo);
- `draft: false`;
- filtro defensivo `_status = published`, `workflowStatus = published` e
  `publishedAt <= now` (`publicArticlesWhere`);
- filtro adicional `isPubliclyReadable` em profundidade (defesa em
  profundidade);
- `depth` controlado (1 na listagem, 2 no detalhe);
- paginação e `limit` explícitos.

DTOs públicos explícitos (`src/lib/editorial/types.ts` + `mappers.ts`):

- Listagem: `title`, `slug`, `summary`, `publishedAt`, `featuredImage` (segura),
  `author` público, `category` pública.
- Detalhe: os mesmos + `content` (Lexical), `updatedAt` e SEO estritamente
  público.

Nenhum campo de autenticação, auditoria, workflow interno, e-mail ou permissão
é mapeado. Fontes (`sources`) e dossiês não são públicos.

## SEO

- `generateMetadata` por artigo, categoria e autor (title, description,
  canonical, robots, Open Graph, Twitter).
- JSON-LD `Article` e `BreadcrumbList`.
- `sitemap.xml` dinâmico somente com URLs publicáveis (home, hub, artigos,
  categorias e autores com conteúdo publicado).
- `/feed.xml` (RSS 2.0) somente com publicados.
- Datas `publishedAt`/`updatedAt` corretas; `alt` obrigatório nas imagens.

### SITE_NOINDEX

- `SITE_NOINDEX=true` (staging): `noindex/nofollow/noarchive` em metadata,
  `robots.txt` com `Disallow: /` e sitemap vazio.
- Produção só será indexável com `SITE_NOINDEX=false`.
- Drafts e agendados nunca entram no sitemap nem no feed.

## Cache e revalidação

Estratégia explícita:

- Consultas editoriais usam `unstable_cache` com `revalidate` (TTL de 300 s) e
  tags (`editorial-articles`, `editorial-authors`, `editorial-categories`).
- Rotas públicas são `force-dynamic` (dados cacheados, página renderizada sob
  demanda).
- Após publicação, atualização ou retirada de artigo (e mudanças em
  autores/categorias), o hook `revalidateEditorialContent` revalida as tags e os
  caminhos `/`, `/conteudos`, `/conteudos/[slug]`, `/feed.xml` e `/sitemap.xml`.
- A revalidação é melhor esforço (nunca bloqueia a operação editorial).
- Admin (`/admin`) e APIs autenticadas não são cacheados.

## UX e responsividade

Design dark/azul preservado. Validação prevista em 360, 390, 768, 1024 e
1440 px: sem scroll horizontal, cards consistentes, imagens responsivas,
breadcrumbs, foco de teclado visível, links externos seguros e CTA comercial
após a leitura (sem interrompê-la).

## Migration

`migrations/20260825_013756_add_article_featured` adiciona `featured` em
`articles` e `version_featured` em `_articles_v` (versões). Reversível (`down`
remove as colunas).

## Testes

`npm test` cobre (60 testes): DTOs não expõem internos, filtro de publicados
(draft/agendado/publicado), paginação, exigência de imagem/fonte, segurança de
links, metadata/canonical, JSON-LD, feed, estado vazio e regras da Fase 2A.

## Não concluído (deliberadamente)

- Deploy em produção (staging já implantado e homologado visualmente — docs/20).
- Integração Hermes/n8n.
- Conteúdo editorial real e produção editorial.
- Migração de DNS (@ e www).
# Atualização Fase 5

As capacidades antecipadas da Fase 2B permanecem canônicas. A Fase 5 adiciona
descoberta por tipo, busca/filtros, tags, atribuição de revisor, citações
públicas, correções, impacto para o negócio, relacionados e políticas
editoriais, sem conteúdo fictício ou publicação automatizada.
