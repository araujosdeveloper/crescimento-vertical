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
- [ ] **Cópia off-site de backup** (ADR-041): destino + credencial
  (`scripts/phase11-offsite-backup.sh`, ver `docs/43`).
- [ ] **DNS**: apontar `crescimentovertical.com` e `www` para a VPS e confirmar
  redirect `www` → apex (decisão de URL canônica).
- [ ] **Analytics**: decisão humana sobre GA4 e Search Console (sem PII,
  consentimento quando aplicável).

## Pré-lançamento

1. Congelar mudanças não essenciais (após os gates acima).
2. Backup pré-lançamento completo + `SHA256SUMS` e validação.
3. Fixar release (commit, imagem e digests).
4. Aplicar migrations compatíveis (expandir, sem contrair).
5. Deploy controlado **sem destruir a produção legada** antes do aceite.

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
