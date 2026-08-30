# Roteiro Mestre de Construção

Este é o plano oficial da transformação da landing page Crescimento Vertical em
um portal editorial e comercial orientado à geração de receita.

## Princípios de execução

1. Construção definitiva por camadas, sem “MVP descartável”.
2. Produção preservada até a nova estrutura estar validada em staging.
3. Cada fase entrega uma capacidade completa e verificável.
4. Arquitetura, conteúdo e monetização evoluem juntas, mas com responsabilidades
   separadas.
5. Hermes opera com privilégio mínimo e aprovação humana.
6. Qualidade, segurança, SEO e observabilidade são critérios de aceite, não
   melhorias opcionais.

## Ordem obrigatória

| Fase | Entrega | Dependência | Estado |
| --- | --- | --- | --- |
| 0 | Governança, auditoria e documentação | Nenhuma | Concluída |
| 1 | Baseline técnico e segurança de implantação | Fase 0 | Concluída |
| 2 | Fundação do portal e design system | Fase 1 | Concluída |
| 3 | Payload CMS, PostgreSQL e autenticação | Fase 2 | Concluída |
| 4 | Arquitetura pública e páginas comerciais | Fase 3 | Concluída com ressalva |
| 5 | Portal editorial e experiência de leitura | Fase 4 | Concluída |
| 6 | SEO técnico, dados estruturados e performance | Fase 5 | Concluída |
| 7 | Captação, diagnóstico e mensuração comercial | Fase 6 | Concluída |
| 8 | Hermes Agent e política editorial automatizada | Fase 7 | Pendente |
| 9 | n8n, Telegram, aprovação e publicação | Fase 8 | Pendente |
| 10 | Conteúdo inicial e validação editorial | Fase 9 | Pendente |
| 11 | Segurança, observabilidade, backup e recuperação | Fase 10 | Pendente |
| 12 | Migração, lançamento e estabilização | Fase 11 | Pendente |

Somente uma fase pode permanecer “em execução”. Exceções precisam de decisão
registrada.

A Fase 3 foi iniciada formalmente em 28 de agosto de 2026, a partir da `main`
`d0f7b33f19dc00a8053aa8c0f42359a417182ee0`, e concluída após o aceite humano
expresso do responsável pelo produto. Foram reconciliadas e comprovadas as
capacidades antecipadas na Fase 2A e completadas somente lacunas reais de CMS,
PostgreSQL e autenticação. Nenhuma fase posterior está em execução.

A homologação responsiva completa foi transferida, por decisão expressa do
responsável pelo produto (ADR-023), para o hardening visual final. A pendência
não bloqueia a Fase 3 nem as próximas implementações, mas permanece gate
obrigatório pré-produção e não pode ser declarada concluída sem os cinco
viewports e os critérios de acessibilidade.

As antecipações aprovadas 2A, 2B, 3A, 3B e 3C permanecem entregues e
preservadas. Elas adicionaram capacidades de fases posteriores, mas não
substituem automaticamente os gates sequenciais das Fases 1, 2 e seguintes.
A reconciliação do roteiro está registrada no ADR-021.

A Fase 4 foi iniciada em 28 de agosto de 2026 a partir do merge commit
`2be72e3815a908feabee9e5e9e34e534b77b61f7` e encerrada com aceite humano com
ressalva em 28 de agosto de 2026. Arquitetura, rotas, navegação e catálogo foram
aprovados; o conteúdo comercial foi aceito provisoriamente, pois parte dos
textos ainda está abstrata. A rodada obrigatória de concretização deve tornar a
comunicação mais clara, específica e persuasiva, ligada a problemas reais,
entregáveis, diferenciais, processo, limites e CTAs, sem inventar resultados,
clientes, métricas ou garantias. Essa melhoria não bloqueia a Fase 5, mas bloqueia
produção. As Fases 5 a 12 permanecem pendentes.

## Gates obrigatórios pré-produção

1. Homologação responsiva integral nos cinco viewports, incluindo teclado, foco,
   overflow e todas as rotas públicas.
2. Concretização dos textos comerciais da Fase 4, com revisão de clareza,
   especificidade, problemas atendidos, entregáveis, diferenciais, processo,
   limites e CTAs.

Nenhum dos dois gates pode ser declarado concluído por este encerramento.

