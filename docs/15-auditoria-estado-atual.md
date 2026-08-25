# Auditoria do estado atual

Data da auditoria: 23 de agosto de 2026.

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
