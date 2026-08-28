# Auditoria do estado atual

Data da auditoria: 23 de agosto de 2026.

## Aceite humano e encerramento da Fase 3 — 28 de agosto de 2026

O responsável pelo produto registrou aceite expresso: login administrativo,
painel Payload, sete coleções (Articles, Authors, Categories, Media, Sources,
Research Dossiers e Users), Articles vazio, administrador ativo, logout e
bloqueio anônimo aprovados. Nenhum conteúdo, usuário, fonte ou mídia de teste
foi criado no staging. O ciclo editorial completo em PostgreSQL descartável,
backup/restauração isolada e preview seguro foram comprovados.

A Fase 3 está concluída, nenhuma fase está em execução e a Fase 4 permanece
pendente. A homologação responsiva completa do ADR-023 continua gate obrigatório
e bloqueio para produção, sem dispensa de acessibilidade.

## Início formal da Fase 3 — 28 de agosto de 2026

O preflight confirmou `main` local e remota limpas no SHA
`d0f7b33f19dc00a8053aa8c0f42359a417182ee0`, tag
`phase2-portal-foundation-2026-08-28` no mesmo commit, proteção da `main` ativa
com os quatro checks obrigatórios e ausência de PR aberto para
`feat/phase-3-cms-authentication`. A branch da fase possui merge-base exato com
essa `main`.

Os oito containers preservados foram inventariados sem leitura de valores de
ambiente. O candidato `phase2-foundation-staging-575e232` e o PostgreSQL 16
dedicado estão `running` e `healthy`; o banco continua apenas em porta interna.
Produção, staging, n8n e Hermes não foram alterados no início da fase.

A Fase 3 passa a ser a única fase em execução. Seu primeiro gate é uma matriz
de lacunas que distinguirá capacidades já entregues pela Fase 2A de requisitos
formais ainda não comprovados. A pendência responsiva do ADR-023 permanece gate
obrigatório pré-produção e não é reduzida por este início.

### Auditoria de lacunas e validação descartável

A Fase 2A já continha Payload 3.88.0, PostgreSQL 16, sete coleções, autenticação,
lockout, cinco papéis, drafts, versões, workflow, mídia persistente, duas
migrations, DTOs públicos e backups de staging. Não existiam preview funcional,
negação explícita de login para usuário inativo nem restrição por estado que
impedisse `editor` e `automation` de alterar artigo já publicado.

Essas lacunas foram corrigidas sem migration nova e sem mudança de dependência.
O preview usa sessão Payload validada no servidor, `draftMode`, rota dedicada,
mesmo origin, slug estrito, `noindex`, cache desabilitado e DTO seguro. A leitura
anônima exige também `_status=published`; consultas internas de fonte no gate
de publicação deixaram de usar `overrideAccess:true`.

O ciclo integrado em PostgreSQL 16 descartável validou seis usuários (cinco
ativos e um inativo), autor, categoria, mídia, fonte verificada, dossiê, dois
artigos, transições, bloqueios, versões, preview e leitura pública. O dump
custom e a mídia foram restaurados em um segundo PostgreSQL 16: contagens
`6/1/1/1/1/1/2`, logins, relações, versões, publicado, draft e checksum da mídia
foram confirmados. Os dois containers foram removidos sem tocar volumes
persistentes.

### Deploy controlado de staging — 28 de agosto de 2026

Com o CI do PR #9 verde, o backup pré-deploy foi validado e somente o container
`cv-phase2-staging-app` foi recriado na imagem `phase3-89c67c3`. Uma primeira
invocação sem o arquivo de ambiente efetivo foi detectada imediatamente por
`/admin`/APIs 500 e corrigida antes do aceite, sem alteração de banco ou dados;
o app foi recriado com `.env.phase2.staging` e passou a responder normalmente.
O PostgreSQL manteve ID `886c99…`, o admin foi preservado, as coleções seguem
vazias, duas migrations estão aplicadas, e produção, staging antigo, n8n,
Traefik, Hermes e runner mantiveram seus IDs. O smoke final confirmou `/` e
`/conteudos`/`/admin`/APIs/live/ready em 200, preview anônimo em 401, 404 em
404 e acesso externo sem BasicAuth em 401. Nenhuma porta nova foi publicada.

O PR permanece draft aguardando aceite humano no `/admin`; não houve merge,
produção continua inalterada e a Fase 4 não foi iniciada.

## Fechamento técnico da Fase 2 — 28 de agosto de 2026

O candidato de staging está healthy e identifica o HEAD
`575e23260149f18961f1f44431b1d44189fa0091`. O PR #8 estava aberto, draft,
mergeável, sem reviews ou conversas bloqueadoras, e o run `33113727705` possuía
os quatro jobs obrigatórios verdes. A proteção da `main` exigia os mesmos quatro
checks, base atualizada, resolução de conversas e aplicação a administradores.