A Fase 7 foi concluída em 30 de agosto de 2026 após aceite humano expresso do
formulário claro, envio real, mensagem de sucesso, captação consentida e
idempotente de um único lead, outbox único e notificação comercial mínima
recebida via Hostinger SMTP. O primeiro envio falhou antes de persistir porque
campos canônicos de consentimento foram removidos indevidamente; a correção foi
coberta por testes e o segundo envio — único envio válido — comprovou o fluxo
atômico completo. Produção, n8n e Hermes foram preservados; GA4 e Search Console
seguem desativados. As Fases 0–7 estão concluídas, as Fases 8–12 permanecem
pendentes e nenhuma fase está em execução. Os dois gates pré-produção acima
continuam bloqueando produção.

A Fase 6 foi iniciada e concluída em 29 de agosto de 2026 após aceite humano
expresso. O aceite cobriu SEO técnico, metadata, canonicals, Open Graph, Twitter,
sitemap, robots, indexação, dados estruturados, imagens, cache, performance e a
Hero com o painel tecnológico restaurado via `background-image` WebP otimizado.
O WebP tem 114.140 bytes, redução aproximada de 93% sobre o PNG. O PR #12 e o
CI foram aprovados e o staging permaneceu saudável. Search Console e GA4 seguem
desativados; produção, n8n e Hermes foram preservados. Nenhuma fase está em
execução e as Fases 7–12 permanecem pendentes.

Este encerramento preserva os dois gates pré-produção: homologação responsiva
integral nos cinco viewports e concretização da copy comercial da Fase 4. A
aprovação da Fase 6 não os conclui nem autoriza produção.

A Fase 5 foi iniciada em 28 de agosto de 2026 a partir da `main`
`e153f50f9591cf74f804d57a0e213acad463fd17` e concluída após aceite humano em
29 de agosto de 2026. Os hubs vazios, busca, filtros, políticas editoriais,
novos campos administrativos, ausência de conteúdo fictício, páginas comerciais
e a navegação hierárquica corrigida foram aprovados. As antecipações 2A, 2B,
3A, 3B e 3C e as ressalvas da Fase 4 permanecem preservadas; nenhuma fase está
em execução e as Fases 6 a 12 permanecem pendentes.

## Fase 0 — Governança, auditoria e documentação

### Entregas

- Inventário da aplicação e infraestrutura declarada no repositório.
- Visão do produto, escopo e arquitetura alvo.
- Arquitetura de informação, modelo editorial e taxonomia.
- Responsabilidade do Hermes, n8n, CMS e site.
- Plano de qualidade, segurança, monetização e operação.
- Regras obrigatórias em AGENTS.md.

### Critério de saída

- Todos os documentos do índice existem, estão ligados entre si e não apresentam
  contradições conhecidas.

## Fase 1 — Baseline técnico e segurança de implantação

### Atividades

1. Confirmar estado real da VPS, Docker, Traefik, DNS e certificados.
2. Registrar versões reais e variáveis necessárias, sem copiar segredos.
3. Fazer backup do repositório implantado, configuração e ativos persistentes.
4. Confirmar commit atualmente em produção.
5. Executar npm ci, lint e build na base sem alterações.
6. Capturar baseline visual da home em desktop e mobile.
7. Corrigir imediatamente contatos fictícios antes de qualquer campanha.
8. Criar branch de evolução do portal.
9. Definir ambiente staging protegido por autenticação e noindex.
10. Criar healthcheck da aplicação e procedimento inicial de rollback.

### Critério de saída

- Base reproduzível, commit de produção conhecido, backup restaurável, staging
  acessível somente aos responsáveis e build atual aprovado.

## Fase 2 — Fundação do portal e design system

### Atividades

1. Organizar rotas com grupos públicos, editoriais e administrativos.
2. Consolidar tokens de cor, espaçamento, tipografia, borda e elevação.
3. Separar componentes de layout, navegação, cards, CTAs e conteúdo.
4. Transformar links por âncora em navegação compatível com páginas reais.
5. Criar header e footer definitivos com menus desktop e mobile.
6. Implantar breadcrumbs, estados de foco e padrões de formulário.
7. Preparar contratos TypeScript para conteúdo e serviços.
8. Implantar testes unitários e de componentes básicos.

### Critério de saída

