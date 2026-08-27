# Fase 2 — Fundação do portal e design system

## Objetivo e estado

Esta fase consolida a estrutura pública do App Router, a navegação, os tokens
semânticos, os componentes estruturais e a acessibilidade sem mudar URLs,
marca, conteúdo ou runtime de produção. A fase permanece **em execução** até
a homologação visual humana do candidato de staging.

## Estrutura de rotas

~~~text
src/app/
├─ (public)/                    # layout visual público único
│  ├─ layout.tsx             # SiteShell
│  ├─ page.tsx               # /
│  └─ (editorial)/
│     ├─ conteudos/          # /conteudos e /conteudos/[slug]
│     ├─ categorias/         # /categorias/[slug]
│     ├─ autores/            # /autores/[slug]
│     ├─ loading.tsx
│     └─ error.tsx
├─ (payload)/                   # /admin e API do Payload, isolados
├─ api/health/                  # fora do layout visual
├─ feed.xml/                    # fora do layout visual
├─ robots.ts
└─ sitemap.ts
~~~

Route groups não alteram URLs. APIs, healthchecks, feed, robots, sitemap e
Payload não recebem Header/Footer. O `SiteShell` fornece um único `main` com
`id="main-content"`, SkipLink, SiteHeader, SiteFooter e CTA flutuante opcional.

## Navegação e componentes

`src/lib/navigation.ts` é a fonte única dos destinos liberados: `/`,
`/conteudos`, `/#solucoes`, `/#processo`, `/#diferenciais` e `/#contato`.
Links internos usam `next/link`; não existem links para páginas da Fase 4.

Componentes estruturais consolidados em `src/components/layout/`: `SiteHeader`,
`MobileNavigation`, `SiteFooter`, `SiteShell`, `Container`, `Section`,
`Breadcrumbs` e `SkipLink`. Estados consolidados em `src/components/ui/`:
`EmptyState`, `ErrorState`, `SuccessState` e `Skeleton`. Os componentes
concorrentes anteriores foram removidos.

## Tokens semânticos e acessibilidade

`src/app/globals.css` define tokens de cores/superfícies/texto/bordas/foco e
estados, escala de espaçamento, larguras de container/leitura, tipografia,
radius, elevação, transições e z-index. Aliases anteriores preservam os
componentes visuais estáveis; cores avulsas mudam apenas por equivalência segura.

- SkipLink visível no foco e `main` programaticamente focalizável;
- landmarks e `aria-current` coerentes;
- menu mobile com dialog modal, Escape, focus trap, retorno do foco,
  fechamento por navegação e bloqueio temporário de rolagem;
- foco visível por token, ícones decorativos ocultos e reduced motion;
- estados de loading, vazio, erro, sucesso e 404 semanticamente identificados.

## Contratos e testes

`src/types/public.ts` concentra navegação, breadcrumbs, CTA, referência futura
de serviço e estados. Os DTOs editoriais existentes continuam como fronteira
pública e não foram duplicados.

Vitest permanece como runner. Testing Library 16.3.2, DOM 10.4.1, user-event
14.6.6 e jsdom 30.0.1 são devDependencies exatas para interação DOM, teclado e
foco. Os testes cobrem navegação, Header, menu, Escape, foco, SkipLink,
Breadcrumbs, estados e SiteShell.

## Deploy, backup e rollback

Somente `cv-phase2-staging-app` pode ser recriado, após CI verde e backup de
Git, banco, mídia, configuração e imagem atual. Não há nova migration. Rollback:
restaurar a imagem exportada e recriar exclusivamente o serviço `app`; banco e
volumes permanecem preservados.

### Candidato implantado em 27 de agosto de 2026

- PR draft: `#8`; os quatro checks obrigatórios ficaram verdes antes do deploy.
- Commit da imagem: `ac7eb19`; tag
  `crescimento-vertical:phase2-foundation-staging-ac7eb19`; image ID
  `sha256:85110b839241...`.
- Backup pré-deploy:
  `/opt/backups/crescimento-vertical/phase2-foundation-predeploy-ac7eb19-20260827-011500`,
  com bundle, dump, mídia, configuração e imagem validados por SHA-256; diretório
  700 e arquivos 600.
- Nenhuma migration nova; somente `cv-phase2-staging-app` foi recriado. Seu ID
  mudou de `8ba86f676f44` para `af7129c2402c`; os outros sete containers do
  escopo mantiveram os IDs.
- Internamente, `/`, `/conteudos`, `/admin`, live, ready, robots e sitemap
  retornaram 200; uma rota inexistente retornou 404. Robots bloqueia indexação e
  o sitemap contém zero URLs.
- Externamente, TLS validou, acesso sem BasicAuth retornou 401 e
  `X-Robots-Tag` permaneceu `noindex, nofollow, noarchive`.
- Banco preservado: um usuário e zero registros nas coleções editoriais.

A inspeção automatizada não dispõe de navegador no host/container. A validação
visual nos cinco viewports permanece como gate humano deste PR draft; o aceite
anterior da Fase 2B é o baseline comparativo, não aprovação automática desta
mudança.

## Fora do escopo

- produção, DNS e Traefik global;
- `/solucoes`, `/diagnostico`, `/sobre`, `/contato`, `/cases` e páginas legais;
- conteúdo fictício, leads, usuários ou tenants;
- execução do Hermes e alterações em n8n/Evolution API;
- início da Fase 3 ou merge antes da homologação.