As dependências permanecem sem vulnerabilidades altas ou críticas conhecidas;
os achados residuais são baixos/moderados e estão documentados na remediação de
27 de agosto. O responsável pelo produto aprovou Header e Hero em 390 × 844 e,
pelo ADR-023, autorizou transferir a homologação responsiva completa para o
hardening visual final.

A Fase 2 fica tecnicamente concluída. A pendência visual não bloqueia as
próximas implementações, mas continua bloqueando produção e não dispensa os
cinco viewports nem os critérios de acessibilidade. Nesta execução não houve
novo deploy nem alteração de staging, produção ou integrações, e nenhuma fase
seguinte foi iniciada.

## Reauditoria e conclusão formal da Fase 1 — 26 de agosto de 2026

- `main`, `origin/main` e a tag `repository-hardening-2026-08-26` resolvem para
  `b716e4b4fa7b993eebee711739cdbd83de45aa04`; árvore limpa no preflight.
- Oito containers-alvo foram inspecionados por ID, estado e health sem reinício:
  todos estão `running`; app de produção, dois stagings, PostgreSQL e runner
  estão `healthy`; n8n, Traefik e Hermes não declaram healthcheck.
- Seis redes e quinze volumes Docker foram inventariados. O PostgreSQL permanece
  somente na rede interna; app candidato, staging antigo, produção, runner e
  Hermes não ganharam porta publicada. As publicações preexistentes de n8n e
  Traefik não foram alteradas.
- As chaves de ambiente obrigatórias foram verificadas somente por nome. O
  staging possui e-mail operacional com formato válido; WhatsApp não está
  configurado e é opcional. Nenhum valor foi registrado.
- `staging.crescimentovertical.com` resolve, redireciona HTTP para HTTPS, possui
  TLS válido, retorna 401 sem BasicAuth e envia `X-Robots-Tag`. Internamente,
  `/`, `/conteudos`, `/admin`, live, ready, robots e sitemap retornam 200.
- Apex e www permanecem na infraestrutura anterior e atualmente retornam 502,
  com incompatibilidade de hostname observada pelo cliente HTTPS. Essa pendência
  conhecida não altera o staging e será tratada apenas na migração autorizada.
- A homologação visual de 25/08 em 360, 390, 768, 1024 e 1440 px constitui o
  baseline vigente da home e do estado vazio de `/conteudos`; identidade,
  logotipo e imagens atuais são a referência da Fase 2.
- Os backups `phase1-8f9d82d` e `phase1-final-ea801b1-20260824-182845` tiveram
  `SHA256SUMS` e bundles Git verificados novamente. O rollback documentado
  permanece disponível.
- Banco do staging preservado: um usuário administrador e zero registros nas
  coleções editoriais. A execução do Hermes continua desabilitada.

Com essas evidências, o critério de saída da Fase 1 está atendido. As entregas
antecipadas 2A, 2B, 3A, 3B e 3C permanecem registradas, mas não substituem os
gates formais seguintes.

## Candidato da fundação do portal em staging — 27 de agosto de 2026

Após os quatro checks verdes do PR draft `#8`, a imagem da fundação do portal
foi construída e implantada somente em `cv-phase2-staging-app`. O backup
pré-deploy `phase2-foundation-predeploy-ac7eb19-20260827-011500` contém Git,
PostgreSQL, mídia, configuração e imagem anterior, com permissões 700/600,
SHA-256 e validações de bundle, dump e arquivos tar. Não existia migration nova.

O candidato passou de `8ba86f676f44` para `af7129c2402c` e ficou healthy. Os
IDs de produção, staging antigo, PostgreSQL, n8n, Traefik, Hermes e runner não
mudaram. Home, hub editorial, Admin, live/ready, robots e sitemap responderam
200 internamente; 404 respondeu corretamente; sitemap permaneceu vazio. O
acesso externo sem autenticação respondeu 401, TLS validou e o header noindex
foi preservado. O banco continua com um usuário e coleções editoriais vazias.
Produção e integrações não foram alteradas; homologação visual humana permanece
pendente antes de qualquer merge.

## Constituição e reconciliação documental — 27 de agosto de 2026

A Constituição sanitizada foi integrada à raiz como norma permanente, com
`AGENTS.md` preservado como porta automática de entrada. O README foi
reconciliado com a stack e as capacidades já existentes, e docs/06 passou a
tratar a árvore antiga do Hermes como planejamento substituído pela antecipação
aprovada da Fase 3B. O ADR-022 registra o protocolo transversal sem iniciar nova
fase nem alterar runtime.