- Estrutura pública navegável com design consistente, sem regressão da landing
  page e aprovada nos viewports obrigatórios.

### Fechamento técnico — 28 de agosto de 2026

A Fase 2 foi aceita tecnicamente no candidato de staging do HEAD `575e232`,
saudável, com PR #8 e seus quatro checks aprovados. A evidência humana parcial
aprovou Header e Hero em 390 × 844 sem sobreposição, corte, indício de overflow
ou posicionamento incorreto de CTA/menu. Conforme ADR-023, a homologação
responsiva completa foi postergada para o hardening visual final anterior à
produção. Essa postergação não dispensa acessibilidade e bloqueia produção até
a validação integral dos cinco viewports e das rotas públicas aplicáveis.

## Fase 3 — Payload CMS, PostgreSQL e autenticação

### Atividades

1. Integrar Payload ao Next.js existente.
2. Adicionar PostgreSQL com migrações versionadas.
3. Criar coleções e globals definidos em docs/07-cms-dados-e-apis.md.
4. Implantar roles admin, editor, reviewer, researcher e automation.
5. Ativar versões, drafts e preview.
6. Configurar armazenamento persistente de mídia.
7. Implementar seed apenas estrutural: categorias, serviços, CTAs e configurações.
8. Criar backup e teste de restauração do banco.
9. Impedir leitura pública de qualquer documento não publicado.

### Critério de saída

- Administrador consegue criar, revisar, visualizar e publicar um artigo em
  staging; visitante nunca acessa rascunhos; restauração do banco é comprovada.

### Execução formal — 28 de agosto de 2026

A auditoria formal preservou as sete coleções e os cinco papéis entregues pela
Fase 2A. As lacunas reais completadas foram preview editorial autenticado,
bloqueio de login e acesso para usuário inativo, restrição de edição de artigos
publicados por `editor`/`automation` e prova automatizada de ciclo editorial,
mídia, backup e restauração em PostgreSQL 16 descartável. Nenhuma coleção de
fase futura foi antecipada. O fechamento permanece condicionado ao CI, staging
e aceite humano no `/admin`; a Fase 4 não foi iniciada.

### Aceite humano e encerramento — 28 de agosto de 2026

O responsável pelo produto aprovou login administrativo, painel Payload, as
sete coleções (Articles, Authors, Categories, Media, Sources, Research Dossiers
e Users), confirmou Articles vazio e administrador ativo, e aprovou logout e
bloqueio anônimo. Nenhum conteúdo, usuário, fonte ou mídia de teste foi criado
no staging. O ciclo editorial, o backup/restauração isolada em PostgreSQL 16
descartável e o preview seguro foram comprovados.

A Fase 3 está concluída. As Fases 4 a 12 permanecem pendentes e nenhuma fase
está em execução. A homologação responsiva completa do ADR-023 continua
pendência obrigatória e gate de produção, sem dispensa de acessibilidade.

## Fase 2A — Fundação editorial (implementada em código)

Antecipação aprovada da fundação de código da Fase 3, sem deploy. Detalhes em
[docs/17-fundacao-editorial-payload.md](docs/17-fundacao-editorial-payload.md) e
[ADR-014](docs/14-registro-decisoes.md).

### Entregas implementadas em código

- Payload 3.88.0 integrado ao Next.js existente (`/admin`, `/api`, `withPayload`).
- PostgreSQL 16 dedicado com migrações versionadas (`push` desativado).
- Coleções: users, authors, categories, media, sources, research-dossiers e
  articles, com drafts/versões.
- Roles admin, editor, reviewer, researcher e automation com acesso no servidor.
- Workflow editorial (draft → in_review → approved → published → archived) com
  transições bloqueadas no servidor e publicação exigindo fonte validada.
- Tipos gerados, migration inicial, Dockerfile (sharp/mídia), Compose de
  validação, testes (Vitest) e CI (GitHub Actions).

### Não concluído (permanece pendente)

- Deploy em staging/produção e credenciais reais.
- Primeiro usuário administrador (já criado no staging da Fase 2A).
- Seed estrutural e backup/restauração do banco.
- Integração Hermes/n8n e páginas públicas do blog.

## Fase 2B — Portal editorial público (implementado em código)

