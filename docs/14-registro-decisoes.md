# Registro de decisões arquiteturais

Este documento registra decisões aprovadas. Mudanças exigem nova entrada; não
apagar o histórico.

## ADR-001 — Domínio canônico único

- Data: 2026-08-23
- Status: aprovada
- Decisão: usar crescimentovertical.com para conteúdo e serviços.
- Motivo: concentrar marca, autoridade, navegação, métricas e conversão.
- Consequência: usar subdiretórios; não criar blog.crescimentovertical.com.

## ADR-002 — Posicionamento

- Data: 2026-08-23
- Status: aprovada
- Decisão: “Crescimento Vertical — Inteligência artificial, automação e
  tecnologia para negócios.”
- Consequência: assunto fora desse eixo não entra no portal.

## ADR-003 — Produto híbrido

- Data: 2026-08-23
- Status: aprovada
- Decisão: portal editorial e operação de venda de serviços no mesmo produto.
- Motivo: conteúdo gera demanda e serviços monetizam antes de audiência massiva.

## ADR-004 — Base técnica

- Data: 2026-08-23
- Status: aprovada
- Decisão: preservar Next.js/App Router e integrar Payload CMS + PostgreSQL.
- Motivo: base atual compatível, TypeScript compartilhado, drafts, versões,
  painel e relações editoriais.

## ADR-005 — Controle de publicação

- Data: 2026-08-23
- Status: aprovada
- Decisão: Hermes não publica diretamente.
- Motivo: reduzir risco factual, jurídico, reputacional e operacional.
- Consequência: Hermes cria dossiê/draft; humano aprova; n8n executa.

## ADR-006 — Papel do n8n

- Data: 2026-08-23
- Status: aprovada
- Decisão: n8n será a camada determinística de validação, aprovação, integração e
  reprocessamento.
- Motivo: separar raciocínio probabilístico de ações com efeito externo.

## ADR-007 — Fonte de verdade

- Data: 2026-08-23
- Status: aprovada
- Decisão: Payload/PostgreSQL é a fonte oficial de conteúdo, decisão e estado.
- Consequência: memória, arquivos e cron do Hermes não substituem o CMS.

## ADR-008 — Identidade visual

- Data: 2026-08-23
- Status: aprovada
- Decisão: preservar direção escura em azul/ciano e amadurecê-la como design
  system.
- Consequência: não redesenhar a marca sem decisão própria.

## ADR-009 — Monetização inicial

- Data: 2026-08-23
- Status: aprovada
- Decisão: priorizar leads e contratos de serviço; publicidade fica posterior.
- Motivo: maior receita potencial com tráfego menor e mais qualificado.

## ADR-010 — Mídia persistente

- Data: 2026-08-23
- Status: aprovada
- Decisão: mídia de produção usa interface S3 compatível e backup fora da VPS.
- Pendente: selecionar fornecedor na Fase 1 conforme conta, região e custo.

## ADR-011 — Ambientes

- Data: 2026-08-23
- Status: aprovada
- Decisão: separar local, staging e produção.
- Consequência: produção não receberá dados ou tenants fictícios para teste.

## ADR-012 — Analytics

- Data: 2026-08-23
- Status: aprovada
- Decisão: Google Search Console e GA4 formarão a base inicial de descoberta e
  comportamento; CMS/CRM manterá atribuição de lead e receita.
- Consequência: nenhum dado pessoal será enviado ao GA4.

## ADR-013 — VPS oficial e reutilização do Hermes

- Data: 2026-08-24
- Status: aprovada
- Decisão: implantar o Crescimento Vertical na VPS-alvo confirmada e reutilizar o
  Hermes Agent já operante nesse ambiente.
- Motivo: concentrar a operação editorial com o Hermes e o n8n existentes sem
  duplicar infraestrutura.
- Consequência: a implantação do site será nova; o perfil
  crescimento-vertical-editorial será isolado logicamente e não poderá alterar a
  configuração global ou a memória de outros projetos do Hermes.
- Regra operacional: preservar todos os contêineres existentes durante o
  baseline e integrar somente por contratos autenticados.

## Decisões operacionais pendentes

Estas escolhas não mudam a arquitetura e serão fechadas na fase indicada:

| Decisão | Fase | Critério |
| --- | --- | --- |
| Fornecedor S3 | 1 | região, custo, backup, egress |
| Subdomínio de staging | 1 | DNS e proteção |
| Provedor de e-mail/newsletter | 7 | entregabilidade, LGPD, API e custo |
| Provedor/modelo do Hermes | 8 | qualidade factual, custo e estabilidade |
| Cadência final do Hermes | 8 | volume, custo e taxa de aprovação |

## Como registrar nova decisão

Usar docs/templates/adr.md e adicionar aqui um resumo com número sequencial,
data, status, decisão, motivo, consequências e plano de reversão.
