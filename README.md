# Crescimento Vertical

**Inteligência artificial, automação e tecnologia para negócios.**

Este repositório contém um produto híbrido editorial e comercial: o portal
transforma informação especializada em autoridade e demanda, enquanto a
operação comercial conecta essa demanda a soluções de IA, automação, vendas,
atendimento digital, sites e integrações.

## Estado atual

- Fases 0–3 concluídas; Fase 4 concluída com ressalva de copy comercial; Fases
  5–9 concluídas e aceitas.
- Fase 8 (Hermes editor-chefe) encerrada: black-box 36/36 offline + bateria real
  `succeeded`.
- Fase 9 (n8n, Telegram, aprovação e publicação) encerrada: pipeline E2E
  validado em staging (fonte → dossiê → rascunho → Telegram), com workflows
  CV-01..04 ativos no n8n.
- Fase 10 em execução; Fases 11–12 pendentes; publicação automática e retry 3
  permanecem proibidos.
- Aplicação pública em Next.js 16/React 19, com Payload CMS 3.88.0 e PostgreSQL
  16 como fonte de verdade editorial.
- Portal institucional, comercial e editorial, SEO técnico e captação com
  consentimento/outbox implementados; GA4 e Search Console permanecem
  desativados.
- Hermes é o editor-chefe e motor central do blog. DeepSeek e Tavily são
  recursos subordinados; o runner governa a execução; o n8n será a única ponte
  autorizada para o Payload.
- Perfil Hermes, runner e conector n8n existem, mas a execução editorial e os
  workflows das Fases 8/9 permanecem fechados.
- CI com quatro checks obrigatórios, incluindo Gitleaks sobre o histórico.

Antes de produção continuam obrigatórios dois gates transversais: homologação
responsiva e acessível nos cinco viewports oficiais e concretização da copy
comercial da Fase 4. O estado e o plano restante estão consolidados no
[Plano Diretor Definitivo](docs/36-plano-diretor-definitivo.md).

O inventário técnico completo está em
[docs/15-auditoria-estado-atual.md](docs/15-auditoria-estado-atual.md).

## Documentos obrigatórios

1. [AGENTS.md](AGENTS.md) — porta automática e regras de execução.
2. [CONSTITUICAO-DO-PROJETO.md](CONSTITUICAO-DO-PROJETO.md) — missão,
   arquitetura, governança e limites permanentes.
3. [ROTEIRO-MESTRE.md](ROTEIRO-MESTRE.md) — sequência oficial da construção.
4. [docs/00-indice.md](docs/00-indice.md) — mapa de toda a documentação.
5. [docs/14-registro-decisoes.md](docs/14-registro-decisoes.md) — decisões
   arquiteturais aprovadas.
6. [docs/10-controle-de-execucao.md](docs/10-controle-de-execucao.md) — fase e
   gates atuais.
7. [docs/36-plano-diretor-definitivo.md](docs/36-plano-diretor-definitivo.md) —
   consolidação aprovada do estado e da execução restante.

Nenhuma fase começa sem seus critérios de entrada. Uma fase também não é
considerada concluída apenas porque funciona localmente: CI, segurança,
documentação e homologação aplicável fazem parte do aceite.

## Comandos de desenvolvimento

~~~bash
npm ci
npm run lint
npm run typecheck
npm run test
npm run build
npm run check
npm run dev
~~~

O `.env.example` documenta somente variáveis públicas. Segredos e inventário
operacional permanecem fora do Git.

## Regra de produção

O domínio público não é ambiente de experimentação. Mudanças seguem o fluxo:

**branch de trabalho → validação local → PR/CI → backup → staging → homologação
→ merge → deploy controlado → verificação → possibilidade de rollback**