Antecipação aprovada das Fases 4/5/6 (arquitetura pública, portal editorial e
SEO técnico) em código, sem deploy e sem integração Hermes/n8n. Detalhes em
[docs/19-portal-editorial-publico.md](docs/19-portal-editorial-publico.md) e
[ADR-015](docs/14-registro-decisoes.md).

### Entregas implementadas em código

- Camada pública server-only `src/lib/editorial/` (Payload Local API com
  `overrideAccess:false`, `draft:false`, filtro defensivo e DTOs públicos).
- Rotas `/conteudos`, `/conteudos/[slug]`, `/categorias/[slug]`,
  `/autores/[slug]`, `/feed.xml`, `sitemap.xml` e not-found editorial.
- Seção "Conteúdos para crescer" na home.
- SEO técnico (metadata, canonical, Open Graph, Twitter, JSON-LD, sitemap, RSS).
- Cache com revalidação sob demanda.
- Campo `featured` em articles + migration versionada.
- Publicação exige imagem destacada e tetos de SEO (60/160 caracteres).
- 60 testes (Vitest).

### Não concluído (permanece pendente)

- Deploy/ativação e homologação visual.
- Conteúdo editorial real.
- Integração Hermes/n8n e produção editorial.

## Fase 3A — Auditoria e contrato da integração Hermes/n8n (documental)

Antecipação aprovada da parte de **auditoria e contrato** das Fases 8/9, sem
integração. Detalhes em
[docs/21-auditoria-integracao-hermes-n8n.md](docs/21-auditoria-integracao-hermes-n8n.md),
[docs/22-contrato-integracao-hermes-n8n.md](docs/22-contrato-integracao-hermes-n8n.md)
e [ADR-016](docs/14-registro-decisoes.md).

### Entregas documentais

- Auditoria somente leitura do Hermes e do n8n existentes na VPS (versões,
  imagens, redes, montagens, pontos de integração).
- Contrato de integração versionado: webhook autenticado (HMAC, janela de
  replay, idempotência), dossiê JSON v1 e ciclo `EditorialRun` (CV-01 a CV-04).
- Mecanismo de perfis e execução comprovado na versão instalada (v0.20.4):
  `profile create/list/show`, `-p/--profile`, `terminal.home_mode:profile`,
  one-shot `-z` + `--usage-file`, gateway por perfil.
- JSON Schemas `editorial-dossier.v1`, `source-record.v1` e `article-draft.v1`
  (`docs/schemas/`), validados com Draft 2020-12.
- Decisão de transporte (ADR-017): one-shot determinístico; Hermes sem credencial
  do Payload; n8n única ponte; `automation` nunca publica.

### Não concluído (permanece pendente)

- Criação do perfil `crescimento-vertical-editorial` e skill (Fase 8).
- Workflows n8n, credenciais de serviço e webhook real (Fase 9).
- Conteúdo editorial e produção editorial.

## Fase 3B — Perfil Hermes editorial e executor interno seguro

Antecipação aprovada da ponte Hermes → n8n (Fases 8/9), com o perfil isolado e
o runner **sem execução**. Detalhes em
[docs/23-perfil-hermes-editorial.md](docs/23-perfil-hermes-editorial.md),
[docs/24-hermes-editorial-runner.md](docs/24-hermes-editorial-runner.md),
[docs/25-deploy-runner-editorial.md](docs/25-deploy-runner-editorial.md) e
[ADR-018](docs/14-registro-decisoes.md).

### Entregas implementadas

- Distribuição versionada `hermes/crescimento-vertical-editorial/` (SOUL.md,
  config.yaml restrito a `toolsets: [web]` + `home_mode: profile`, skill
  editorial com fail-safe e anti-prompt-injection).
- Perfil instalado isolado por `HERMES_HOME` (`/opt/data/profiles/...`), sem
  clone, sem alias, sem gateway, sem cron, sem credencial de modelo.
- Runner `cv-hermes-editorial-runner` (HMAC-SHA256 + nonce, janela 300 s, corpo
  ≤ 1 MiB, Draft 2020-12), endpoints `/health`, `/v1/validate`, `/v1/jobs`.
- Schema `editorial-research-request.v1`; execução desabilitada por dupla trava.

### Não concluído (permanece pendente)

- Habilitação da execução e webhook n8n (Fase 9).
- Conteúdo editorial e produção editorial.

