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

## ADR-014 — Adoção de Payload 3 + PostgreSQL para a fundação editorial

- Data: 2026-08-24
- Status: aprovada
- Responsável: Crescimento Vertical
- Fases afetadas: 3 (fundação de CMS/banco, antecipada como “Fase 2A” em código)

### Contexto

A base usa Next.js 16.2.9 (App Router) sem CMS ou banco. A arquitetura alvo
(docs/03) prevê Payload + PostgreSQL como fonte de verdade editorial, mas
detalhes de implementação permaneciam abertos: versões dos pacotes, adaptador,
estratégia de migração e papéis.

### Decisão

Adotar **Payload 3.88.0** integrado ao Next.js existente, com adaptador
**`@payloadcms/db-postgres` (PostgreSQL 16)** e editor **Lexical**. Uso de
migrações versionadas com `push: false` (sem `push` automático de schema), tipos
gerados em `src/payload-types.ts`, e papéis `admin`, `editor`, `reviewer`,
`researcher` e `automation`. GraphQL não é utilizado. O armazenamento de mídia
inicial é volume persistente local, evoluindo para S3 compatível (ADR-010).

### Alternativas consideradas

1. MongoDB — rejeitado: a arquitetura alvo e a documentação já determinavam
   PostgreSQL relacional para conteúdo e auditoria.
2. `push` automático de schema em todos os ambientes — rejeitado: migrações
   versionadas são exigidas por docs/07 e docs/12.
3. Dois frontends (site e CMS separados) — rejeitado: duplicaria tipos, layout e
   deploy (ADR-004, docs/03).

### Consequências

#### Positivas

- Fonte de verdade editorial com drafts, versões, controle de acesso e auditoria.
- Permissões aplicadas no servidor; `automation` nunca publica nem administra.
- Migrações versionadas e reproduzíveis em CI com banco efêmero.

#### Negativas e riscos

- Aumenta a superfície de dependências e a complexidade do build (sharp, ESM).
- O primeiro usuário admin e o deploy real ainda não existem (fases seguintes).

### Segurança, SEO, custo e operação

- Segurança: `push: false`, rate limit de login, API com profundidade limitada,
  fontes e dossiês não públicos.
- SEO: `noindex` e `canonicalUrl` no modelo `seo` dos artigos (consumidos nas
  Fases 4/5).
- Custo: nenhum novo serviço gerenciado; PostgreSQL e mídia na VPS atual.
- Operação: scripts `payload`, `generate:types`, `migrate*` documentados.

### Migração e reversão

Adotar via migração inicial `migrations/20260824_191516_initial_foundation`.
Reverter removendo a aplicação e restaurando o backup do baseline (Fase 1);
banco é novo e não contém dados a preservar.

### Critério de validação

`npm ci`, lint, typecheck, 38 testes, `migrate`/`migrate:status`, `generate:types`
e `next build` aprovados em banco PostgreSQL descartável.

### Revalidação formal na Fase 3 — 2026-08-28

O ADR permanece válido com Next.js 16.3.0, React 19.2.7, Payload 3.88.0,
Vitest 4.1.0, Vite 7.3.6 e Sharp 0.35.3 no standalone. A formalização adicionou
preview autenticado e hardening de usuário inativo/limites de edição, sem nova
decisão arquitetural, dependência, migration ou coleção. Por isso não foi
criado novo ADR.

## ADR-015 — DTO público, cache e revalidação do portal editorial

- Data: 2026-08-25
- Status: aprovada
- Responsável: Crescimento Vertical
- Fases afetadas: 4/5/6 (arquitetura pública, portal editorial e SEO técnico,
  antecipadas como "Fase 2B" em código)

### Contexto

A Fase 2A entregou a fundação editorial (Payload + PostgreSQL, workflow e
permissões). Era necessário expor esse conteúdo publicamente sem vazar campos
internos e com controle de cache para não servir conteúdo desatualizado após
publicar/retirar artigos.

### Decisão

1. **DTO público estrito.** Toda leitura pública passa por `src/lib/editorial/`
   (server-only) que converte documentos Payload em DTOs explícitos
   (`mappers.ts`). Nenhum documento Payload completo é enviado a componentes
   client-side; campos de autenticação, auditoria, workflow, e-mail e permissão
   nunca são mapeados. Fontes e dossiês permanecem não públicos.
2. **Leitura defensiva.** Consultas usam `overrideAccess:false`, `draft:false`,
   filtro `_status=published` + `workflowStatus=published` + `publishedAt<=now`
   e revalidação do predicado `isPubliclyReadable` em profundidade.
3. **Cache com revalidação sob demanda.** Consultas usam `unstable_cache` com
   `revalidate` (TTL 300 s) e tags; `revalidateEditorialContent` (hook
   `afterChange` de articles/authors/categories) revalida as tags e os caminhos
   `/`, `/conteudos`, `/conteudos/[slug]`, `/feed.xml` e `/sitemap.xml`. A
   revalidação é melhor esforço. Admin e APIs autenticadas não são cacheados.