Registro histórico daquela auditoria: o `npm audit` então apontava 14 avisos,
incluindo uma crítica. Esse retrato foi supersedido pelas atualizações de
dependências já registradas abaixo; a auditoria da Fase 3 encontrou 11 avisos
transitivos (5 baixos, 6 moderados, 0 altos, 0 críticos), todos sem correção
segura disponível no grafo atual.

Naquele ponto a Fase 2 continuava em execução e a homologação visual humana era
a próxima ação. O estado corrente está registrado no início formal da Fase 3;
produção, staging, banco, containers, integrações e execução do Hermes não foram
alterados nesta auditoria documental.

## VPS oficial confirmada em 24 de agosto de 2026

- O identificador e o endereço da VPS ficam no registro privado ignorado pelo
  Git.
- Não existe diretório nem contêiner do Crescimento Vertical; não há implantação
  anterior para migrar ou sobrescrever.
- Traefik, n8n e Hermes estão ativos e serão preservados.
- A implantação será nova e deverá preservar integralmente os serviços atuais.
- Memória, disco, carga, runtime e consumo dos contêineres foram auditados; há
  capacidade para o baseline. CMS e PostgreSQL receberão limites próprios quando
  forem introduzidos.
- Não há recursos Docker inativos que justifiquem limpeza neste gate.
- O apex ainda aponta para a infraestrutura anterior, não para a VPS-alvo.
- HTTPS no apex e em www falhou com certificado incompatível com o hostname.
- O DNS não será alterado antes de a nova aplicação estar implantada e validada
  localmente por meio do Traefik.
- As portas web públicas pertencem ao Traefik; o n8n não está publicado
  diretamente na internet.
- Um processo público preexistente fora do Docker foi documentado no registro
  privado e não será interrompido no escopo deste projeto.
- Traefik redireciona globalmente web para websecure, usa o resolver ACME
  mytlschallenge por TLS challenge e possui persistência de certificados.
- As labels do Crescimento Vertical já referenciam websecure e
  mytlschallenge, portanto são compatíveis com o proxy instalado.
- Não existe router atual para crescimentovertical.com; não há conflito de host.
- Os volumes ainda precisam ser auditados antes do deploy definitivo.

## Validação da imagem e do container — 24 de agosto de 2026

- Commit-base implantado: b71b52a8c0cdd4442a1c6244e61a53f8f57b532c.
- npm ci, npm run check, ESLint, TypeScript e build Next.js: aprovados.
- docker compose build: aprovado; imagem crescimento-vertical-crescimento-vertical.
- Container iniciado com --no-build e --wait; estado healthy em cerca de 6 s.
- GET /api/health/live retornou {"status":"ok"}.
- GET /api/health/ready retornou {"status":"ready"}.
- Traefik local entregou crescimentovertical.com e www.crescimentovertical.com
  com HTTP 200.
- O processo Next.js iniciou em 0.0.0.0:3000.
- A VPS exigiu o pacote libatomic1 para executar o Node instalado.
- TLS local resultou em 18: o DNS ainda aponta para a infraestrutura anterior;
  isso não configura TLS de produção aprovado.
- Nenhum DNS foi alterado.
- Hermes, n8n, Traefik e demais serviços existentes foram preservados.

## Backup, restauração e rollback — 24 de agosto de 2026

Backup local, restauração e rollback operacional foram comprovados na Fase 1.

- Git bundle criado contendo main e feat/portal-phase-1-baseline; verificado e
  declarado como histórico completo.
- Commit da branch incluído no bundle: 8f9d82d0372e7796bb4fd2cb540eec3e1a280af6.
- Imagem Docker de rollback criada a partir do baseline da aplicação e exportada
  para arquivo.
- Configurações necessárias para a recuperação foram preservadas.
- Checksums SHA-256 foram gerados para os arquivos do backup.
- Arquivos do backup receberam permissão 600.
- Imagem de rollback foi carregada novamente com sucesso.
- Container descartável de prova foi criado sem portas públicas e sem labels do
  Traefik.
- Probe de rollback retornou {"status":"ok"} em live e {"status":"ready"} em
  ready.
- Probe descartável foi removido após o teste.
- A aplicação principal permaneceu running e healthy; nenhum serviço existente
  foi interrompido.
- O backup operacional local ocupa aproximadamente 76 MB.

Esse resultado comprova o rollback operacional local (reproduzir o baseline da
aplicação no próprio ambiente), não a recuperação de desastre. A recuperação de
desastre depende de cópia externa/off-site, que ainda não foi executada e
permanece pendente, além dos itens de backup automatizado previstos na Fase 11.

## Ativação e validação do staging protegido — 24 de agosto de 2026

