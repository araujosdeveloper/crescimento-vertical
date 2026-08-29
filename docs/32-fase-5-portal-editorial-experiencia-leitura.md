# Fase 5 — Portal editorial e experiência de leitura

## Aceite humano e encerramento — 29 de agosto de 2026

O responsável pelo produto aprovou hubs editoriais vazios, busca e filtros,
políticas editorial e de correções, novos campos no Admin, ausência de conteúdo
fictício, preservação das páginas comerciais e a navegação reorganizada. Foram
confirmados o primeiro nível Início, Conteúdos, Soluções, Empresa e Solicitar
diagnóstico, o menu compacto para tablet, o espaçamento do Header e a ausência
de títulos cortados. A Fase 5 está formalmente concluída; nenhuma próxima fase
foi iniciada. A homologação responsiva integral e a concretização da copy
comercial da Fase 4 permanecem gates obrigatórios pré-produção.

## Correção de navegação do Header

Após evidência humana de corte de Contato, espaçamento inadequado e overflow em
tablet, a navegação foi reorganizada em cinco destinos de primeiro nível:
Início, Conteúdos, Soluções, Empresa e Solicitar diagnóstico. Os três grupos
usam dropdown acessível no desktop; abaixo de 1180px o menu compacto usa
accordion, foco preso, Escape, retorno de foco, scroll lock e fechamento ao
navegar. Header, MobileNavigation e Footer consomem a mesma configuração
tipada. Não houve migration, seed ou alteração de dados. A verificação técnica
foi feita em 1024, 1100, 1180, 1280 e 1440px; a homologação responsiva integral
continua sendo gate do hardening visual final.

## Estado e lacunas

A antecipação 2B já entregava o hub `/conteudos`, artigo canônico, categorias,
autores, RSS, sitemap, DTOs, publicação segura, cache, SEO, paginação, Lexical,
`featured` e estados vazios. A Fase 5 completou descoberta e leitura sem
reconstruir essas capacidades.

## Entregas

- `contentType` fechado: news, analysis, guide, tool e comparison.
- Coleção `tags`, com `indexable=false` por padrão e sem seed.
- Atribuição pública de revisor via `authors`, separada do usuário Payload.
- Snapshot de citações HTTPS de fontes verificadas no momento da publicação.
- Impacto para o negócio, tempo de leitura calculado no servidor, correções,
  disclosure de IA, serviços e artigos relacionados.
- Hubs e rotas por tipo, busca, filtros e `/tags/[slug]`.
- Componentes de leitura, fontes, revisão, correções, relacionados e busca.
- `/politica-editorial` e `/correcoes`, ambos honestos no estado vazio.

Fontes, dossiês, usuários, e-mails, roles e auditoria permanecem fora dos DTOs.
Artigos draft, futuros ou sem fonte verificada, revisor público e requisitos de
publicação não são expostos.

## Migration, testes e rollback

A migration `20260828_182146_add_phase5_editorial` adiciona campos com default
seguro e a coleção `tags`, preservando dados anteriores. Foi aplicada em
PostgreSQL 16 descartável com `migrate:status` verde. O rollback restaura o
backup Git/PostgreSQL/mídia anterior e recria somente o app; não há deploy ou
alteração de produção nesta etapa de implementação.

Os gates pré-produção permanecem: homologação responsiva integral e
concretização da copy comercial da Fase 4. A Fase 6 (hardening avançado de SEO,
dados estruturados e performance) não foi antecipada.

## Staging

Após backup pré-deploy, a migration foi aplicada sem seed editorial e somente o
app `cv-phase2-staging-app` foi recriado. App e PostgreSQL estão saudáveis;
`tags=0`, `articles=0`, `authors=0`, `categories=0`, `sources=0`,
`research_dossiers=0`, `services=6`, `cases=0` e `users=1`. Hubs por tipo,
busca, políticas, páginas comerciais, RSS, sitemap, robots, `/admin`,
healthchecks e 404 foram verificados; acesso externo sem BasicAuth retorna 401.
O staging preserva o estado anterior e a produção permanece inalterada.