4. **Publicação mais estrita.** `heroImage` passa a ser obrigatório e
   `seoTitle`/`seoDescription` respeitam os tetos de 60/160 caracteres na
   publicação.
5. **GraphQL permanece desativado.**

### Alternativas consideradas

1. Expor o documento Payload integralmente e filtrar no cliente — rejeitado:
   vazaria campos internos e violaria a regra de segurança editorial.
2. Usar `push` de schema para o campo `featured` — rejeitado: migrações
   versionadas são obrigatórias (ADR-014, docs/07).
3. Cachear apenas por TTL sem revalidação sob demanda — rejeitado: publicaria
   conteúdo atrasado após publicar/retirar artigos.

### Consequências

#### Positivas

- Fronteira clara entre dados internos e públicos; menor risco de vazamento.
- Conteúdo publicado aparece com cache controlado e invalidação determinística.
- Sitemap/RSS derivam apenas de artigos publicados.

#### Negativas e riscos

- `unstable_cache` e `revalidateTag` são APIs do Next 16 ainda em evolução; a
  revalidação foi encapsulada e é melhor esforço, com TTL como fallback.
- Sitemap/feed limitam-se a 500 artigos por varredura (suficiente para a fase
  atual; revisar antes de escalar).

### Segurança, SEO, custo e operação

- Segurança: sem `overrideAccess:true`, sem GraphQL, links externos sanitizados.
- SEO: canonical, OG, Twitter, JSON-LD, sitemap e RSS; `SITE_NOINDEX` preservado.
- Custo: nenhum novo serviço; cache em memória no processo Next.js.
- Operação: revalidação automática via hooks, sem tarefa manual.

### Migração e reversão

`migrations/20260825_013756_add_article_featured` (adiciona `featured`, com
`down` reversível). Reverter a fase removendo a branch; banco continua novo e
sem dados a preservar.

### Critério de validação

`npm ci`, lint, typecheck, 60 testes, `generate:types`, `generate:importmap`,
`migrate`/`migrate:status` em PostgreSQL descartável, `next build`, `git diff
--check` e auditoria de segredos aprovados.

## ADR-016 — Auditoria e contrato da integração Hermes/n8n (Fase 3A)

- Data: 2026-08-25
- Status: aprovada
- Responsável: Crescimento Vertical
- Fases afetadas: 8/9 (Hermes Agent e n8n/aprovação), antecipadas em sua parte
  de **auditoria e contrato** como "Fase 3A" (documentação, sem integração)

### Contexto

A fundação editorial (2A) e o portal público (2B) estão implantados no staging.
A próxima etapa editorial depende do Hermes (pesquisa/redação) e do n8n
(validação/aprovação/publicação), ambos já operantes na VPS para outros
projetos. Antes de integrar, é necessário (1) auditar o estado real desses
serviços e (2) fixar o contrato de integração que os ligará ao CMS — sem criar
credenciais, skills, workflows ou conteúdo.

### Decisão

1. **Auditar (somente leitura)** o Hermes e o n8n existentes na VPS e registrar
   versões, imagens, redes, montagens e pontos de integração em
   `docs/21-auditoria-integracao-hermes-n8n.md`, sem expor segredos.
2. **Fixar o contrato de integração** em `docs/22-contrato-integracao-hermes-n8n.md`
   e no JSON Schema versionado `docs/schemas/editorial-dossier.v1.schema.json`:
   - webhook autenticado (HMAC-SHA256 sobre corpo bruto + timestamp + versão,
     janela de replay, `Idempotency-Key` única, corpo máximo, schema estrito);
   - dossiê JSON versionado (contrato de saída v1 do Hermes);
   - ciclo `EditorialRun` (CV-01 a CV-04) com o CMS como fonte de verdade;
   - fronteira de permissões: Hermes usa somente a role `automation` (nunca
     publica).
3. **Não integrar** nesta fase: não criar o perfil/skill do Hermes, workflows
   n8n, credenciais de serviço, webhook real ou conteúdo.

### Alternativas consideradas

1. Integrar diretamente (skill + workflows + credenciais) sem auditar nem fixar
   contrato — rejeitado: exporia o ambiente compartilhado a erros de escopo e a
   mudanças de configuração não auditadas.
2. Duplicar o n8n/Hermes com instâncias dedicadas — rejeitado: contraria o
   ADR-013 (reutilizar os serviços existentes com isolamento lógico).

### Consequências

#### Positivas

- Contrato versionado e auditável antes de qualquer código de integração.
- Evidência do estado real dos serviços (versões, redes, limites).
- Reduz retrabalho e risco ao iniciar as Fases 8/9.

#### Negativas e riscos