- Data e horário da validação (America/Sao_Paulo): 2026-08-24 15:20.
- staging.crescimentovertical.com resolve para a VPS oficial.
- Acesso sem autenticação retorna HTTP 401; com autenticação, HTTP 200.
- TLS válido no hostname de staging.
- Bloqueio de indexação validado nas três camadas: metadados/robots
  (noindex/nosnippet), `/robots.txt` (`Disallow: /`) e `X-Robots-Tag`
  (`noindex, nofollow, noarchive`).
- `/api/health/live` retornou `{"status":"ok"}` e `/api/health/ready`
  retornou `{"status":"ready"}`.
- Container de staging running/healthy.
- Produção permaneceu running/healthy e não foi reiniciada.
- Nenhuma credencial, hash ou conteúdo de `.env.staging` foi versionado.
- DNS principal (@ e www) ainda não foi migrado para a VPS.
- Staging pronto para inspeção visual e homologação.

## Repositório

- Repositório: araujosdeveloper/crescimento-vertical.
- Branch padrão: main.
- Aplicação pequena e centralizada em um único projeto Next.js.
- Não havia documentação de produto ou arquitetura na raiz.

## Stack encontrada

| Item | Estado |
| --- | --- |
| Next.js | 16.2.9, App Router |
| React | 19.2.7 |
| TypeScript | strict habilitado |
| Estilos | Tailwind CSS e CSS global |
| Ícones | lucide-react |
| Build | next build --webpack |
| Contêiner | Node 22 Alpine, múltiplos estágios |
| Proxy | Traefik via labels |
| Rede | n8n_default externa |
| Banco | Ausente |
| CMS | Ausente |
| Testes | Ausentes |
| CI | Ausente |

## Estrutura funcional atual

- Home composta por Header, Hero, Autoridade, Serviços, Problema, Processo,
  Diferenciais, CTA, Footer e botão flutuante de WhatsApp.
- Navegação baseada em âncoras na mesma página.
- Identidade visual escura com azul e ciano.
- Componentes separados por seção.
- Responsividade tratada em CSS, inclusive para telas pequenas.

## Pontos positivos preserváveis

- Base em App Router e TypeScript estrito.
- Marca visual coerente com tecnologia.
- Componentização suficiente para evoluir sem descartar toda a interface.
- Dockerfile com estágios de dependências, build e execução.
- TLS e roteamento já declarados por Traefik.

## Lacunas e riscos

### Críticos antes de aquisição de tráfego — estado original

- WHATSAPP_URL usa o número fictício 5500000000000.
- Footer exibe (00) 00000-0000.
- Não há formulário de diagnóstico ou armazenamento de leads.
- Não há política de privacidade, termos, política editorial ou correções.

### Tratamento iniciado na Fase 1

- O número 5500000000000 e a exibição (00) 00000-0000 foram removidos do código.
- WhatsApp passou a depender de NEXT_PUBLIC_WHATSAPP_NUMBER válido.
- Na ausência de WhatsApp configurado, os CTAs usam o e-mail.
- .env.example documenta as variáveis públicas sem segredos.
- Contato real ainda precisa ser confirmado pelo responsável.

### Produto e conteúdo

- Não existem rotas de notícias, análises, guias, ferramentas ou comparativos.
- Serviços não possuem páginas próprias.
- Não há CMS, banco, usuários, drafts, versões ou preview.
- Não há taxonomia editorial nem relacionamento entre conteúdo e serviço.

### SEO

- Metadata global ainda representa somente “Estratégia Digital, Automação e
  Performance”.
- Não foram encontrados sitemap.ts, robots.ts, canonical por página ou dados
  estruturados.
- Não existem páginas de autor, categoria, tag ou política editorial.

### Engenharia

- Não há script separado de typecheck.
- Não há testes unitários, de integração ou ponta a ponta.
- Não há workflow de integração contínua.
- Docker Compose não declara healthcheck, volumes, banco ou política de recursos.
- Aplicação compartilha diretamente a rede n8n_default.
- Não há ambiente staging documentado.
- Não há migrações, backup, observabilidade ou runbook.

## Restrições da evolução

- Não apagar a landing atual antes de existir substituta validada.
- Não alterar domínio, DNS ou implantação nesta fase documental.
- Não adicionar CMS ou banco sem baseline e backup da Fase 1.
- Não publicar conteúdo automatizado sem workflow de aprovação.
- Não corrigir silenciosamente redirecionamentos; toda URL afetada será mapeada.

## Primeira ação técnica autorizável

Executar a Fase 1 do Roteiro Mestre: confirmar a infraestrutura real, criar
baseline reproduzível, proteger staging e validar backup/rollback. Nenhuma
integração do Hermes deve ser instalada antes desse gate.

## Evidências locais após o início da Fase 1

