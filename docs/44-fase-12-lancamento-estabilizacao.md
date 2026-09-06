# Fase 12 — Migração, lançamento e estabilização

## Estado vigente

A Fase 12 foi iniciada em 6 de setembro de 2026, após aceite humano da Fase 11.
Fases 0–11 concluídas e aceitas. O objetivo é migrar a produção legada (landing
page antiga em `crescimento-vertical`) para o portal novo e estabilizar por sete
dias sem incidente crítico.

## Pré-condições bloqueantes

Estes itens bloqueiam o deploy de produção e exigem decisão/aceite humano:

- [x] **Gate A — copy comercial**: aprovado por aceite humano (6/9/2026).
- [x] **Gate B — homologação responsiva**: aprovado por aceite humano (6/9/2026).
- [ ] **Mudanças da Fase 11 commitadas e com CI verde** (working tree limpa).
- [x] **Cópia off-site de backup** (ADR-041): Cloudflare R2 configurado, envio de
  teste e round-trip (download → GPG → `SHA256SUMS`) validados em 6/9/2026;
  cron diário às 3h30 (`scripts/phase11-offsite-backup.sh`, ver `docs/43`).
- [x] **DNS**: `crescimentovertical.com` e `www` apontam para a VPS; TLS emitido
  (Let's Encrypt via `mytlschallenge`) e redirect `www → apex` (301) validados.
- [x] **Analytics**: GA4 ativado (measurement ID `G-GZEL0RQ2E2`) com consentimento
  LGPD (banner + `gtag` somente após aceite; eventos `page_view`,
  `whatsapp_click`, `diagnostic_submit/success/error`). Search Console permanece
  a ativar.

## Lançamento executado (6/9/2026)

- DNS propagado (apex e www → VPS); TLS válido em ambos (`ssl_verify_result=0`).
- Portal novo ativo em `https://crescimentovertical.com`; `www` redireciona (301).
- Home, `/conteudos`, artigo, `/sitemap.xml`, `/robots.txt`, `/diagnostico`,
  `/admin` e healthchecks respondendo; páginas públicas indexáveis, `/admin`
  noindex; 404 tratado.
- Produção legada `crescimento-vertical` preservada como rollback.

## Pré-lançamento

1. Congelar mudanças não essenciais (após os gates acima).
2. Backup pré-lançamento completo + `SHA256SUMS` e validação.
3. Fixar release (commit, imagem e digests).
4. Aplicar migrations compatíveis (expandir, sem contrair).
5. Deploy controlado **sem destruir a produção legada** antes do aceite.

## Deploy de produção (preparado em 6/9/2026)

- Compose dedicado `docker-compose.production.yml` (projeto
  `crescimento-vertical-production`) com app + PostgreSQL 16 + mídia, blue-green:
  router apex/www com `priority=200` acima do legado (rollback), redirect
  `www → apex` (301) e TLS `mytlschallenge`.
- Imagem `cv-production-app:latest` construída a partir do HEAD do PR #20;
  segredos de produção em `.env.production` (600) e senha SMTP via
  `.secrets/lead-smtp-password` (reutilizada).
- Migrações aplicadas (7) e conteúdo migrado do staging: 5 artigos, 1 autor,
  5 categorias, 21 fontes, 6 mídias, 6 serviços; lead/outbox de teste **removidos**.
- Mídia copiada do volume de staging; app `healthy`; smoke interno 200 em
  `/`, `/conteudos`, artigo, `/sitemap.xml`, `/robots.txt`, `/diagnostico`,
  `/admin`; páginas públicas **indexáveis** (`noindex` ausente), `/admin`
  `noindex`.

Aguardando: analytics.

## Verificação de lançamento

- domínio canônico e redirect de `www`;
- TLS válido no apex/www;
- `robots.txt` e `sitemap.xml`;
- páginas públicas, 404 e APIs (`/api/health/live`, `/api/health/ready`);
- Admin e preview autenticados;
- CTAs e `/diagnostico`;
- SMTP (lead notification) e captação idempotente;
- fluxo editorial (Hermes → n8n → Telegram → aprovação → publicação);
- logs, métricas e alertas (health-check/digest Telegram);
- backup e rollback prontos (janela de rollback mantida).

## Estabilização (7 dias)

- monitorar erros, indexação, performance, workflows, leads e custos;
- corrigir somente por fluxo controlado;
- manter janela de rollback;
- encerrar somente após sete dias sem incidente crítico.

## Critério de saída

Produção íntegra, monitorada e recuperável; conteúdo indexável; captação e
publicação funcionando; documentação correspondente ao estado implantado; aceite
humano final registrado.

## Riscos e rollback

- Produção legada (`crescimento-vertical`) permanece como fallback até o aceite;
  não remover o container/imagem anterior.
- Rollback de aplicação: reverter imagem/release e reapontar o Traefik.
- Rollback de banco: somente com restauração validada e autorizada.
- RPO ≤ 6 h e RTO ≤ 4 h (rotinas da Fase 11 em execução).