- A auditoria é um retrato de 2026-08-25; pode divergir se os serviços mudarem
  antes da integração.
- O n8n é compartilhado com outros projetos (webhook próprio já existente), o
  que exige isolamento estrito por segredo/assinatura.

### Segurança, SEO, custo e operação

- Segurança: somente leitura; nenhum segredo registrado; contrato exige HMAC,
  janela de replay e idempotência.
- SEO: sem efeito.
- Custo: nenhum novo serviço.
- Operação: contrato pronto para as Fases 8/9.

### Migração e reversão

Fase apenas documental. Reverter removendo a branch; nenhum dado ou serviço é
alterado.

### Critério de validação

Documentos `docs/21` e `docs/22` e o JSON Schema versionado criados e ligados
ao índice; nenhum contêiner, credencial ou configuração alterado; nenhum segredo
no diff.

## ADR-017 — Transporte e fronteira de credenciais da integração editorial

- Data: 2026-08-25
- Status: aprovada
- Responsável: Crescimento Vertical
- Fases afetadas: 8/9 (Hermes e n8n/aprovação)

### Contexto

A auditoria (docs/21) comprovou, na versão instalada (Hermes v0.20.4), o
mecanismo de perfis (`-p/--profile` define `HERMES_HOME`, perfis em
`/opt/data/profiles/<nome>/`, `terminal.home_mode:profile`) e o modo não
interativo (`-z/--oneshot` + `--usage-file`). Era preciso fixar a fronteira de
credenciais e o método de transporte antes das Fases 8/9.

### Decisão

1. **Hermes nunca terá credencial do Payload.** O Hermes não autentica nem
   escreve no CMS diretamente.
2. **n8n é a única ponte para o Payload** (REST autenticado com a role
   `automation`), recebendo o dossiê via webhook HMAC (docs/22).
3. **`automation` nunca publica** (regra já em código na Fase 2A).
4. **O transporte Hermes → n8n será baseado somente no mecanismo comprovado**:
   execução one-shot (`-z` + `-p` + `--usage-file`), não interativa e sem daemon;
   gateway/API e cron ficam como alternativas a avaliar nas Fases 8/9.
5. **A criação do perfil `crescimento-vertical-editorial` permanece pendente**
   (Fase 8); nenhum perfil foi criado nesta fase.
6. **Limitações registradas**: `-z` auto-bypassa approvals (a skill editorial
   precisa de fail-safe próprio); a saída de conteúdo do `-z` é texto plano (JSON
   estrito apenas em `--usage-file` e `send --json`); imagens `:latest` sem pin.

### Alternativas consideradas

1. Dar credencial de serviço do CMS ao Hermes — rejeitado: violaria o privilégio
   mínimo e o ADR-005 (Hermes não publica).
2. Usar o gateway/API do Hermes como única via — rejeitado: processo persistente
   compartilhado, mais superfície que o one-shot determinístico.

### Consequências

- Positivas: fronteira clara de credenciais; transporte auditável e sem daemon.
- Riscos: one-shot sem approvals exige disciplina da skill; a integração
  depende de a skill emitir JSON válido para o webhook.

### Segurança, SEO, custo e operação

- Segurança: Hermes sem credencial; HMAC no webhook; `automation` sem publicação.
- SEO: sem efeito.
- Custo: nenhum novo serviço; one-shot sob demanda.
- Operação: contrato pronto para as Fases 8/9.

### Migração e reversão

Documental. Reverter removendo a branch; nenhum serviço alterado.

### Critério de validação

Schemas `editorial-dossier.v1`, `source-record.v1` e `article-draft.v1`
validados com Draft 2020-12 (válidos aceitos, inválidos rejeitados); nenhum
perfil criado; nenhum gateway reiniciado; nenhum workflow/credencial criado.

## ADR-018 — Runner editorial isolado com execução desabilitada

- Data: 2026-08-25
- Status: aprovada
- Responsável: Crescimento Vertical
- Fases afetadas: 8/9 (ponte Hermes → n8n), antecipada como "Fase 3B" (código
  + perfil, sem integração)

### Contexto

Era preciso uma ponte controlada entre o n8n e o Hermes, mantendo o Hermes sem
credencial do Payload e sem acesso a Docker Socket/PostgreSQL. O Hermes
existente é compartilhado e seu gateway (PID 153) não pode ser alterado.

### Decisão

1. **Perfil isolado** `crescimento-vertical-editorial` via distribuição
   versionada (`hermes/crescimento-vertical-editorial/`), com `toolsets: [web]`,
   `terminal.home_mode: profile`, sem credencial de modelo e sem gateway/cron.
2. **Runner HTTP interno** (`services/hermes-editorial-runner/`) com HMAC-SHA256,
   nonce anti-replay, janela de 300 s, corpo ≤ 1 MiB e validação Draft 2020-12.