- Commit-base clonado: 5b461252037f6670be7d8cd4095c5d202f97ae5d.
- Branch: feat/portal-phase-1-baseline.
- npm ci: aprovado.
- ESLint: aprovado.
- TypeScript: aprovado.
- Build Next.js: aprovado.
- Saída standalone: aprovada.
- Healthchecks live e ready: aprovados em smoke test HTTP.
- Home gerada sem telefone fictício.
- Docker Compose: YAML validado.
- Imagem Docker: construída e validada na VPS; container saudável e healthchecks
  aprovados.

A imagem foi construída e validada na VPS oficial com commit-base
b71b52a8c0cdd4442a1c6244e61a53f8f57b532c. Backup pré-mudança, restauração e
rollback operacional local foram comprovados, e o staging protegido foi ativado
e validado. Redes, DNS, TLS de produção, contatos reais e cópia off-site
permanecem pendentes.

## Fundação editorial implementada em código — 24 de agosto de 2026

A Fase 2A implementou, em código (sem deploy), a fundação editorial descrita em
docs/17-fundacao-editorial-payload.md:

- Payload 3.88.0 integrado ao Next.js 16.2.9 (rotas `/admin` e `/api`,
  `withPayload`, `output: standalone` preservado).
- PostgreSQL 16 dedicado com migrações versionadas e `push` desativado.
- Coleções users, authors, categories, media, sources, research-dossiers e
  articles, com drafts/versões.
- Papéis admin, editor, reviewer, researcher e automation, com acesso e hooks no
  servidor (workflow editorial e exigência de fonte validada).
- Migration inicial versionada, `payload-types.ts` gerado, testes (Vitest) e CI
  (GitHub Actions com PostgreSQL efêmero).

Estado anteriormente “ausente” que passou a existir em código:

| Item | Estado |
| --- | --- |
| Banco | PostgreSQL (adapter dedicado, código + Compose de validação) |
| CMS | Payload integrado ao Next.js |
| Testes | Vitest (38 testes) |
| CI | GitHub Actions |
| Migrações | Migration inicial versionada |

Continuam pendentes: deploy, credenciais reais, primeiro usuário administrador,
seed estrutural, backup/restauração do banco, integração Hermes/n8n e páginas
públicas do blog. Produção e staging ativos não foram recriados.

## Staging blue-green ativado — 24 de agosto de 2026

A fundação editorial foi ativada no staging em arquitetura blue-green
(docs/18-deploy-phase2-staging.md), sem alterar produção nem o staging antigo:

- Projeto `crescimento-vertical-phase2-staging` com containers
  `cv-phase2-staging-app` e `cv-phase2-staging-postgres` (running/healthy).
- PostgreSQL 16 dedicado com migration inicial aplicada (`migrate:status` = Ran).
- Roteamento por `PHASE2_TRAEFIK_ENABLE`, router com prioridade superior ao
  staging antigo, BasicAuth e `X-Robots-Tag`.
- Sem dados editoriais: users, authors, categories, media, sources,
  research_dossiers e articles com zero registros.
- Produção e staging antigo permaneceram running/healthy sem recriação.

## Validação final da Fase 2A no staging — 24 de agosto de 2026

Validação documental (somente leitura) do staging blue-green da Fase 2A:

- Git: `HEAD 8db0090`, working tree limpa e branch
  `feat/portal-phase-2-editorial-foundation` sincronizada com origin.
- Containers running/healthy: `crescimento-vertical` (produção),
  `crescimento-vertical-staging` (staging antigo), `cv-phase2-staging-app`
  (candidate) e `cv-phase2-staging-postgres` (PostgreSQL).
- Payload Admin acessível (`/admin` retorna 200) e healthchecks live/ready 200.
- Primeiro administrador criado manualmente; um único usuário ativo com role
  `admin`.
- Coleções editoriais vazias: authors=0, categories=0, media=0, sources=0,
  research_dossiers=0 e articles=0.
- Migração aplicada: `20260824_191516_initial_foundation`.
- Backup integral em
  `/opt/backups/crescimento-vertical/phase2a-staging-8db0090-20260824-231850`
  (aproximadamente 196 MB, permissões 700/600), com SHA-256 conferido, bundle
  Git verificado, `pg_restore --list` e `payload-media.tar.gz` validados sem
  restaurar nem extrair.
- Produção e staging antigo preservados; rollback disponível.
- BasicAuth: rotação após exposição do hash anterior concluída. O backup
  pré-rotação (hash anterior) difere do estado atual, e o novo hash é idêntico
  em `.env.staging`, em `.env.phase2.staging` e nos labels BasicAuth dos dois
  containers. Staging antigo e candidate foram recriados exclusivamente para
  aplicar o novo hash; produção e PostgreSQL foram preservados; TLS, BasicAuth e
  Admin validados.
- Nenhum e-mail administrativo, senha, hash, `DATABASE_URL`, IP ou conteúdo de
  `.env` foi versionado.

