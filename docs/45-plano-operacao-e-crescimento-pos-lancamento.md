# Plano de operação e crescimento — pós-lançamento

> Estado: proposto em 6/9/2026, após o lançamento da Fase 12. Ordena o trabalho
> que transforma o portal recém-lançado em uma operação contínua e mensurável.
> Não revoga as Fases 0–12; começa onde elas terminam.

## Contexto

As Fases 0–12 foram concluídas e o portal está no ar (produção, DNS/TLS,
analytics, backups com restauração provada). O foco agora muda de **construção**
para **operação e crescimento**. A auditoria de 6/9/2026 apontou lacunas que
este roteiro endereça em ordem de prioridade.

## Princípios

1. Conteúdo é o motor: o portal só gera demanda se produzir continuamente.
2. Não é produção sem observabilidade: erro e indisponibilidade precisam de
   alerta externo, não só check interno.
3. Crescer com audiência própria (newsletter) antes de depender de tráfego pago.
4. Tudo medido do conteúdo ao lead (o fluxo já existe; falta operá-lo).
5. Cada etapa entrega uma capacidade completa e verificável, com critério de
   saída.

---

## Etapa 1 — Operação editorial contínua (prioridade máxima)

**Por quê.** O site tem 5 artigos e o runner está com a execução desabilitada.
Sem conteúdo novo, não há tráfego orgânico nem motivo para voltar — o modelo de
negócio estagna.

**Como.**
1. Cadência decidida (ADR-042): **4 publicações/semana**, cron seg–qui 07:00 BRT.
2. Habilitar a execução do runner pela dupla trava (de forma controlada e
   auditável, com backup prévio do state).
3. Orquestrar via cron + scripts versionados (fila `scripts/editorial/pautas.json`,
   cliente HMAC do runner e scripts de completar/capa/notificar), mantendo o
   `retry3` proibido e a publicação somente após aprovação humana no Telegram.
4. Manter a revisão humana obrigatória e registrar identidade do aprovador.

**Critério de saída.** Pelo menos 1 pauta nova por semana percorre
fonte → dossiê → rascunho → aprovação → publicação, com custo dentro do teto,
sem `retry3` e sem publicação automática.

**Decisão humana necessária.** cadência, pautas iniciais e confirmação do teto
de custo.

---

## Etapa 2 — Observabilidade de produção

**Por quê.** Hoje o alerta depende de check interno na própria VPS. Sem erro
rastreado nem uptime externo, a estabilização é julgada às cegas.

**Como.**
1. Adicionar tracking de erros server/client (Sentry ou equivalente
   self-hosted), com release/commit e sem PII.
2. Uptime monitor **externo** (Better Stack / UptimeRobot) com heartbeat no
   `/api/health/live` e alerta por Telegram/e-mail.
3. Instrumentar 5xx e p95 no app (ou via proxy) e incluir no digest diário.
4. Definir quem recebe o alerta crítico e a janela de resposta.

**Critério de saída.** Um incidente simulado (rota 500 + queda do host) gera
alerta externo em minutos, com contexto (release, requestId, stack) para triagem.

**Progresso (7/9/2026).**
- [x] 5xx, erros, p95 e memória instrumentados no app e expostos em
  `/api/health/metrics` + digest diário (`src/lib/metrics.ts`,
  `src/instrumentation.ts`).
- [x] Uptime monitor externo: UptimeRobot ativo em `https://crescimentovertical.com/`
  (keyword "Crescimento Vertical"), alerta por e-mail.
- [ ] Tracking de erro server/client (Sentry) — opcional, depende de conta.

---

## Etapa 3 — Borda: Cloudflare CDN/WAF na frente

**Por quê.** O DNS aponta direto para a VPS. Sem CDN (cache de estáticos),
WAF e proteção de bot, o formulário de leads fica exposto a abuso.

**Como.**
1. Ativar o proxy Cloudflare (laranja) para `crescimentovertical.com`/`www`.
2. Migrar a emissão de TLS para DNS-01 (o `mytlschallenge` TLS-ALPN-01 não
   funciona atrás do proxy) ou usar certificado de origem da Cloudflare.
3. Configurar cache de estáticos e regra WAF mínima (bloqueio de bot no
   `/api/leads`).
4. Ajustar o rate limiting e o `x-forwarded-for` para funcionarem atrás do proxy.

**Critério de saída.** Site servido via Cloudflare com TLS válido, estáticos em
cache, WAF ativo e o endpoint de leads protegido, sem regressão de
funcionalidade.