3. **Execução desabilitada por dupla trava**: `RUNNER_EXECUTION_ENABLED=false`
   e ausência de `/run/secrets/execution-enable`. O endpoint `/v1/jobs` devolve
   `503 execution_disabled`; nenhum subprocesso Hermes é iniciado.
4. **Container** `cv-hermes-editorial-runner` isolado (sem `ports`, sem Traefik,
   sem Docker Socket, `read_only`, `cap_drop ALL`, non-root, limites de
   CPU/memória/pids).

### Alternativas consideradas

1. Dar ao Hermes acesso direto ao Payload via webhook — rejeitado (viola o
   ADR-017: n8n é a única ponte).
2. Usar o gateway do Hermes como executor — rejeitado: processo persistente
   compartilhado, mais superfície que o one-shot.

### Consequências

- Positivas: fronteira auditável e determinística; Hermes sem credencial;
  execução desligada por padrão.
- Riscos: `-z` auto-bypassa approvals (a skill precisa de fail-safe próprio);
  imagens `:latest` sem pin; segredo HMAC em bind mount legível pelo runner.

### Segurança, SEO, custo e operação

- Segurança: HMAC + nonce + janela; sem sockets privilegiados; sem segredos em
  log.
- SEO: sem efeito.
- Custo: um container leve (~24 MiB residente) com limites.
- Operação: execução futura exige as duas travas simultaneamente.

### Migração e reversão

Perfil criado via `hermes profile install` (sem clone, sem alias, sem gateway).
Rollback (docs/25): parar/remover `cv-hermes-editorial-runner`, preservar o
volume `runner-state`; remover o perfil apenas por comando explícito futuro.

### Critério de validação

32 testes do runner aprovados; 4 schemas Draft 2020-12 válidos; build da imagem
e `docker compose config` aprovados; container `healthy`; smoke tests 200/401/
503/404; IDs dos 7 contêineres preservados.

## ADR-019 — Conector seguro n8n ↔ Hermes (validate-only)

- Data: 2026-08-25
- Status: aprovada
- Responsável: Crescimento Vertical
- Fases afetadas: 9 (ponte n8n → Hermes), antecipada como "Fase 3C"
  (conectividade, sem execução)

### Contexto

Era preciso ligar o n8n ao runner editorial do Hermes mantendo a execução
desabilitada e o Hermes sem credencial do Payload. O n8n é compartilhado e não
pode ser atualizado nem ter Traefik/portas/volumes alterados.

### Decisão

1. **Node privado** `n8n-nodes-crescimento-vertical` (TypeScript, sem
   dependências nativas) com a credencial `crescimentoVerticalHermesApi`
   (`runnerBaseUrl` restrito a `http://cv-hermes-editorial-runner:8100` +
   `hmacSecret` password) e o node `hermesEditorial` (health, validate, createJob,
   getJob).
2. **Imagem customizada** `cv-n8n-hermes-connector` construída a partir do
   digest exato do n8n em execução, carregando o node via
   `N8N_CUSTOM_EXTENSIONS=/opt/n8n-custom`.
3. **Autenticação HMAC-SHA256** com nonce anti-replay, janela de 300 s, corpo
   ≤ 1 MiB; sem retry automático em 401/409/validação; segredo nunca exposto.
4. **Execução desabilitada**: `createJob` devolve `503 execution_disabled`; o
   workflow de conectividade é INATIVO e executado uma única vez.

### Alternativas consideradas

1. Executar a pesquisa real nesta fase — rejeitado: violaria a dupla trava da
   Fase 3B e exigiria credencial de modelo.
2. Usar Code node/Execute Command para assinar — rejeitado: exporia o segredo e
   quebraria a auditoria (nenhum Code/Execute Command no workflow).

### Consequências

- Positivas: conectividade HMAC auditável; node versionado e testado; credencial
  criptografada em repouso.
- Riscos: node customizado aparece na auditoria ("Custom nodes"); n8n `:latest`
  sem pin persistente (resolvido para digest nesta fase).

### Segurança, SEO, custo e operação

- Segurança: HMAC + nonce; sem Docker Socket/Payload; sem porta pública.
- SEO: sem efeito.
- Custo: nenhum serviço novo (apenas imagem derivada do n8n existente).
- Operação: rollback documentado (docs/27).

### Migração e reversão

Reverter restaurando `image: docker.n8n.io/n8nio/n8n` no Compose persistente e
recriando o n8n; volume e SQLite restauram a partir do backup pré-recreate.

### Critério de validação

34 testes do node; 4 schemas Draft 2020-12; CI `n8n-hermes-connector` aprovado;
workflow validate-only executado (health 200, validate 200, createJob 503,
getJob 404); IDs dos 7 contêineres preservados (somente o n8n recriado).

## ADR-020 — Hardening do repositório público

- Data: 2026-08-25
- Status: aprovada
- Responsável: Crescimento Vertical
- Fases afetadas: controle transversal pós-Fase 3C; nenhuma fase funcional iniciada