Continuam pendentes: páginas públicas do blog, conteúdo editorial real,
integração Hermes/n8n, produção editorial e migração de @ e www.

## Portal editorial público implementado em código — 25 de agosto de 2026

A Fase 2B implementou, em código (sem deploy), o portal editorial público sobre
a fundação da Fase 2A (docs/19-portal-editorial-publico.md):

- Camada pública server-only `src/lib/editorial/` com DTOs estritos e Payload
  Local API (`overrideAccess:false`, `draft:false`, filtro de publicados).
- Rotas `/conteudos`, `/conteudos/[slug]`, `/categorias/[slug]`,
  `/autores/[slug]`, `/feed.xml`, `sitemap.xml` e not-found editorial; seção
  "Conteúdos para crescer" na home.
- SEO técnico (canonical, Open Graph, Twitter, JSON-LD Article/BreadcrumbList,
  sitemap e RSS) e cache com revalidação sob demanda.
- Campo `featured` em articles + migration `20260825_013756_add_article_featured`.
- Publicação passou a exigir `heroImage` e tetos de meta title/description.
- 60 testes (Vitest); lint, typecheck e build aprovados; migrações validadas em
  PostgreSQL descartável.

Estado anteriormente pendente que passou a existir em código:

| Item | Estado |
| --- | --- |
| Páginas públicas do blog | Implementadas em código (sem deploy) |
| SEO técnico por rota | Implementado em código |
| Cache/revalidação editorial | Implementado em código |

Continuam pendentes: deploy/ativação, homologação visual, conteúdo editorial
real, integração Hermes/n8n, produção editorial e migração de DNS (@ e www).
Produção, staging antigo e containers blue-green da Fase 2A permanecem
running/healthy sem recriação. O primeiro usuário administrador já existe no
staging.

## Deploy do portal editorial público no staging — 25 de agosto de 2026

A Fase 2B foi implantada e validada no candidato de staging (docs/20):

- HEAD implantado: `bdb129f6eb0b7f6d1f4a779ab2005023b515e3d2`; imagem marcada
  `crescimento-vertical:phase2b-staging-bdb129f`.
- Migration `20260825_013756_add_article_featured` aplicada; Fase 2A e Fase 2B
  presentes em `migrate:status`; nenhuma pendente.
- Backup pré-deploy em
  `/opt/backups/crescimento-vertical/phase2b-predeploy-bdb129f-20260825-025211`
  (700/600), validado por `sha256sum -c`, `git bundle verify`, `pg_restore --list`
  e `docker load`.
- Validação interna: `/`, `/conteudos`, healthcheck live/ready, `/admin`,
  `/feed.xml`, `/sitemap.xml` e `/robots.txt` = 200; rotas inexistentes = 404;
  feed/sitemap sem artigos; home sem cards editoriais; nenhum 500.
- Validação externa: 401 sem BasicAuth, TLS válido, `X-Robots-Tag: noindex,
  nofollow, noarchive`, sem novas portas e Traefik apontando ao candidato.
- Dados preservados: `users=1`, admin ativo `=1`, demais coleções `=0`.
- IDs: produção `1af439f02200`, staging antigo `58f2c01c2220` e PostgreSQL
  `886c99b1b922` inalterados; apenas o candidato foi recriado (`b495fbc09ee7`
  → `8ba86f676f44`).
- Correção: `SITE_NOINDEX` passou a ser repassado ao runtime do serviço `app`
  (`docker-compose.phase2.yml`), garantindo sitemap vazio e meta `noindex` nas
  rotas dinâmicas.

Continuam pendentes: homologação visual, conteúdo editorial real, produção
editorial, migração de DNS (@ e www) e integração Hermes/n8n.

## Homologação visual da Fase 2B — 25 de agosto de 2026

A Fase 2B foi homologada visualmente pelo operador no staging:

- Home homologada visualmente.
- `/conteudos` homologado no estado vazio (sem conteúdo fictício).
- Responsividade aprovada em 360, 390, 768, 1024 e 1440 px.
- Ausência de conteúdo fictício confirmada.

As páginas populadas serão novamente verificadas com o primeiro conteúdo real.
Produção e DNS permanecem pendentes; Hermes/n8n não foram iniciados.

## Auditoria e contrato Hermes/n8n — 25 de agosto de 2026

A Fase 3A entregou, em documentação (sem integração), a auditoria somente
leitura e o contrato de integração (docs/21 e docs/22, ADR-016):

- Hermes: contêiner `hermes-agent-sodq-hermes-agent-1`, imagem
  `ghcr.io/hostinger/hvps-hermes-agent:latest` (gerenciada), com busca web
  (Tavily), Telegram e Playwright; sem limites de recursos declarados.