## Fase 3C — Conector seguro n8n ↔ Hermes (validate-only)

Antecipação aprovada da conectividade n8n → runner (Fase 9), **sem execução**.
Detalhes em [docs/26-conector-n8n-hermes.md](docs/26-conector-n8n-hermes.md),
[docs/27-deploy-conector-n8n-hermes.md](docs/27-deploy-conector-n8n-hermes.md) e
[ADR-019](docs/14-registro-decisoes.md).

### Entregas implementadas

- Node privado `n8n-nodes-crescimento-vertical` (`hermesEditorial` +
  credencial `crescimentoVerticalHermesApi`), HMAC-SHA256, sem dependências
  nativas; 34 testes.
- Imagem `cv-n8n-hermes-connector` (base n8n pinada por digest) carregando o
  node via `N8N_CUSTOM_EXTENSIONS`.
- Recreate controlado apenas do n8n; credencial HMAC criptografada; workflow de
  conectividade INATIVO executado uma única vez (health/validate 200,
  createJob 503, getJob 404).
- CI com job `n8n-hermes-connector`.

### Não concluído (permanece pendente)

- Execução editorial real e webhook de produção (Fase 9).
- Conteúdo editorial e produção editorial.

## Controle transversal pós-Fase 3C — hardening do repositório público

Atividade de segurança autorizada sem iniciar a Fase 4: CI com quatro jobs,
Gitleaks obrigatório sobre todo o histórico, actions externas pinadas por SHA e
proteção da `main` com PR e checks obrigatórios. Detalhes em
[docs/28-hardening-repositorio-publico.md](docs/28-hardening-repositorio-publico.md)
e [ADR-020](docs/14-registro-decisoes.md). Nenhum runtime da VPS é alterado.

## Fase 4 — Arquitetura pública e páginas comerciais

### Atividades

1. Reconstruir a home como portal de conversão.
2. Criar páginas de soluções e diagnóstico.
3. Criar sobre, contato, cases e páginas legais.
4. Relacionar conteúdo editorial a serviços e CTAs.
5. Implantar redirecionamentos das URLs antigas quando necessário.
6. Validar formulários, WhatsApp, e-mail e navegação.

### Critério de saída

- Todas as rotas comerciais possuem conteúdo real, CTA rastreável, metadados e
  tratamento responsivo.

## Fase 5 — Portal editorial e experiência de leitura

### Atividades

1. Criar listagens de notícias, análises, guias, ferramentas e comparativos.
2. Criar página de artigo com autor, revisor, data, fontes e histórico de
   atualização.
3. Adicionar busca, filtros, paginação e conteúdos relacionados.
4. Implantar blocos de conteúdo reutilizáveis e CTAs contextuais.
5. Criar páginas de categoria, tag e autor.
6. Implantar páginas de política editorial e correções.

### Critério de saída

- O fluxo completo descoberta → leitura → aprofundamento → solução → diagnóstico
  funciona com conteúdo vindo do CMS.

## Fase 6 — SEO técnico, dados estruturados e performance

### Atividades

1. Definir canonical, title, description e Open Graph por rota.
2. Gerar robots.txt e sitemap.xml dinamicamente.
3. Implantar Article, NewsArticle, Organization, BreadcrumbList, Service e FAQ
   quando semanticamente aplicável.
4. Definir política de indexação de busca, filtros, previews e staging.
5. Otimizar imagens, fontes, cache, renderização e JavaScript do cliente.
6. Configurar Google Search Console e GA4.
7. Validar Core Web Vitals e orçamento de performance.

### Critério de saída

- Nenhum erro crítico de indexação, dados estruturados válidos, sitemap íntegro e
  metas de qualidade de docs/11-qualidade-e-aceite.md atendidas.

## Fase 7 — Captação, diagnóstico e mensuração comercial

### Atividades

1. Criar formulário de diagnóstico com consentimento e antispam.
2. Registrar lead com origem, conteúdo, campanha e serviço de interesse.
3. Notificar a operação comercial sem expor dados pessoais em logs.
4. Implantar eventos de CTA, WhatsApp, envio, sucesso e agendamento.
5. Criar confirmação e rota de recuperação em caso de falha.
6. Definir tempo de retenção e rotina de exclusão.

### Critério de saída