### Contexto

Com o repositório público, alterações diretas na `main`, actions referenciadas
por tags mutáveis e ausência de varredura integral de segredos aumentam o risco
de supply chain e exposição histórica.

### Decisão

1. Exigir pull request e quatro checks reais para a `main`, com base atualizada,
   conversas resolvidas e regras aplicadas ao administrador.
2. Bloquear force-push e exclusão da `main`, sem exigir aprovação adicional em
   repositório de proprietário único.
3. Executar Gitleaks sobre todo o histórico em PRs e pushes da `main`, sem
   allowlist ampla; as duas fixtures históricas confirmadas usam somente
   fingerprints exatos em `.gitleaksignore`.
4. Fixar actions externas por SHA completo, desabilitar persistência de
   credenciais no checkout e limitar permissões a `contents: read`.
5. Preservar evidências em backup documental sem segredos.

### Alternativas consideradas

1. Confiar apenas na revisão manual — rejeitada por não cobrir histórico nem
   impedir alteração direta.
2. Usar tags de versão das actions — rejeitada por serem referências mutáveis.
3. Ignorar fixtures ou diretórios amplos no Gitleaks — rejeitada por reduzir a
   cobertura e poder ocultar segredo real.

### Consequências e reversão

O merge passa a depender dos quatro checks e da disponibilidade do GitHub
Actions. Falsos positivos exigem exceção estreita e documentada. Se uma regra
impedir o fluxo legítimo, a correção ocorre por novo PR e ajuste auditável da
proteção, sem admin bypass e sem retirar o Gitleaks. Não há deploy nem alteração
do runtime da VPS.

### Critério de validação

PR e CI do merge aprovados; quatro checks verdes também na `main`; proteção
relida pela API com PR, strict, enforce_admins, conversas, force-push e exclusão
nos estados definidos; bundle e evidências verificadas por SHA-256.

## ADR-021 — Reconciliação dos gates formais e início da Fase 2

- Data: 2026-08-26
- Status: aprovada
- Responsável: Crescimento Vertical
- Fases afetadas: 1 e 2; preserva as antecipações 2A–3C

### Contexto e decisão

A execução antecipou capacidades editoriais e de integração antes de fechar
documentalmente todos os itens do gate sequencial da Fase 1. A reauditoria
comprovou base reproduzível, staging protegido, canal operacional, baseline
visual, backup e rollback. A Fase 1 fica concluída e a Fase 2 passa a ser a
única fase em execução. As entregas 2A, 2B, 3A, 3B e 3C continuam válidas,
mas não concluem automaticamente qualquer gate formal posterior.

### Consequências, validação e reversão

A Fase 2 pode organizar o layout público, design system, acessibilidade e testes
sem criar páginas comerciais ou habilitar integrações. O apex/www continuam
na infraestrutura anterior; staging é o único destino de implantação desta
fase. A validação exige CI, viewports, backup e rollback antes da homologação.
Reverter por novo commit documental que reabra o item de gate cuja evidência
deixar de ser verdadeira; nenhuma reversão autoriza alterar produção.

### Dependências de teste

Os testes de interação do menu e foco usarão Testing Library com ambiente
jsdom, em versões exatas no `package-lock.json`. A adição é limitada a
devDependencies e evita implementar um simulador DOM próprio ou adicionar uma
segunda ferramenta de testes; Vitest permanece como runner único.

## ADR-022 — Constituição operacional e protocolo obrigatório de execução

- Data: 2026-08-27
- Status: aprovada
- Responsável: Crescimento Vertical
- Fases afetadas: controle transversal; nenhuma fase iniciada

### Contexto

As regras permanentes do produto e da operação estavam distribuídas entre
prompts, documentos técnicos e histórico de execução. Era necessário criar uma
fonte normativa estável sem mover para ela o estado efêmero do projeto nem o
inventário privado da infraestrutura.

### Decisão

1. Manter `CONSTITUICAO-DO-PROJETO.md` na raiz como norma operacional
   permanente.
2. Manter `AGENTS.md` como porta automática de entrada para pessoas, agentes de
   IA e automações.
3. Exigir leitura integral dos documentos obrigatórios antes das execuções e um
   preflight curto que confronte escopo, fase, riscos e evidências atuais.
4. Conceder autonomia dentro do escopo autorizado e fazer perguntas somente
   diante das condições de parada registradas.
5. Manter o estado dinâmico no Roteiro Mestre, em docs/10, docs/15, no Git e no
   CI.
6. Manter o inventário operacional detalhado fora do Git público.

### Alternativas rejeitadas

1. Repetir todo o memorial em cada prompt — aumenta ruído e risco de versões
   divergentes.
2. Depender apenas da memória da conversa — não oferece persistência nem
   rastreabilidade.
3. Colocar estado efêmero em `AGENTS.md` — tornaria a porta de entrada obsoleta
   a cada execução.