- n8n: `docker.n8n.io/n8nio/n8n:latest` (versão 2.33.7), webhooks habilitados
  (`WEBHOOK_URL`), exposto via `n8n-traefik-1`; compartilhado com outros
  projetos (webhook próprio de terceiro).
- Contrato: webhook autenticado (HMAC-SHA256 sobre corpo bruto + timestamp +
  versão, janela de replay de 300 s, `Idempotency-Key`, corpo ≤ 1 MiB), dossiê
  JSON `editorial-dossier.v1` e ciclo `EditorialRun` (CV-01 a CV-04).
- Nenhum contêiner, credencial, rede ou configuração foi alterado; nenhum
  segredo foi registrado.

### Lacunas fechadas (26 de agosto de 2026)

- **Versão e perfis comprovados**: Hermes v0.20.4 (2026.8.18); `profile
  create/list/show` existem; `-p/--profile` define `HERMES_HOME` por invocação
  sem mutar o padrão; perfis em `/opt/data/profiles/<nome>/`;
  `terminal.home_mode:profile` existe (atual `auto`).
- **Execução comprovada**: não interativa via `-z/--oneshot` (e `chat -q`);
  JSON via `--usage-file` e `send --json`; gateway por perfil suportado.
- **Transporte decidido (ADR-017)**: one-shot determinístico, sem daemon;
  Hermes sem credencial do Payload; n8n única ponte; `automation` nunca publica.
- **Schemas fechados**: `editorial-dossier.v1` (revisado com `correlationId`,
  `confidence`, `contradictions`, `missingInformation`, `riskFlags`),
  `source-record.v1` e `article-draft.v1` (status `const draft`), validados com
  Draft 2020-12.

Continuam pendentes: criação do perfil `crescimento-vertical-editorial` e skill
(Fase 8), workflows n8n, credenciais de serviço e webhook real (Fase 9);
conteúdo editorial real; produção e DNS.

## Perfil Hermes editorial e runner isolado — 25 de agosto de 2026

A Fase 3B entregou, em código e infraestrutura isolada (sem integração):

- Perfil `crescimento-vertical-editorial` instalado via distribuição versionada
  (`hermes/crescimento-vertical-editorial/`), isolado por HERMES_HOME
  (`/opt/data/profiles/crescimento-vertical-editorial`), com `toolsets: [web]`,
  `home_mode: profile`, sem credencial de modelo, sem gateway (stopped) e sem
  cron. O `default` continua ativo e o gateway PID 153 foi preservado.
- Runner `cv-hermes-editorial-runner` (imagem Hermes pinada por digest, rede
  `n8n_default`, sem ports/Traefik/Docker Socket, `read_only`, `cap_drop ALL`,
  non-root, 768 MiB/0.50 CPU/pids 64), com endpoints `/health`, `/v1/validate`,
  `/v1/jobs` e `/v1/jobs/{id}` protegidos por HMAC-SHA256 + nonce.
- Execução desabilitada por dupla trava (`RUNNER_EXECUTION_ENABLED=false` +
  ausência de `/run/secrets/execution-enable`); `/v1/jobs` → `503`.
- Schema `editorial-research-request.v1` criado; 4 schemas Draft 2020-12
  validados; 32 testes do runner aprovados; smoke tests 200/401/503/404.
- Backup pré-mutação em `/opt/backups/crescimento-vertical/phase3b-preprofile-*`
  (bundle, export do default e do novo perfil sem `.env`/auth.json).

Continuam pendentes: workflows n8n, credenciais de serviço e webhook real
(Fase 9); conteúdo editorial real; produção e DNS.

## Conector n8n ↔ Hermes — 25 de agosto de 2026

A Fase 3C entregou a conectividade n8n → runner (validate-only, sem execução):

- Node privado `n8n-nodes-crescimento-vertical` (TypeScript, sem dependências
  nativas) com o node `hermesEditorial` (health/validate/createJob/getJob) e a
  credencial `crescimentoVerticalHermesApi` (URL interna + HMAC password).
- Imagem `cv-n8n-hermes-connector` a partir do digest exato do n8n (2.33.7,
  `3989d9b8…`), carregando o node via `N8N_CUSTOM_EXTENSIONS`.
- Recreate controlado **apenas** do n8n (ID `833934a5416e` → `ecd2475f6600`);
  Traefik, runner, Hermes, Payload, PostgreSQL, produção e staging preservados.
- Dados do n8n preservados: `users=1`, `workflows=3` (3 ativos), `credentials=5`
  (antes) → `credentials=6` (após, a nova credencial criptografada).
- Workflow `CV — Hermes Editorial — Connectivity Validation` (INATIVO) executado
  uma única vez: health 200, validate 200; `createJob` 503 e `getJob` 404.
- Auditoria n8n: custom node (esperado), instância desatualizada (esperado),
  credencial sem workflow ativo (esperado); demais achados pré-existentes.