- Lead real de staging percorre o fluxo completo uma única vez, com rastreabilidade,
  consentimento e tratamento de falhas.

## Fase 8 — Hermes Agent e política editorial automatizada

### Atividades

1. Auditar recursos e configuração do Hermes já instalado na VPS-alvo.
2. Criar perfil logicamente isolado crescimento-vertical-editorial, sem alterar
   os demais projetos do Hermes.
3. Criar skill editorial versionada neste repositório.
4. Configurar fontes autorizadas, fontes proibidas e regras de verificação.
5. Configurar busca, extração, continuidade e deduplicação.
6. Validar o contrato JSON do dossiê editorial.
7. Configurar agenda inicial e limites de custo.
8. Executar bateria de pautas verdadeiras, falsas, duplicadas e ambíguas.

### Critério de saída

- Hermes gera dossiês rastreáveis, sem publicar, rejeita conteúdo fora do nicho e
  interrompe o fluxo quando não há evidência suficiente.

## Fase 9 — n8n, Telegram, aprovação e publicação

### Atividades

1. Criar os workflows CV-01 a CV-04 definidos na documentação.
2. Validar assinatura, schema e idempotência de cada entrada.
3. Criar rascunho no CMS com o usuário técnico do Hermes.
4. Enviar resumo editorial para Telegram.
5. Processar APROVAR, REJEITAR e REVISAR com identidade do aprovador.
6. Publicar somente após aprovação válida.
7. Registrar toda transição, erro, repetição e correção.
8. Criar fila de falha e reprocessamento manual seguro.

### Critério de saída

- Teste fim a fim comprovado: fonte → Hermes → Telegram → aprovação → CMS →
  publicação; reenvio duplicado não cria segundo artigo.

## Fase 10 — Conteúdo inicial e validação editorial

### Atividades

1. Publicar páginas institucionais e legais definitivas.
2. Preparar clusters iniciais ligados diretamente às soluções comerciais.
3. Revisar autoria, fontes, imagens, direitos e CTAs.
4. Validar links internos e ausência de páginas órfãs.
5. Preparar calendário editorial de 90 dias.
6. Realizar revisão humana integral de todo conteúdo de lançamento.

### Critério de saída

- Portal possui conteúdo suficiente para representar cada pilar, sem texto
  fictício, duplicado ou sem fonte, e cada cluster conduz a uma solução.

## Fase 11 — Segurança, observabilidade, backup e recuperação

### Atividades

1. Aplicar headers, rate limiting, proteção de formulários e auditoria de acesso.
2. Executar varredura de dependências e segredos.
3. Configurar logs estruturados, métricas, uptime e alertas.
4. Automatizar backups de banco, configurações e mídia.
5. Executar restauração em ambiente isolado.
6. Documentar incidentes, rollback e continuidade operacional.
7. Realizar teste de carga compatível com o lançamento.

### Critério de saída

- Alertas chegam ao responsável, restauração cumpre RPO/RTO definidos e nenhuma
  vulnerabilidade crítica conhecida permanece aberta.

## Fase 12 — Migração, lançamento e estabilização

### Atividades

1. Congelar mudanças não essenciais.
2. Fazer backup pré-lançamento e registrar hashes.
3. Executar migrações e implantação controlada.
4. Verificar domínio, TLS, robots, sitemap, páginas, APIs e CTAs.
5. Acompanhar erros, indexação, performance e leads.
6. Manter janela de rollback.
7. Encerrar estabilização somente após sete dias sem incidente crítico.

### Critério de saída

- Produção íntegra, monitorada e recuperável; conteúdo indexável; captação
  funcionando; documentação correspondente ao estado implantado.

## Controle de alteração do roteiro

Qualquer mudança nesta sequência precisa registrar:

- problema que motivou a mudança;
- impacto em escopo, custo, prazo, segurança e SEO;
- alternativa rejeitada;
- decisão e responsável;
- data;
- fases afetadas.

O registro deve ser feito em docs/14-registro-decisoes.md antes da implementação.

### Alteração 2026-08-24 — Fase 2A

- Problema: preparar a fundação editorial em código sem esperar o gate integral
  das Fases 1/2, preservando produção e staging ativos.
- Impacto: entrega antecipada de código (CMS, banco, permissões, migrações,
  testes, CI); sem impacto em produção, DNS, credenciais ou deploy.