4. Permitir que cada agente redefina o processo — reduziria consistência,
   segurança e auditabilidade.

### Consequências e reversão

Execuções passam a ter um protocolo comum e verificável, sem publicar detalhes
operacionais. Qualquer mudança material desta decisão exige novo registro; uma
reversão documental não autoriza alterar runtime, dados ou fases.

## ADR-023 — Postergação da homologação responsiva completa

- Data: 2026-08-28
- Status: aprovada
- Responsável: responsável pelo produto
- Fases afetadas: fechamento da Fase 2 e gate obrigatório pré-produção

### Contexto e decisão

O responsável pelo produto decidiu expressamente manter a continuidade das
implementações e transferir a homologação responsiva completa para o hardening
visual final anterior à produção. A evidência humana disponível aprovou Header
e Hero em 390 × 844, sem sobreposição, texto cortado, indício visual de overflow
ou posicionamento incorreto de CTAs e menu.

A Fase 2 pode ser tecnicamente encerrada e as próximas implementações não ficam
bloqueadas por essa postergação. A homologação completa, contudo, permanece
pendência obrigatória e bloqueio de produção. É proibido declarar o produto
pronto para produção sem validar 360 × 800, 390 × 844, 768 × 1024, 1024 × 768 e
1440 × 900, incluindo menu mobile, seções da home, `/conteudos`, Footer/CTA,
404, demais rotas públicas, navegação por teclado, foco e overflow.

### Consequências e limites

A decisão não dispensa qualquer critério de acessibilidade e não declara a
homologação responsiva concluída. Também não altera código, dependências,
migrations, schemas, configuração ou runtime; staging e produção permanecem
inalterados. Se o gate não for integralmente aprovado no hardening visual final,
a produção continua bloqueada até correção e nova validação.

## ADR-024 — Catálogo comercial consolidado em seis pilares

- Data: 2026-08-28
- Status: aprovada
- Responsável: responsável pelo produto
- Fase afetada: Fase 4 — Arquitetura pública e páginas comerciais

### Decisão

Adotar um único catálogo comercial com seis pilares e rotas canônicas:

1. Sites e landing pages — `/solucoes/sites-e-landing-pages`
2. Tráfego e conversão — `/solucoes/trafego-e-conversao`
3. Automação de WhatsApp — `/solucoes/automacao-whatsapp`
4. Agentes de IA — `/solucoes/agentes-de-ia`
5. Integrações n8n — `/solucoes/integracoes-n8n`
6. Consultoria e suporte — `/solucoes/consultoria-e-suporte`

A visão consolidada usa `/solucoes`. A decisão substitui os oito cards locais e
a lista provisória de cinco soluções de docs/04. O mapeamento é: Sites de alta
conversão + Landing pages → Sites e landing pages; Tráfego pago + Funis de venda
+ Otimização de conversão → Tráfego e conversão; Automação inteligente focada
em atendimento → Automação de WhatsApp; Criativos com IA + agentes
especializados → Agentes de IA; Automações e orquestrações técnicas →
Integrações n8n; Consultoria digital + monitoramento recorrente → Consultoria e
suporte.

Não serão inventados preços, cases, métricas, depoimentos ou resultados. O
impacto é a navegação única, os modelos `services`/`cases`, DTOs públicos,
metadados e CTAs contextuais da Fase 4. Produção não é alterada.

## ADR-025 — Separação entre identidade operacional e atribuição editorial pública

- Data: 2026-08-28
- Status: aprovada
- Responsável: responsável pelo produto
- Fase afetada: Fase 5 — Portal editorial e experiência de leitura

### Decisão

A identidade do usuário Payload continua responsável por aprovação, publicação
e auditoria operacional, mas a atribuição exibida ao público usa exclusivamente
um perfil seguro da coleção `authors`. Artigos publicados exigem revisor público;
rascunhos podem não ter revisor. Usuários, e-mails, roles, sessões, IDs
administrativos, dossiês, notas e dados de coleta nunca entram nos DTOs públicos.

Fontes permanecem privadas. No momento da publicação, o artigo recebe snapshot
imutável de citações somente de fontes verificadas com URL HTTPS, título,
publisher, autor opcional, data, acesso e tipo. Alterações posteriores em Sources
não reescrevem artigo publicado; correções exigem nova versão e histórico.

### Consequências e reversão

O modelo editorial ganha atribuição pública segura e rastreabilidade histórica
sem misturar autenticação com identidade editorial. A reversão restaura a versão
anterior via backup/migration aprovada; não autoriza expor fontes ou usuários.

## Decisões operacionais pendentes

## ADR-026 — Ativação externa condicionada ao lançamento

