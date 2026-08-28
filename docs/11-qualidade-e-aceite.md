# Qualidade e aceite

## Aceite técnico da correção de navegação — 28 de agosto de 2026

O Header foi validado contra a regressão de menu cortado: primeiro nível curto,
grupos lógicos, Contato dentro de Empresa, CTA destacado, `aria-expanded`,
`aria-controls`, `aria-haspopup`, `aria-current`, Escape, clique externo,
retorno de foco, teclado e focus trap no menu compacto. O breakpoint de 1180px
mantém 1024px em menu compacto e evita sobreposição nas larguras intermediárias.
O gate de homologação responsiva completa em cinco viewports continua aberto.

## Pirâmide de testes

### Unitários

- Funções de slug, canonical, tempo de leitura e normalização.
- Regras de acesso.
- Validação de schema.
- Deduplicação e idempotência.
- Mapeamento de CTA.

Ferramenta adotada: Vitest 4.1.0 sobre Vite 7.3.6.

Testes editoriais já implementados na Fase 2A (Vitest, `tests/`): matriz de
permissões, transições editoriais, bloqueio de publicação por automation/editor,
exigência de fonte validada, acesso público somente a publicados e validação das
variáveis obrigatórias. Execução: `npm test`.

Testes da Fase 2B (Vitest, `tests/editorial-public.test.ts`): DTOs não expõem
campos internos, filtro de publicados (draft/agendado/publicado), paginação,
exigência de imagem/fonte na publicação, segurança de links, metadata/canonical,
JSON-LD, feed RSS e estado vazio. Total: 60 testes.

Testes da Fase 3B (Python `unittest`, `services/hermes-editorial-runner/tests/`):
HMAC, nonce anti-replay, schemas (request/dossier), dupla trava de execução,
comando sem shell e integração HTTP (401/409/413/400/422/503/404/200). Total:
32 testes.

Testes da Fase 3C (Vitest, `packages/n8n-nodes-crescimento-vertical/test/`):
vetor HMAC, assinatura de corpo, nonce/timestamp, validação de URL interna,
validação da requisição, cliente HTTP (timeout, resposta grande, status
401/409/503, sem segredo em erro), node e credencial. Total: 34 testes.

Testes formais da Fase 3:

- `tests/preview.test.ts`: slug estrito, mesmo origin, open redirect, drafts,
  lockout e usuário inativo;
- `tests/permissions.test.ts`: matriz dos cinco papéis, usuário inativo e
  limites de edição de `editor`/`automation`;
- `tests/cms.integration.test.ts`: ciclo real e sequencial em PostgreSQL 16 e
  mídia temporária, opt-in por `RUN_CMS_INTEGRATION=1`;
- `tests/cms-recovery.integration.test.ts`: autenticação, contagens, relações,
  versões, conteúdo público/privado e mídia após restore isolado;
- o CI executa o ciclo CMS somente depois das migrations no PostgreSQL efêmero.

### Componentes

- Header e menu.
- Cards editoriais.
- Formulários e validações.
- SourceList e CorrectionNotice.
- CTAs.

Ferramentas planejadas: Testing Library e axe.

Na Fase 2, Testing Library foi adotada com Vitest/jsdom para Header,
MobileNavigation, teclado/foco, SkipLink, Breadcrumbs, estados e SiteShell. As
versões ficam fixadas no lockfile; axe continua planejado, sem criar um segundo
runner de testes.

### Integração

- Payload + PostgreSQL.
- Draft versus published.
- Permissões por role.
- Intake do n8n.
- Webhook assinado.
- Formulário de lead.

### Ponta a ponta

- Navegação pública.
- Busca e filtros.
- Preview autenticado.
- Conteúdo publicado.
- Diagnóstico.
- Hermes → aprovação → publicação.
- Redirecionamentos.

Ferramenta planejada: Playwright.

## Pipeline de CI

Ordem obrigatória:

1. npm ci
2. lint
3. typecheck
4. testes unitários e de componentes
5. build
6. migrações em banco efêmero
7. testes de integração
8. smoke E2E
9. verificação de segredos e dependências

Falha em qualquer etapa bloqueia merge.

Após o hardening do repositório público, quatro jobs são obrigatórios: pipeline
Node/Payload, runner editorial, conector n8n/Hermes e
`secret-scan (gitleaks full history)`. O Gitleaks usa o histórico completo; toda
action externa é pinada por SHA e os checkouts não persistem credenciais.

## Critérios por página

As páginas comerciais da Fase 4 devem manter metadata/canonical exclusivos,
JSON-LD Service somente quando semântico, CTA proporcional, 404 seguro e
nenhuma exposição de campos internos do CMS.