- Alternativa rejeitada: aguardar a sequência estrita, adiando a fundação.
- Decisão e responsável: implementar a “Fase 2A” em código, registrada no
  ADR-014; responsável Crescimento Vertical.
- Data: 2026-08-24.
- Fases afetadas: 3 (fundação de CMS/banco), antecipada parcialmente em código.

### Alteração 2026-08-25 — Fase 2B

- Problema: expor o conteúdo editorial publicamente (com SEO e cache) sobre a
  fundação da Fase 2A, sem aguardar o gate integral das Fases 4/5/6.
- Impacto: entrega antecipada de código (portal editorial público, SEO, cache);
  sem impacto em produção, DNS, Hermes, n8n ou deploy.
- Alternativa rejeitada: aguardar a sequência estrita, adiando o portal público.
- Decisão e responsável: implementar a “Fase 2B” em código, registrada no
  ADR-015; responsável Crescimento Vertical.
- Data: 2026-08-25.
- Fases afetadas: 4/5/6 (arquitetura pública, portal editorial e SEO técnico),
  antecipadas parcialmente em código.

### Alteração 2026-08-25 — Fase 3A

- Problema: fixar, antes de qualquer integração, o estado real do Hermes/n8n na
  VPS e o contrato de integração com o CMS, sem criar credenciais, skills ou
  workflows.
- Impacto: entrega antecipada documental (auditoria + contrato); sem impacto em
  produção, DNS, Hermes, n8n ou deploy.
- Alternativa rejeitada: integrar diretamente sem auditar nem fixar contrato.
- Decisão e responsável: executar a “Fase 3A” documental, registrada no
  ADR-016; responsável Crescimento Vertical.
- Data: 2026-08-25.
- Fases afetadas: 8/9 (Hermes e n8n/aprovação), antecipadas em auditoria e
  contrato.

### Alteração 2026-08-25 — Fase 3B

- Problema: construir a ponte controlada Hermes → n8n (perfil isolado + runner)
  sem habilitar execução, preservando o Hermes compartilhado e o gateway ativo.
- Impacto: perfil editorial instalado, runner isolado em container próprio e
  schema de requisição; execução desabilitada por dupla trava; sem impacto em
  produção, DNS, Hermes, n8n ou deploy.
- Alternativa rejeitada: dar acesso direto do Hermes ao Payload (violaria o
  ADR-017).
- Decisão e responsável: executar a “Fase 3B” em código + infraestrutura,
  registrada no ADR-018; responsável Crescimento Vertical.
- Data: 2026-08-25.
- Fases afetadas: 8/9 (ponte Hermes → n8n), antecipadas sem execução.

### Alteração 2026-08-25 — Fase 3C

- Problema: ligar o n8n ao runner editorial com autenticação HMAC e validação,
  sem executar o Hermes e sem atualizar o n8n.
- Impacto: node privado, imagem n8n derivada, credencial criptografada e
  workflow de conectividade INATIVO; apenas o n8n foi recriado; sem impacto em
  produção, DNS, Traefik, Hermes, Payload ou PostgreSQL.
- Alternativa rejeitada: assinar requisições via Code node/Execute Command
  (exporia o segredo e quebraria a auditoria).
- Decisão e responsável: executar a “Fase 3C” em código + infraestrutura,
  registrada no ADR-019; responsável Crescimento Vertical.
- Data: 2026-08-25.
- Fases afetadas: 9 (ponte n8n → Hermes), antecipada sem execução.

### Alteração 2026-08-28 — postergação da homologação responsiva completa

- Problema: preservar a continuidade das implementações sem declarar como
  concluída uma homologação visual ainda parcial.
- Impacto: a Fase 2 fica tecnicamente concluída; a homologação completa passa
  ao gate de hardening visual final e continua bloqueando produção.
- Alternativa rejeitada: manter todas as próximas implementações bloqueadas até
  a inspeção visual completa nesta execução.
- Decisão e responsável: postergação expressamente aprovada pelo responsável
  pelo produto e registrada no ADR-023.
- Data: 2026-08-28.
- Fases afetadas: encerramento da Fase 2 e gate obrigatório pré-produção; nenhuma
  fase seguinte foi iniciada nesta execução.