- Data: 2026-08-29
- Status: aprovada
- Fase afetada: 6, com ativação operacional posterior
- Decisão: Search Console e analytics só podem ser ativados no lançamento,
  com credenciais reais e, para analytics, consentimento adequado. Staging não
  coleta dados. Nenhum token, Measurement ID ou código de verificação é
  inventado; nenhum script é emitido por padrão.
- Motivo: preparar descoberta e mensuração sem antecipar a Fase 7, expor dados
  pessoais ou criar uma integração externa incompleta.
- Consequências: sitemap e metadata ficam prontos para cadastro manual futuro;
  verificação de propriedade, consentimento e coleta permanecem gates externos.
- Reversão: remover eventual configuração externa e manter a aplicação sem
  adaptador/script, que é o estado seguro padrão.

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

## ADR-029 — Execução editorial controlada, credencial isolada e fail-closed do Hermes

- Data: 2026-08-30
- Status: aprovada para implementação controlada; execução real bloqueada
- Fase afetada: 8
- Decisão: o perfil `crescimento-vertical-editorial` deve usar credencial
  exclusiva própria e o runner é a única fronteira de execução. Jobs são
  one-shot, sem shell, com comando interno, saída somente por schema, estado
  mínimo persistente, idempotência, lock de concorrência, usage file obrigatório,
  limites de 40 turnos/10 buscas/8 fontes, timeout e fail-closed. Nenhuma
  publicação, Payload ou banco editorial é permitida.
- Operação: n8n continua somente validate-only e será orquestrador futuro da
  Fase 9. Agenda é declarada apenas documentalmente; cron, gateway, webhook e
  workflow ativo permanecem proibidos. Dupla trava e janela temporária só podem
  existir após CI verde, validação de credencial exclusiva e aceite específico.
- Segurança: fontes externas são dados não confiáveis; prompt injection,
  escopo fora dos cinco pilares, URLs inseguras e evidência insuficiente são
  recusados. Credenciais compartilhadas (incluindo o default/global) nunca são
  copiadas ou reutilizadas.
- Consequências: o preflight atual é classificação B; toda bateria real fica
  bloqueada até provisionar e autorizar uma credencial isolada. O runner volta
  sempre a desabilitado após qualquer janela de teste.
- Reversão: desabilitar a flag e remover o arquivo de habilitação, recriar
  somente o runner candidato com a imagem anterior, preservar o volume de estado
  para auditoria sanitizada e manter produção, portal, PostgreSQL, n8n e Hermes
  compartilhado intactos.

## ADR-027 — Captação first-party, consentimento versionado e entrega por outbox

- Data: 2026-08-29
- Status: aprovada para a Fase 7
- Decisão: Payload/PostgreSQL é a fonte de verdade; o formulário usa endpoint
  dedicado e schema estrito, sem escrita pública genérica no Payload. O
  consentimento é explícito, separado de marketing e versionado. Dados são
  minimizados, normalizados e protegidos por idempotência, honeypot, token HMAC,
  limites e allowlist de origem. A entrega comercial usa outbox transacional
  desacoplada. Logs não contêm PII; métricas first-party não identificam pessoas;
  GA4 permanece desativado.
- Notificação: sem credencial/provedor autorizado no preflight, o outbox fica
  pendente e nenhum n8n/Hermes/Telegram/WhatsApp é usado como atalho.
- Retenção: `retentionUntil` inicial de 180 dias; exclusão/anonimização manual,
  dry-run, lote limitado e trilha mínima.
- Motivo: permitir captação segura e auditável sem antecipar contratação de
  provedor externo, consentimento da Fase 7 posterior ou automação da Fase 9.
- Consequências: leads não são públicos, automation não tem acesso e o fluxo
  pode ser homologado sem envio externo; a entrega comercial permanece pendente.
- Reversão: desabilitar o endpoint, restaurar imagem/migration anterior via
  backup e manter os dados sob acesso administrativo restrito.

## ADR-028 — Hostinger SMTP como transporte da notificação comercial da Fase 7

- Data: 2026-08-30
- Status: aprovada para staging
- Decisão: `LeadOutbox` permanece a fonte de verdade e SMTP é somente o
  transporte. Hostinger usa `smtp.hostinger.com:465`, TLS implícito obrigatório,
  remetente e destinatário fixos. A senha é lida apenas do arquivo montado em
  `/run/secrets/lead_smtp_password`; não é variável, argumento, imagem ou log.
- Conteúdo: aviso mínimo com data/hora, UUID interno e link HTTPS ao registro no
  Payload Admin. O link exige BasicAuth, autenticação Payload e autorização de
  leitura de Leads. Não há PII, anexos, scripts, pixel ou token mágico.
- Entrega: claim atômico com `FOR UPDATE SKIP LOCKED`, lease recuperável, lotes
  pequenos, até cinco tentativas e backoff exponencial limitado. O Message-ID é
  estável e derivado do UUID do outbox, sem segredo ou PII. A entrega SMTP é
  tecnicamente at-least-once; Message-ID estável reduz duplicações sem prometer
  exactly-once após falha entre aceite remoto e persistência local.