- 34 testes do node; CI com 3 jobs aprovado.

Continuam pendentes: execução editorial real, webhook de produção e conteúdo
(Fase 9); produção e DNS.

## Hardening do repositório público — 25 de agosto de 2026

Controle transversal pós-Fase 3C, sem iniciar a Fase 4: o CI passa a possuir
quatro jobs, incluindo Gitleaks sobre todo o histórico. Actions externas ficam
pinadas por SHA, checkouts não persistem credenciais e as permissões são
limitadas a leitura de conteúdo. Após CI verde no PR e no merge commit, a
`main` deve exigir PR, quatro checks atualizados, conversas resolvidas e regras
para administradores, bloqueando force-push e exclusão. Produção, staging e os
oito containers permanecem inalterados; a execução do Hermes continua
desabilitada. Duas ocorrências históricas do Gitleaks foram confirmadas como
fixtures de teste e recebem exceção exclusivamente por fingerprint exato.

## Remediação de advisories do PR #8 — 27 de agosto de 2026

A triagem foi repetida no mesmo HEAD `0319d49e0e0465e10d274a4beadc746c5a74bb77`
antes da atualização. O registro histórico de 14 ocorrências não foi
reproduzido: a base atual do npm retornou 42 ocorrências no audit completo e 21
com `--omit=dev`. A divergência decorre da atualização temporal da base de
advisories, da propagação de um advisory por vários nós afetados e da diferença
de escopo entre audit completo e runtime; não houve evidência de mudança de
código entre o registro de 14 e a nova consulta.

Remediação mínima aplicada:

- `next` e `eslint-config-next`: 16.2.9 → 16.3.0. A versão 16.2.11 corrige os
  advisories próprios do Next, mas ainda fixa PostCSS 8.4.31 e restringe Sharp a
  `^0.34.5`; 16.3.0 é a primeira versão estável que resolve PostCSS 8.5.23 e
  Sharp `^0.35.3` pela cadeia pai;
- `vitest`: 4.0.18 → 4.1.0, eliminando GHSA-5xrq-8626-4rwp /
  CVE-2026-47429 sem mudança major;
- `vite` 7.3.6 fixado diretamente para impedir que o range amplo do Vitest
  selecione Vite 8 e produza uma árvore inválida no npm 11;
- `js-yaml` 4.3.2 e `brace-expansion` 1.1.18/5.0.9 resolvidos dentro dos ranges
  já aceitos pelos pacotes pais;
- os quatro pacotes Payload permanecem alinhados em 3.88.0, versão estável mais
  recente, cujo peer range aceita Next `>=16.2.6 <17`; React permanece 19.2.7;
- nenhum override, mudança major, migration ou alteração de schema foi usado.

Resultado do audit:

| Escopo | Antes | Depois |
| --- | --- | --- |
| Completo | 42: 2 baixas, 8 moderadas, 31 altas, 1 crítica | 11: 5 baixas, 6 moderadas, 0 altas, 0 críticas |
| `--omit=dev` | 21: 2 baixas, 5 moderadas, 14 altas, 0 críticas | 11: 5 baixas, 6 moderadas, 0 altas, 0 críticas |

Os 11 nós restantes propagam apenas dois riscos-raiz sem correção compatível
publicada pelos pacotes pais:

1. DOMPurify 3.4.8, dependência exata do Monaco Editor 0.56.0, usado pela UI do
   Payload. Não há release estável posterior do Monaco e não foi aplicado
   override. A exploração depende de configurações/hook de sanitização não
   usados diretamente pela aplicação.
2. esbuild 0.18.20, trazido por
   `@payloadcms/db-postgres → drizzle-kit → @esbuild-kit/esm-loader`. O advisory
   depende de servidor de desenvolvimento do esbuild exposto à rede; esse
   servidor não é iniciado nos scripts, build, migrations ou runtime. Payload
   3.88.0 continua sendo a versão estável mais recente.

Validações locais aprovadas: instalação limpa; árvore npm sem pacotes inválidos
ou extraneous; lint sem erros; typecheck; 69 testes da aplicação, 32 do runner e
34 do conector; tipos e import map do Payload; duas migrations existentes
aplicadas e confirmadas em PostgreSQL 16 descartável; build Next.js/Webpack;
imagem Docker multi-stage; arquivos Compose; standalone contendo Next 16.3.0 e
Sharp 0.35.3 sem Vitest; home, conteúdos, admin desautenticado, APIs, health,
robots, sitemap e 404; carregamento e transformação de imagem pelo Sharp.

O PR #8 permanece aberto e draft. A homologação visual humana nos cinco
viewports continua pendente. Nenhum staging, produção, container ativo, banco
persistente, DNS, Traefik, n8n ou Hermes foi alterado.