---

## Etapa 4 — Backup completo (n8n + estado do Hermes)

**Por quê.** O backup cobre PostgreSQL + mídia + Git, mas não os workflows n8n
nem o estado do runner. Perder o n8n = perder CV-01..04 sem recuperação.

**Como.**
1. Exportar sanitizado dos workflows n8n (sem credenciais) para o Git.
2. Incluir o SQLite do n8n e o `runner-state` no backup diário + off-site.
3. Adicionar esses artefatos ao teste mensal de restauração.

**Critério de saída.** O backup diário contém workflows n8n e estado do runner;
a restauração isolada recupera ambos.

**Progresso (7/9/2026).**
- [x] Backup diário passou a incluir **produção** (PostgreSQL + mídia), **n8n
  (SQLite)** e **runner-state (SQLite)** via `phase11-backup-sqlite.py`.
- [x] Corrigido: o backup apontava para **staging**; agora a fonte de verdade é
  produção (e o off-site, que envia o diário, acompanha automaticamente).
- [ ] Export sanitizado dos workflows n8n conferido contra o n8n vivo (Git
  `n8n/workflows/`).

---

## Etapa 5 — Newsletter e ciclo de vida de leads

**Por quê.** Newsletter é o canal de audiência própria listado como objetivo, e
o ciclo LGPD (retenção/acesso/exclusão) está incompleto.

**Como.**
1. Criar a coleção de newsletter + formulário de inscrição com consentimento
   versionado (reutilizar o padrão do formulário de leads).
2. Agendar a retenção de leads (`leads:retention`) via cron.
3. Documentar/implementar o fluxo de acesso e exclusão de dados pessoais
   (pedido por e-mail/WhatsApp → execução no CMS com registro).

**Critério de saída.** Inscrição na newsletter com consentimento; retenção
automática de leads ativa; fluxo de exclusão operacional e registrado.

**Progresso (7/9/2026).**
- [x] Coleção `newsletter-subscribers` + rota `/api/newsletter` (token HMAC,
  honeypot, rate limit, consentimento versionado) + formulário no rodapé.
- [x] Retenção de leads agendada (cron mensal `scripts/retention-cron.sh`).
- [x] Política de privacidade atualizada (acesso/correção/exclusão + retenção
  automática).

**Pendente (futuro).** Envio efetivo de campanhas (provedor de e-mail em massa),
que exige nova credencial/contrato — fora do escopo desta rodada.

---

## Etapa 6 — Performance (CWV) e sincronia de ambientes

**Por quê.** As metas (LCP ≤ 2,5 s; INP ≤ 200 ms; CLS ≤ 0,1) estão definidas
mas não são medidas em produção; e não há política de sincronia
staging ↔ produção após a migração única.

**Como.**
1. Medir CWV reais (CrUX / PageSpeed Insights em CI ou agendado) e registrar
   baseline.
2. Definir política de conteúdo: produção como fonte de verdade editorial;
   staging para teste, sem divergência não documentada.
3. Corrigir apenas itens fora da meta, por fluxo controlado.

**Critério de saída.** Baseline de CWV registrado e monitorado; política de
sincronia documentada e respeitada.

---

## Ordem e dependências

| Etapa | Depende de | Riscos se adiada |
| --- | --- | --- |
| 1 — Editorial contínuo | nada (bloqueia o crescimento) | site estagna |
| 2 — Observabilidade | nada | incidente sem resposta |
| 3 — Borda CDN/WAF | 2 (para medir impacto) | abuso no formulário |
| 4 — Backup n8n/estado | nada | perda irrecuperável |
| 5 — Newsletter/leads | 1 (conteúdo p/ newsletter) | sem audiência própria |
| 6 — CWV/sincronia | 3 (CDN muda métricas) | performance sem baseline |

## Critérios gerais de aceite

- Escopo e critérios de saída atendidos por etapa;
- lint/typecheck/testes/build verdes e CI no verde;
- sem segredo, PII ou dado pessoal no diff;
- rollback e backup considerados antes de cada mudança destrutiva;
- documentação e ADR atualizados quando contrato ou decisão mudarem;
- validado em staging antes de produção.

## Regras de parada

Parar e decidir com o responsável quando houver: nova credencial/contrato
externo, risco de perda de dados, mudança material de escopo/monetização, ou
qualquer decisão que altere o modelo editorial ou a marca.