- Falhas: SMTP ausente ou indisponível nunca apaga/rejeita o lead aceito;
  mantém o outbox pendente enquanto houver retry. A automação recorrente será
  reconciliada na Fase 11. n8n e Hermes não participam.
- Reversão: desabilitar `LEAD_NOTIFICATION_ENABLED`, restaurar a imagem anterior
  e manter lead/outbox no PostgreSQL. Rotacionar/revogar a senha na Hostinger e
  substituir somente o arquivo protegido quando necessário.

## ADR-030 — DeepSeek V4 Flash como candidato de inferência editorial

- Data: 2026-08-31; reconciliada em 2026-09-01
- Status: aprovada para implementação local; homologação real bloqueada
- Fase afetada: 8
- Decisão: substituir o candidato OpenAI do perfil editorial por `deepseek`
  com o modelo oficial `deepseek-v4-flash`, Chat Completions, thinking
  desabilitado (`none`), saída máxima de 4096 tokens e nenhum fallback. A
  chave exclusiva será montada como arquivo somente no runner e convertida em
  `DEEPSEEK_API_KEY` apenas no ambiente do subprocesso one-shot.
- Compatibilidade: Hermes v0.20.4 possui provider DeepSeek nativo, preserva e
  reenvia `reasoning_content` nas chamadas com ferramentas, normaliza usage e
  aceita timeout/max_tokens. A documentação oficial confirma modelo, endpoint,
  tool calls e thinking/non-thinking. A pesquisa web permanece separada.
- Limites: nenhuma chamada autenticada, credencial, instalação, atualização do
  Hermes, runtime, Ollama, n8n, Payload, PostgreSQL, deploy ou Fase 9 nesta
  execução. A chave OpenAI existente permanece intocada.
- Reconciliação: no máximo 4 jobs, serial, 8 turnos, 3 pesquisas, 4 fontes,
  300 s e stdout de 256 KiB por job. Há reserva persistente de US$ 0,50/job e
  guardrail de US$ 2; não é teto rígido, pois uma chamada já iniciada pode
  ultrapassar o saldo local.
- Alternativas rejeitadas: provider genérico OpenAI-compatible, por ocultar
  regras de thinking; fallback OpenAI/pago, por violar controle de custo e
  isolamento; atualização do Hermes, desnecessária na versão instalada.
- Reversão: reverter somente esta mudança de branch/configuração; como o
  runtime não é recriado e a execução permanece desabilitada, não há migração
  de dados nem rollback operacional.

## ADR-031 — Isolamento de egress da janela pré-run editorial

- Data: 2026-09-01
- Status: implantada como candidata; bateria bloqueada
- Fase afetada: 8
- Decisão: manter o runner somente em rede Docker `internal` e encaminhar HTTPS
  por proxy CONNECT mínimo, deny-by-default, que sozinho participa da rede de
  saída. A allowlist contém somente DeepSeek e Tavily em 443; IP literal,
  outras portas/hosts e resolução não pública são recusados. Não se denomina
  firewall absoluto.
- Segredos: mounts individuais read-only, UID 0/GID 10000/mode 0640, valores
  ausentes de env, inspect, imagem, argumentos e logs. OpenAI não é montado.
- Persistência: `/opt/data` efetivo em tmpfs limitado; somente `/state`
  persiste. O volume anterior é preservado para rollback e não recebe escrita.
- Evidência: egress direto bloqueado; DeepSeek `GET /models` e Tavily
  `GET /usage` retornaram 200 uma única vez, sem inferência/pesquisa. Dupla
  trava fechada e zero jobs.
- Reversão: usar o bundle, state e referência de imagem do backup pré-run;
  recriar somente o runner anterior, sem tocar nas demais aplicações.

### Adendo operacional — propriedade persistente de `/state`

- Causa: o volume nomeado foi criado com raiz `root:root 0755`; o runner
  não-root (10000:10000) não conseguia inicializar SQLite/guardrail.
- Correção: volume real `10000:10000 0700`, arquivos 0600; imagem cria `/state`
  previamente com esses metadados e o processo aplica umask 0077.
- Evidência: integrity/WAL/transações, guardrail, idempotência/conflito,
  concorrência, recriação e rollback em volume temporário aprovados sem rede.

### Adendo operacional — neutralização do `VOLUME /opt/data`

- Causa: a recriação preservou o volume anônimo herdado, mantendo-o junto da
  entrada em `HostConfig.Tmpfs`; o mount de volume prevaleceu no container.
- Correção: container realmente novo e tmpfs explícito com 16 MiB,
  `rw,nosuid,nodev,noexec`, modo 0700 e UID/GID 10000.
- Persistência: somente `/state`; o volume anônimo anterior permanece órfão e
  preservado até autorização humana específica para removê-lo.