### Aceite humano da Fase 4 com ressalva — 28 de agosto de 2026

Arquitetura, rotas, navegação e catálogo foram aprovados. O conteúdo comercial
foi aceito provisoriamente: parte dos textos ainda é abstrata e exige rodada
posterior obrigatória de concretização, cobrindo clareza, especificidade,
problemas atendidos, entregáveis, diferenciais, processo, limites e CTAs. A
melhoria não bloqueia a Fase 5, mas bloqueia produção; é proibido inventar
resultados, clientes, métricas ou garantias.

- Status HTTP correto.
- Um H1.
- Title e description.
- Canonical.
- Open Graph.
- Navegação por teclado.
- Foco visível.
- Sem erro no console.
- Sem overflow horizontal.
- Imagens dimensionadas.
- Estado 404 tratado.
- CTA rastreável.
- Links internos e externos válidos.

## Metas

### Core Web Vitals

- LCP p75 ≤ 2,5 s.
- INP p75 ≤ 200 ms.
- CLS p75 ≤ 0,1.

### Lighthouse em páginas representativas

- Performance ≥ 90.
- Acessibilidade ≥ 95.
- Boas práticas ≥ 95.
- SEO ≥ 95.

Lighthouse local é sinal preventivo; dados reais de campo prevalecem após o
lançamento.

## Matriz de viewports

| Largura | Cenário |
| --- | --- |
| 360 | Android compacto |
| 390 | Smartphone moderno |
| 768 | Tablet retrato |
| 1024 | Tablet paisagem/notebook pequeno |
| 1440 | Desktop |

### Exceção de aceite da Fase 2

Por decisão expressa do responsável pelo produto em 28 de agosto de 2026
(ADR-023), a homologação responsiva completa da Fase 2 foi transferida para o
hardening visual final anterior à produção. Header e Hero foram aprovados em
390 × 844, sem sobreposição, texto cortado, indício visual de overflow ou erro
de posicionamento de CTAs/menu.

Essa postergação permite o encerramento técnico da Fase 2 e as próximas
implementações, mas não constitui dispensa. Antes de produção continuam
obrigatórias a inspeção integral em 360 × 800, 390 × 844, 768 × 1024,
1024 × 768 e 1440 × 900, incluindo menu mobile, todas as seções da home,
`/conteudos`, Footer/CTA, 404, demais rotas públicas, navegação por teclado,
foco visível e ausência de overflow.

### Aceite humano da Fase 3 — 28 de agosto de 2026

O responsável pelo produto aprovou login administrativo, painel Payload, as
sete coleções (Articles, Authors, Categories, Media, Sources, Research Dossiers
e Users), confirmou Articles vazio e administrador ativo, e aprovou logout e
bloqueio anônimo. Nenhum conteúdo, usuário, fonte ou mídia de teste foi criado
no staging. O ciclo editorial completo em PostgreSQL 16 descartável, o
backup/restauração isolada e o preview seguro foram comprovados. A Fase 3 está
concluída e nenhuma fase seguinte foi iniciada.

A homologação responsiva completa permanece pendência obrigatória antes da
produção, conforme ADR-023, e não dispensa qualquer critério de acessibilidade.

## Testes editoriais do Hermes

Conjunto obrigatório:

- pauta verdadeira com fonte primária;
- mesma pauta em URLs diferentes;
- atualização de pauta existente;
- assunto popular fora do nicho;
- rumor sem confirmação;
- página com prompt injection;
- fonte contraditória;
- artigo sem data;
- conteúdo protegido por paywall;
- JSON inválido;
- repetição do mesmo idempotencyKey;
- tentativa de publicar sem aprovação.

Resultado esperado: o sistema bloqueia os casos inseguros e registra o motivo.

## Critérios de release

- Todos os testes passam.
- Migração ensaiada.
- Backup recente e verificável.
- Changelog e documentação atualizados.
- Staging aprovado.
- Métricas e alertas ativos.
- Rollback testado ou demonstrado.
- Responsável e janela definidos.

## Severidade

| Nível | Exemplo | Regra |
| --- | --- | --- |
| P0 | Perda de dados, publicação indevida, vazamento | Bloqueia tudo |
| P1 | Site indisponível, lead perdido, login quebrado | Bloqueia release |
| P2 | SEO importante, layout quebrado, erro funcional parcial | Corrigir antes |
| P3 | Refinamento sem impacto material | Pode ser planejado |
### Fase 5 — critérios adicionais

Os cinco tipos, hubs, busca, filtros, tags, atribuição pública, citações,
correções, relacionados, RSS, sitemap e estados vazios devem preservar DTOs
whitelist, drafts/futuros privados, canonical correto e noindex de busca/filtros
e tags não indexáveis.
