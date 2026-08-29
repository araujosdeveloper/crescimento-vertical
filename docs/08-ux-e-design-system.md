# UX e design system

## Aceite humano da navegação da Fase 5 — 29 de agosto de 2026

O responsável pelo produto aprovou os hubs vazios, busca, filtros, políticas,
novos campos editoriais e a navegação hierárquica corrigida. O primeiro nível
(Início, Conteúdos, Soluções, Empresa e Solicitar diagnóstico), o menu compacto
para tablet, a organização e o espaçamento do Header e a ausência de títulos
cortados foram confirmados. A homologação responsiva integral continua pendente
como gate geral pré-produção.

## Correção de navegação — Fase 5 — 28 de agosto de 2026

Foi corrigido o Header que apresentava menu excessivamente longo, corte de
Contato e overflow em tablet. O Header desktop usa três grupos compactos com
controles por clique, `aria-expanded`, `aria-controls`, `aria-haspopup`, foco,
Escape, clique externo e fechamento ao navegar. Abaixo de 1180px o menu
compacto mobile/tablet usa accordion, foco preso, scroll lock, áreas de toque de
44px e apenas um grupo aberto por vez. A fonte é única e tipada; a verificação
visual específica cobre 1024, 1100, 1180, 1280 e 1440px. A homologação
responsiva integral do projeto continua pendente no hardening final.

## Direção visual

As páginas comerciais da Fase 4 reutilizam `SiteShell`, `Container`, `Section`,
`Breadcrumbs` e estados existentes. O catálogo apresenta seis pilares sem
duplicar componentes ou alterar os tokens visuais.

Preservar a linguagem atual: tecnológica, escura, precisa e orientada a
performance. O portal não deve parecer um agregador genérico de notícias nem uma
landing page excessivamente promocional.

## Tokens iniciais preservados

| Token | Valor atual | Uso |
| --- | --- | --- |
| background | #020617 | Fundo principal |
| surface | #07111f | Superfície |
| surface-2 | #0b1220 | Superfície secundária |
| foreground | #f8fbff | Texto principal |
| muted | #8da0bb | Texto secundário |
| blue | #0a84ff | Ação primária |
| cyan | #00d4ff | Destaque |

Na Fase 2 esses valores serão convertidos em tokens semânticos e avaliados para
contraste. Componentes não devem usar cores avulsas quando existir token.

### Consolidação da Fase 2

Os tokens em `globals.css` agora cobrem cores, superfícies, texto, bordas, foco,
estados, espaçamento, containers, tipografia, radius, elevação, transições e
camadas. Aliases dos tokens iniciais preservam os componentes estáveis enquanto
cores avulsas são substituídas somente por equivalência comprovada.

`SiteShell`, `SiteHeader`, `MobileNavigation`, `SiteFooter`, `Container`,
`Section`, `Breadcrumbs` e `SkipLink` formam a camada estrutural única. Estados
de vazio, erro, sucesso e loading ficam em `components/ui`, sem concorrentes.

## Tipografia

- Sans-serif para interface, títulos e leitura.
- Tamanho de corpo editorial mínimo de 17 px em desktop e 16 px em mobile.
- Largura de leitura entre 680 e 760 px.
- Altura de linha entre 1,6 e 1,8 no corpo.
- Títulos com equilíbrio visual, sem comprometer quebra em mobile.
- Fonte será carregada de forma otimizada e com fallback local.

## Componentes obrigatórios

### Estruturais

- SiteHeader
- MobileNavigation
- SiteFooter
- Container
- Section
- ReadingLayout
- Breadcrumbs

### Editoriais

- FeaturedStory
- ArticleCard
- ArticleList
- CategoryBadge
- AuthorByline
- SourceList
- CorrectionNotice
- BusinessImpact
- RelatedContent
- ReadingProgress somente se não prejudicar desempenho

### Comerciais

- ServiceCard
- ContextualCTA
- DiagnosticForm
- CaseCard
- WhatsAppCTA
- NewsletterForm

### Estados

- Skeleton
- EmptyState
- ErrorState
- SuccessState
- InlineValidation
- NotFound

## Regras responsivas

Viewports mínimos de verificação:

- 360 × 800
- 390 × 844
- 768 × 1024
- 1024 × 768
- 1440 × 900

Requisitos:

- Sem rolagem horizontal.
- Menu mobile utilizável por teclado e leitor de tela.
- CTAs sem cobrir conteúdo.
- Cards não dependem de hover.
- Tabelas possuem alternativa responsiva.
- Imagens mantêm proporção e dimensões reservadas.
- Linhas de título não estouram o contêiner.

## Acessibilidade

- Landmark main único.
- Ordem de headings sem saltos artificiais.
- Link “pular para conteúdo”.
- aria-label apenas quando texto visível não for suficiente.
- Botões para ação; links para navegação.
- Focus trap em menus/modais.
- Escape fecha superfícies temporárias.
- Mensagens de erro ligadas ao campo.
- Preferência prefers-reduced-motion respeitada.
- Ícones decorativos ocultos de tecnologia assistiva.

## Imagens

- next/image para mídia do CMS.
- Width e height ou aspect-ratio obrigatórios.
- AVIF/WebP quando suportado.
- Alt descreve função/contexto, não repete legenda.
- Crédito e licença no CMS.
- Imagem decorativa recebe alt vazio.
- Não publicar imagem gerada com marca, pessoa ou produto enganoso.

## Home versus leitura

- Home pode usar efeitos visuais controlados.
- Página editorial prioriza legibilidade e velocidade.
- Não usar fundo animado atrás de texto longo.
- Não inserir modal automático na primeira visita.
- CTA flutuante não pode bloquear controles em mobile.

## Critério visual

Mudança visual é aprovada por comparação de screenshots de baseline e nova
versão. Diferença intencional deve corresponder ao escopo da fase; regressão
acidental bloqueia entrega.
# Atualização Fase 5

A experiência editorial reutiliza ArticleCard, Breadcrumbs, Pagination e estados
existentes, acrescentando badges de tipo, autoria/revisão, fontes, correções,
impacto, relacionados, busca e filtros, sem duplicar o shell público.
