# Fase 6 — SEO técnico, dados estruturados e performance

Data de início: 29 de agosto de 2026. Estado: em execução até aceite humano do
candidato de staging.

## Matriz de rotas

| Rota | Indexação de produção | Canonical/sitemap | Schema | Cache |
| --- | --- | --- | --- | --- |
| `/` | index | própria/sim | Organization, WebSite | render público |
| `/conteudos` | index sem filtros; filtros noindex | própria; paginação explícita/sim | WebSite global | dados 300 s |
| `/conteudos/[slug]` e aliases por tipo | somente publicado e não futuro | `/conteudos/[slug]`/sim | Article ou NewsArticle, BreadcrumbList | dados 300 s |
| hubs de tipo | index | própria/sim | WebSite global | dados 300 s |
| `/categorias/[slug]` | somente categoria com conteúdo | própria/sim | BreadcrumbList | dados 300 s |
| `/tags/[slug]` | somente `indexable=true` | própria/somente indexável | WebSite global | dados 300 s |
| `/autores/[slug]` | somente perfil público com conteúdo | própria/sim | ProfilePage, BreadcrumbList | dados 300 s |
| `/busca` | noindex | `/busca`/não | nenhum específico | dinâmico |
| `/solucoes` e `/solucoes/[slug]` | somente serviço ativo/publicado e sem noindex | própria/sim | Service no detalhe | dados 300 s |
| `/diagnostico`, `/sobre`, `/contato` | index | própria/sim | WebSite global | estático |
| `/cases` | excluída enquanto vazia | própria/não | nenhum | dados públicos |
| políticas e correções | index | própria/sim | WebSite global | estático |
| feed | não é página HTML | própria/não | RSS | `s-maxage=300` |
| sitemap | endpoint técnico | própria/não | XML | revalida 300 s |
| robots | endpoint técnico | própria/não | texto | estático por ambiente |
| preview, admin, API e 404 | noindex/excluídos | nenhum/não | nenhum | sem cache público |

Em staging, `SITE_NOINDEX=true`, metadata global, robots e header de borda
impõem `noindex, nofollow, noarchive`; o sitemap fica vazio. Query strings não
alteram canonical. Busca, filtros e tags não autorizadas não são indexáveis.

## Metadata e dados estruturados

URLs usam exclusivamente `https://crescimentovertical.com`. Canonical externo,
com query ou fragmento é descartado/normalizado. Open Graph e Twitter possuem
fallback social real. JSON-LD usa IDs absolutos estáveis e serialização que
escapa `<`, `>`, `&`, U+2028 e U+2029.

Aplicados: Organization e WebSite globais; BreadcrumbList nas hierarquias;
NewsArticle apenas em notícia; Article nos demais tipos editoriais; Service em
serviço real; ProfilePage em autor público real. Recusados: FAQPage, HowTo,
Review, Rating, Product e LocalBusiness, porque não há conteúdo/dados públicos
correspondentes e verificáveis.

## Robots, sitemap e cache

Produção exclui admin, API, preview, busca e qualquer URL com query. Sitemap é
derivado dos DTOs públicos defensivos, inclui serviços ativos e tags somente
quando indexáveis, não inventa conteúdo e funciona vazio. Datas de artigo vêm
de `updatedAt`/`publishedAt`; páginas estáticas não recebem data artificial.
RSS, sitemap e consultas editoriais usam janela coerente de 300 segundos;
preview permanece sem cache.

## Performance

Baseline local no merge da Fase 5: instalação limpa 74,88 s, build 53,90 s,
pico de memória aproximado 1,06 GiB no build; três PNGs somavam 3.976.336 bytes.
O ambiente CLI não oferece métrica confiável de INP de campo. O hero, verdadeiro
LCP da home, passou de PNG CSS de 1.643.478 bytes para WebP de 114.140 bytes
(redução de 93%) via `next/image`, com dimensões reservadas, `sizes=100vw` e
priority exclusiva. Imagens editoriais usam `next/image`, dimensões e `sizes`;
as demais imagens grandes não são entregues pelas rotas atuais e não justificam
mudança visual. Não há fonte externa em runtime nem analytics.

## Integrações externas, rollback e limites

ADR-026 mantém Search Console sem verificação e GA4 sem script, Measurement ID
ou coleta. Ativação depende de lançamento, credenciais e consentimento da Fase
7. Rollback restaura a imagem anterior e recria exclusivamente o app; nenhuma
migration foi criada. Produção, DNS, Traefik global, PostgreSQL persistente,
n8n, Hermes e runner editorial ficam fora do escopo.

Permanecem gates pré-produção: homologação responsiva integral nos cinco
viewports e concretização da copy comercial da Fase 4. A Fase 6 não os conclui.
