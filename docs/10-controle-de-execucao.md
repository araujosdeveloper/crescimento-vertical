# Controle de execução

## Aceite humano e encerramento da Fase 5 — 29 de agosto de 2026

O responsável pelo produto aprovou os hubs editoriais vazios, busca e filtros,
política editorial, política de correções, novos campos no Admin, ausência de
conteúdo fictício, preservação das páginas comerciais e a navegação hierárquica
reorganizada. A regressão do Header foi encerrada: primeiro nível curto,
Contato dentro de Empresa, menu compacto de tablet, espaçamento corrigido e
nenhum título cortado. A Fase 5 está concluída; nenhuma fase posterior foi
iniciada. Permanecem os gates pré-produção de homologação responsiva integral e
concretização da copy comercial da Fase 4.

## Correção de navegação da Fase 5 — 28 de agosto de 2026

Evidência humana identificou menu desktop longo, Contato cortado, competição
entre logo/links/CTA e overflow em tablet horizontal. A correção reorganizou a
navegação em Início, Conteúdos, Soluções, Empresa e Solicitar diagnóstico, com
dropdowns acessíveis no desktop e accordion no mobile/tablet. O breakpoint
adotado é 1180px; não houve migration, seed, alteração de dados ou dependência.
Testes de componente, lint, typecheck, build e diff foram executados. A
responsividade integral permanece gate obrigatório pré-produção.

Este documento é o quadro de controle. O detalhamento das fases permanece em
../ROTEIRO-MESTRE.md.

## Situação

- Estado consolidado em 30 de agosto de 2026: Fases 0–7 concluídas; Fases 8–12
  pendentes; nenhuma fase em execução.
- Fase 7 encerrada após aceite humano do formulário, captação real única,
  consentimento versionado, outbox idempotente e recebimento da notificação
  SMTP sem PII.
- Gates pré-produção preservados: homologação responsiva integral nos cinco
  viewports e concretização da copy comercial da Fase 4.

- Fase ativa: Fase 5 — Portal editorial e experiência de leitura, iniciada em
  28 de agosto de 2026 a partir da `main` `e153f50f9591cf74f804d57a0e213acad463fd17`.
- Fases 0–4 concluídas; Fases 6–12 pendentes.
- Gates pré-produção preservados: homologação responsiva integral e
  concretização da copy comercial da Fase 4.

- Fase ativa: nenhuma; a Fase 4 — Arquitetura pública e páginas comerciais foi
  concluída com ressalva em 28 de agosto de 2026.
- Última fase concluída: Fase 4, com Fases 0–3 preservadas como concluídas.
- Próxima fase: Fase 5, pendente e não iniciada.
- Produção alterada por este planejamento: não.
- Deploy realizado: staging atualizado previamente; nenhum novo deploy nesta
  sessão.

A homologação responsiva completa foi postergada por decisão expressa do
responsável pelo produto (ADR-023) para o hardening visual final. A pendência
não bloqueia as próximas implementações, porém continua bloqueando produção e
não dispensa navegação por teclado, foco visível, ausência de overflow nem os
cinco viewports obrigatórios. O aceite humano da Fase 4 também registrou
ressalva: parte do copy comercial é abstrata e exige concretização obrigatória
antes da produção, sem inventar resultados, clientes, métricas ou garantias.

O escopo ativo comprova as antecipações da Fase 2A e corrige somente lacunas
reais de autenticação, autorização, preview, migrations, mídia e recuperação.
As antecipações 2A, 2B, 3A, 3B e 3C permanecem preservadas; coleções e
capacidades pertencentes às Fases 4, 5, 7 e 9 não serão antecipadas.

O catálogo comercial da Fase 4 segue o ADR-024: seis pilares, modelos
`services`/`cases`, seed idempotente somente de serviços e páginas públicas e
legais. Produção, n8n e Hermes permanecem inalterados. Nenhuma fase está em
execução; a Fase 5 continua pendente.

Gates pré-produção preservados: (1) homologação responsiva integral; (2)
concretização dos textos comerciais da Fase 4.

## Registro da sessão 2026-08-28 — aceite humano e encerramento da Fase 3

| Campo | Evidência |
| --- | --- |
| Base | `main` e `origin/main` em `d0f7b33f19dc00a8053aa8c0f42359a417182ee0`; tag da Fase 2 no mesmo commit |
| Branch | `feat/phase-3-cms-authentication`; merge-base exato com a base |
| Lacunas reais | preview seguro; inativo bloqueado; restrição de edição publicada para editor/automation; ciclo e recuperação automatizados |
| Preservado | sete coleções, cinco papéis, migrations, PostgreSQL e mídia da Fase 2A; antecipações 2B/3A/3B/3C |
| Descartável | dois PostgreSQL 16 em tmpfs; mídia em `/tmp`; containers removidos após a evidência |
| Ciclo | cinco papéis, mídia, fonte, dossiê, draft, revisão, aprovação, publicação, arquivamento, versões, preview e autoelevação |
| Restauração | `pg_restore --list`, restore isolado, migrations idempotentes, autenticação, relações, versões, mídia e visibilidade validadas |
| Produção | não alterada |
| Próxima ação | integrar o PR #9, criar tag e backup final; não iniciar a Fase 4 |

### Resultado do CI e staging — 28 de agosto de 2026

O PR draft #9 está aberto, mergeável e sem reviews ou conversas bloqueadoras,
com HEAD `89c67c37f1b3de2c2b8f66dd59213e484b0d392d`. O run
`33165627510` terminou com os quatro jobs obrigatórios verdes: aplicação
(incluindo ciclo CMS), runner Hermes, conector n8n e secret-scan.

Foi criado o backup pré-deploy
`/opt/backups/crescimento-vertical/phase3-predeploy-89c67c3-20260828-0408`;
SHA-256, bundle, dump e catálogo `pg_restore` foram validados. Como houve
alteração funcional, somente `cv-phase2-staging-app` foi recriado com a imagem
`cv-phase2-staging-app:phase3-89c67c3`; PostgreSQL, mídia e os outros sete
containers permaneceram preservados. Após corrigir a invocação do Compose para
usar o arquivo de ambiente existente (sem expor valores), app e PostgreSQL
estão healthy, `/`, `/conteudos`, `/admin`, APIs, live/ready e 404 respondem
corretamente, preview anônimo responde 401 e o acesso externo sem BasicAuth
responde 401. O banco mantém um admin, zero conteúdo persistente e duas
migrations aplicadas.

O aceite humano foi recebido em 28 de agosto de 2026: login administrativo,
painel Payload, sete coleções, Articles vazio, administrador ativo, logout e
bloqueio anônimo aprovados. Nenhum dado de teste foi criado no staging. O ciclo
editorial descartável, preview seguro e backup/restauração isolada já estavam
comprovados. A Fase 3 está concluída; nenhuma fase está em execução e a Fase 4
permanece pendente. O PR #9 segue draft até a integração autorizada.

## Gate para iniciar a Fase 1

- [x] Repositório correto confirmado.
- [x] Estado atual inventariado.
- [x] Missão e escopo registrados.
- [x] Arquitetura alvo registrada.
- [x] Responsabilidade do Hermes registrada.
- [x] Política editorial registrada.
- [x] Critérios de qualidade e segurança registrados.
- [x] Autorização do responsável para iniciar a Fase 1.

## Checklist da Fase 1

Itens executados exigem evidência; os demais permanecem bloqueados.

- [x] Confirmar ausência de implantação anterior na VPS-alvo; commit implantado:
  nenhum.
- [x] Auditar containers, redes, volumes e portas.
- [x] Confirmar DNS, TLS e redirects www/apex.
- [x] Inventariar variáveis sem expor valores.
- [x] Criar backup pré-mudança.
- [x] Verificar restauração do backup.
- [x] Registrar commit-base local: 5b461252037f6670be7d8cd4095c5d202f97ae5d.
- [x] Executar npm ci, lint, typecheck e build.
- [x] Registrar baseline visual.
- [x] Remover telefone fictício e tornar o contato configurável.
- [x] Confirmar e configurar ao menos um canal real (e-mail; WhatsApp opcional).
- [x] Criar branch feat/portal-phase-1-baseline.
- [x] Criar staging protegido/noindex.
- [x] Criar healthchecks live e ready.
- [x] Gerar aplicação Next.js em modo standalone.
- [x] Executar smoke test HTTP da home e dos healthchecks.
- [x] Validar sintaxe YAML do Docker Compose.
- [x] Construir e validar imagem Docker em ambiente com Docker.
- [x] Demonstrar rollback.
- [x] Atualizar auditoria com evidências.

## Fechamento formal da Fase 1 — 26 de agosto de 2026

| Gate | Evidência atual |
| --- | --- |
| Containers | Oito containers-alvo inspecionados; todos `running`; cinco `healthy` e três sem healthcheck declarado |
| Redes e portas | Seis redes e quinze volumes inventariados; PostgreSQL, app, staging, runner e Hermes sem porta pública nova |
| DNS/TLS | Staging resolve, redireciona HTTP→HTTPS e possui TLS válido; apex/www continuam na infraestrutura anterior e permanecem fora desta migração |
| Variáveis | Chaves obrigatórias inventariadas por nome; valores não registrados |
| Contato | E-mail operacional válido configurado no staging; WhatsApp ausente e opcional |
| Baseline visual | Home e `/conteudos` homologados em 360/390/768/1024/1440 px em 25/08; imagens e identidade atuais preservadas como referência |
| Staging | 401 sem autenticação, `X-Robots-Tag` presente; home, admin e healthchecks internos 200 |
| Backup/rollback | Dois backups da Fase 1 com SHA-256 e bundles verificados novamente |
| Dados | Um administrador preservado; coleções editoriais vazias |

O 502/certificado incompatível atualmente observado em apex/www pertence à
infraestrutura anterior, já registrada, e não ao staging da VPS. A migração
de produção/DNS continua fora do escopo. As antecipações 2A–3C permanecem
válidas, mas não foram usadas como substitutas automáticas deste gate.

## Evidências locais da Fase 1

| Verificação | Resultado |
| --- | --- |
| npm ci | Aprovado, 361 pacotes |
| ESLint | Aprovado |
| TypeScript | Aprovado |
| Next.js build | Aprovado |
| Rotas | /, /api/health/live e /api/health/ready |
| Standalone | server.js gerado |
| Smoke HTTP | Home 200, live ok, ready ready |
| Contato fictício | Ausente do HTML gerado |
| Docker Compose | YAML válido; Docker não disponível nesta sessão |

## Evidências iniciais da VPS-alvo — 2026-08-24

| Campo | Evidência |
| --- | --- |
| Destino | VPS-alvo confirmada; identificadores mantidos fora do Git público |
| Implantação anterior | Ausente; instalação será nova |
| Capacidade | Aprovada para o baseline; margem de memória e disco confirmada |
| Runtime | Docker e Docker Compose compatíveis |
| Serviços preservados | Hermes, n8n, Traefik e cargas existentes ativos |
| Proxy | Portas web públicas e redirect HTTP para HTTPS confirmados |
| Rede | Integração externa do proxy disponível |
| Router do domínio | Nenhum conflito encontrado |
| DNS apex | Ainda aponta para a infraestrutura anterior |
| HTTPS apex | Falha de validação; certificado não corresponde ao hostname |
| HTTPS www | Falha de validação; certificado não corresponde ao hostname |
| Resolver ACME | mytlschallenge por TLS challenge |
| Compatibilidade do projeto | Labels atuais do site usam o mesmo entrypoint e resolver |
| Risco preexistente | Processo público fora do Docker documentado no registro privado |
| Regra de preservação | Não alterar os serviços existentes durante o baseline |

Os identificadores, endereços, métricas e caminhos internos completos ficam em
`.private/vps-audit-2026-08-24.md`, ignorado pelo Git.

## Evidências da imagem e do container — 2026-08-24

| Verificação | Resultado |
| --- | --- |
| Commit-base implantado | b71b52a8c0cdd4442a1c6244e61a53f8f57b532c |
| npm ci | Aprovado |
| npm run check | Aprovado |
| ESLint | Aprovado |
| TypeScript | Aprovado |
| Next.js build | Aprovado |
| docker compose build | Aprovado |
| Imagem | crescimento-vertical-crescimento-vertical |
| Subida do container | --no-build e --wait |
| Estado do container | healthy em cerca de 6 s |
| GET /api/health/live | {"status":"ok"} |
| GET /api/health/ready | {"status":"ready"} |
| Traefik apex | crescimentovertical.com → HTTP 200 |
| Traefik www | www.crescimentovertical.com → HTTP 200 |
| Processo Next.js | Iniciado em 0.0.0.0:3000 |
| TLS local | Resultado 18; o DNS ainda aponta para a infraestrutura anterior — não é TLS de produção aprovado |
| Dependência do runtime | libatomic1 adicionado à VPS para executar o Node instalado |
| DNS | Nenhuma alteração |
| Serviços existentes | Hermes, n8n, Traefik e demais preservados |

## Evidências de backup, restauração e rollback — 2026-08-24

| Verificação | Resultado |
| --- | --- |
| Git bundle | Criado com main e feat/portal-phase-1-baseline |
| Integridade do bundle | Verificado; histórico completo declarado |
| Commit incluído | 8f9d82d0372e7796bb4fd2cb540eec3e1a280af6 |
| Imagem de rollback | Criada a partir do baseline da aplicação |
| Export da imagem | Imagem exportada para arquivo |
| Configurações de recuperação | Preservadas |
| Checksums | SHA-256 gerados para os arquivos do backup |
| Permissões | Arquivos do backup com 600 |
| Recarga da imagem | Imagem de rollback carregada novamente com sucesso |
| Container de prova | Descartável, sem portas públicas e sem labels do Traefik |
| Probe live | {"status":"ok"} |
| Probe ready | {"status":"ready"} |
| Limpeza | Probe descartável removido após o teste |
| Aplicação principal | Permaneceu running e healthy |
| Serviços existentes | Nenhum serviço foi interrompido |
| Tamanho do backup local | Aproximadamente 76 MB |
| Cópia off-site | Não executada; permanece pendente |

## Registro da sessão 2026-08-23

| Campo | Conteúdo |
| --- | --- |
| Branch/commit | feat/portal-phase-1-baseline |
| Fase | 1 |
| Objetivo | Baseline local e endurecimento operacional |
| Alterações | Contato configurável, healthchecks, standalone e Docker |
| Validações | npm ci, ESLint, TypeScript, build e smoke HTTP |
| Riscos | VPS, backup, staging, Docker real e contatos ainda pendentes |
| Próxima ação | Auditar VPS e confirmar contatos reais |

## Registro da sessão 2026-08-24

| Campo | Conteúdo |
| --- | --- |
| Branch/commit | feat/portal-phase-1-baseline |
| Fase | 1 |
| Objetivo | Confirmar a VPS oficial e o estado anterior à implantação |
| Alterações | VPS-alvo fixada; implantação nova confirmada |
| Validações | Hostname, /opt e contêineres ativos inspecionados |
| Riscos | DNS no destino anterior, TLS inválido, risco preexistente privado, volumes e contatos pendentes |
| Próxima ação | Publicar a branch técnica e preparar implantação controlada |

## Registro da sessão 2026-08-24 — validação da imagem Docker

| Campo | Conteúdo |
| --- | --- |
| Branch/commit | feat/portal-phase-1-baseline @ b71b52a8c0cdd4442a1c6244e61a53f8f57b532c |
| Fase | 1 |
| Objetivo | Construir e validar a imagem Docker real na VPS |
| Alterações | Nenhuma em código; somente validação operacional |
| Validações | docker compose build, healthchecks live/ready, Traefik apex/www |
| Riscos | DNS na infraestrutura anterior, TLS local inválido, backup, contatos, staging e rollback pendentes |
| Próxima ação | Executar backup/rollback e confirmar contatos reais |

## Registro da sessão 2026-08-24 — backup, restauração e rollback

| Campo | Conteúdo |
| --- | --- |
| Branch/commit | feat/portal-phase-1-baseline @ 8f9d82d0372e7796bb4fd2cb540eec3e1a280af6 |
| Fase | 1 |
| Objetivo | Comprovar backup, restauração e rollback sem afetar a aplicação principal |
| Alterações | Nenhuma em código; somente evidências operacionais registradas |
| Validações | Git bundle, imagem de rollback, checksums SHA-256, recarga da imagem, probe live/ready |
| Riscos | Cópia off-site, contatos reais, staging e DNS/TLS de produção pendentes |
| Próxima ação | Confirmar contatos reais, staging e DNS/TLS de produção |

## Registro da sessão 2026-08-24 — estrutura de staging preparada

| Campo | Conteúdo |
| --- | --- |
| Branch/commit | feat/portal-phase-1-baseline |
| Fase | 1 |
| Objetivo | Preparar staging protegido por autenticação e noindex |
| Alterações | Controle de indexação (SITE_NOINDEX, metadata robots, robots.ts), docker-compose.staging.yml, .env.staging.example, documentação |
| Validações | npm ci, npm run check, docker compose config e build do staging, git diff --check |
| Riscos | Staging ainda não subido; DNS e publicação não executados |
| Próxima ação | Gerar hash BasicAuth real, criar .env.staging (600) e subir staging quando autorizado |

## Registro da sessão 2026-08-24 — validação do staging protegido

| Campo | Conteúdo |
| --- | --- |
| Branch/commit | feat/portal-phase-1-baseline |
| Fase | 1 |
| Objetivo | Ativar e validar o staging protegido por autenticação e noindex |
| Alterações | Nenhuma em código, configuração, containers, DNS ou credenciais; somente documentação |
| Validações | BasicAuth 401/200, TLS, X-Robots-Tag, robots.txt, healthchecks live/ready, produção running/healthy |
| Riscos | DNS @/www ainda na infraestrutura anterior; homologação visual pendente |
| Próxima ação | Inspeção visual e homologação do staging |

## Registro da sessão 2026-08-24 — fundação editorial (Fase 2A)

| Campo | Conteúdo |
| --- | --- |
| Branch/commit | feat/portal-phase-2-editorial-foundation |
| Fase | 2A (fundação editorial em código) |
| Objetivo | Integrar Payload + PostgreSQL, coleções, permissões, migrações, testes e CI |
| Alterações | Payload 3.88.0, adaptador Postgres, 7 coleções, papéis, workflow, migração inicial, tipos, Dockerfile, Compose de validação, Vitest, GitHub Actions, documentação |
| Validações | npm ci, lint, typecheck, 38 testes, generate:types, migrate/migrate:status em banco descartável, docker compose config, next build |
| Riscos | Deploy, credenciais reais, primeiro usuário admin e integração Hermes/n8n permanecem pendentes |
| Próxima ação | Gate da Fase 1/2 e preparação do deploy da Fase 3 quando autorizado |

## Registro da sessão 2026-08-24 — deploy blue-green do staging (Fase 2A)

| Campo | Conteúdo |
| --- | --- |
| Branch/commit | feat/portal-phase-2-editorial-foundation |
| Fase | 2A (ativação no staging em blue-green) |
| Objetivo | Subir Payload + PostgreSQL em staging isolado, sem tocar produção/staging antigo |
| Alterações | Dockerfile (alvo migrate + npm pinado), docker-compose.phase2.yml (blue-green, hardening, Traefik toggle), docs |
| Validações | compose config, build, postgres healthy, migrate + migrate:status, app healthy, HTTP interno (200/403), público 401 + X-Robots-Tag + TLS, ausência de dados editoriais |
| Riscos | Teste autenticado e primeiro usuário admin permanecem manuais; rollback não executado (documentado) |
| Próxima ação | Operador: teste autenticado e criação do primeiro administrador no /admin |

## Registro da sessão 2026-08-24 — validação final da Fase 2A no staging

| Campo | Conteúdo |
| --- | --- |
| Branch/commit | feat/portal-phase-2-editorial-foundation @ 8db009006701a7ab51d6e8ee623cfa90e4906cf1 |
| Fase | 2A (validação final no staging) |
| Objetivo | Registrar documentalmente a validação da fundação editorial ativada no staging |
| Alterações | Nenhuma em aplicação, containers, banco, credenciais ou configuração; somente documentação |
| Validações | Git local/remoto sincronizado, State/Health dos quatro containers, backup integral (700/600, SHA-256, bundle verify, pg_restore --list, tar), coleções vazias (users=1 admin, demais=0), migrations aplicadas, rotação BasicAuth |
| Riscos | Rotação BasicAuth pendente; páginas públicas, conteúdo real, Hermes/n8n, produção editorial e migração @/www permanecem pendentes |
| Próxima ação | Confirmar rotação BasicAuth e prosseguir para a Fase 3 quando autorizado |

## Registro da sessão 2026-08-24 — conclusão da rotação BasicAuth

| Campo | Conteúdo |
| --- | --- |
| Branch/commit | feat/portal-phase-2-editorial-foundation |
| Fase | 2A (pós-validação — operação) |
| Objetivo | Registrar a conclusão efetiva da rotação BasicAuth |
| Alterações | Nenhuma em aplicação, banco, containers ou credenciais; somente documentação |
| Validações | Backup pré-rotação difere do estado atual; novo hash idêntico em `.env.staging` e `.env.phase2.staging` e nos labels BasicAuth dos dois containers; TLS válido, 401 sem autenticação; produção, staging antigo, candidate e PostgreSQL running/healthy |
| Riscos | Páginas públicas, conteúdo real, Hermes/n8n, produção editorial e migração @/www permanecem pendentes |
| Próxima ação | Prosseguir para a Fase 3 quando autorizado |

## Registro da sessão 2026-08-25 — portal editorial público (Fase 2B)

| Campo | Conteúdo |
| --- | --- |
| Branch/commit | feat/portal-phase-2b-public-editorial |
| Fase | 2B (portal editorial público em código) |
| Objetivo | Expor o conteúdo editorial publicamente, com SEO, cache e segurança, sem Hermes/n8n |
| Alterações | Camada pública server-only (`src/lib/editorial/`), DTOs, rotas `/conteudos`, `/categorias/[slug]`, `/autores/[slug]`, `/feed.xml`, sitemap, seção na home, campo `featured` + migration, cache/revalidação, testes |
| Validações | npm ci, lint, typecheck, 60 testes, generate:types/importmap, migrate/migrate:status em PostgreSQL descartável, next build, git diff --check, auditoria de segredos |
| Riscos | Deploy, homologação visual, conteúdo real, Hermes/n8n, produção editorial e migração @/www permanecem pendentes |
| Próxima ação | Prosseguir para as fases seguintes quando autorizado |

## Registro da sessão 2026-08-25 — deploy do portal editorial público no staging (Fase 2B)

| Campo | Conteúdo |
| --- | --- |
| Branch/commit | feat/portal-phase-2b-public-editorial @ bdb129f6eb0b7f6d1f4a779ab2005023b515e3d2 |
| Fase | 2B (deploy isolado no staging blue-green) |
| Objetivo | Implantar o portal editorial público no candidato, aplicar a migration e validar |
| Alterações | Backup pré-deploy, migration Fase 2B aplicada, recriação de `cv-phase2-staging-app`, `SITE_NOINDEX` no runtime do compose, imagem marcada `phase2b-staging-bdb129f`, docs/20 |
| Validações | HTTP interno (200/404, XML, estados vazios), externo (401, TLS, X-Robots-Tag), agregados do banco antes/depois, IDs dos containers, backup (sha256sum, bundle verify, pg_restore --list, docker load) |
| Riscos | Homologação visual, conteúdo editorial real, produção e DNS ainda não migrados; Hermes/n8n não iniciados |
| Próxima ação | Inspeção visual e PR em rascunho com CI |

## Registro da sessão 2026-08-25 — homologação visual da Fase 2B

| Campo | Conteúdo |
| --- | --- |
| Branch/commit | feat/portal-phase-2b-public-editorial @ 3855f32 (runtime homologado) |
| Fase | 2B (fechamento — aceite visual) |
| Objetivo | Registrar o aceite visual do portal editorial público no staging |
| Alterações | Somente documentação (docs/10, docs/15, docs/19 e docs/20) |
| Validações | Home e `/conteudos` (estado vazio) homologados; responsividade aprovada em 360/390/768/1024/1440 px; ausência de conteúdo fictício |
| Riscos | Páginas populadas serão reavaliadas com o primeiro conteúdo real; produção e DNS permanecem pendentes; Hermes/n8n não iniciados |
| Próxima ação | Validar PR/CI e executar merge protegido da Fase 2B |

## Registro da sessão 2026-08-25 — auditoria e contrato Hermes/n8n (Fase 3A)

| Campo | Conteúdo |
| --- | --- |
| Branch/commit | feat/phase-3a-hermes-n8n-audit-contract |
| Fase | 3A (auditoria e contrato da integração Hermes/n8n, documental) |
| Objetivo | Auditar Hermes/n8n e fixar o contrato de integração, sem integrar |
| Alterações | ADR-016, docs/21 (auditoria), docs/22 (contrato), JSON Schema `editorial-dossier.v1`, docs/00, docs/15, ROTEIRO-MESTRE |
| Validações | Auditoria somente leitura dos contêineres Hermes/n8n; JSON Schema válido; nenhum contêiner/credencial/configuração alterado |
| Riscos | Serviços compartilhados (isolamento lógico necessário); imagens `:latest`; perfis do Hermes a confirmar na Fase 8 |
| Próxima ação | Criar perfil/skill do Hermes e workflows n8n (Fases 8/9) quando autorizado |

## Registro da sessão 2026-08-25 — perfil Hermes editorial e runner (Fase 3B)

| Campo | Conteúdo |
| --- | --- |
| Branch/commit | feat/phase-3b-hermes-editorial-runner |
| Fase | 3B (perfil Hermes editorial + runner interno isolado) |
| Objetivo | Criar a distribuição do perfil, a skill, o runner HMAC e o container, sem execução |
| Alterações | Distribuição `hermes/crescimento-vertical-editorial/`, skill editorial, schema `editorial-research-request.v1`, runner `services/hermes-editorial-runner/`, `docker-compose.hermes-editorial.yml`, segredos locais, docs/23–25, ADR-018 |
| Validações | 32 testes do runner; 4 schemas Draft 2020-12; build da imagem; `docker compose config`; container healthy; smoke 200/401/503/404; IDs dos 7 contêineres preservados |
| Riscos | Execução desabilitada (dupla trava); imagens `:latest`; secret em bind mount legível pelo runner |
| Próxima ação | Habilitar execução e criar o webhook n8n (Fase 9) quando autorizado |

## Registro da sessão 2026-08-25 — conector n8n ↔ Hermes (Fase 3C)

| Campo | Conteúdo |
| --- | --- |
| Branch/commit | feat/phase-3c-n8n-hermes-connector |
| Fase | 3C (conector n8n → runner, validate-only) |
| Objetivo | Conectividade/autenticação/validação n8n ↔ Hermes, sem execução |
| Alterações | Node privado `n8n-nodes-crescimento-vertical`, imagem `cv-n8n-hermes-connector`, Compose n8n, workflow de conectividade, credencial HMAC, CI, docs/26–27, ADR-019 |
| Validações | 34 testes do node; 4 schemas; CI (3 jobs); workflow validate-only (health 200, validate 200, createJob 503, getJob 404); n8n audit |
| Riscos | Execução do Hermes desabilitada; n8n `:latest` sem pin persistente; node customizado sinalizado na auditoria |
| Próxima ação | Habilitar execução e fechar o ciclo editorial (Fase 9) quando autorizado |

## Registro por sessão

## Registro da sessão 2026-08-29 — candidato da Fase 6 em staging

| Campo | Conteúdo |
| --- | --- |
| Branch/commit | `feat/phase-6-seo-performance` / candidato `65d1c60` |
| Fase | 6 — SEO técnico, dados estruturados e performance, em execução |
| Objetivo | Consolidar indexação, metadata, schemas e entrega pública e parar no aceite humano |
| Alterações | Canonical/OG/Twitter, JSON-LD seguro, robots/sitemap, imagem LCP, testes, ADR-026 e documentação |
| Validações | 90 testes da aplicação; CMS/recuperação descartáveis; runner 32; conector 34; builds Next/Docker; quatro checks verdes; staging healthy e smokes sem 5xx |
| Riscos | Lighthouse/CWV de navegador indisponíveis no host; GSC/GA4 dependem de lançamento, credencial e consentimento |
| Próxima ação | Aceite humano no staging; não fazer merge, produção ou Fase 7 |

## Registro da sessão 2026-08-28 — fechamento técnico da Fase 2

| Campo | Conteúdo |
| --- | --- |
| Branch/commit | feat/phase-2-portal-foundation @ 575e232 (candidato de staging antes do commit documental) |
| Fase | 2 — Fundação do portal e design system, tecnicamente concluída |
| Objetivo | Registrar a aceitação técnica e transferir a homologação responsiva completa para o hardening visual final |
| Alterações | Somente documentação; ADR-023; nenhum código, dependência, migration, schema, Docker, workflow ou runtime |
| Validações | Staging healthy no HEAD 575e232; PR #8 mergeável; quatro checks verdes; Header/Hero em 390 × 844 aprovados pelo responsável |
| Riscos | Homologação completa dos cinco viewports, rotas públicas, teclado, foco e overflow permanece gate obrigatório antes de produção |
| Próxima ação | Encerrar e integrar o PR #8 sem iniciar a Fase 3 nesta execução |

## Registro da sessão 2026-08-27 — fundação do portal em staging

| Campo | Conteúdo |
| --- | --- |
| Branch/commit | feat/phase-2-portal-foundation @ ac7eb19 (imagem) |
| Fase | 2 — Fundação do portal e design system |
| Objetivo | Consolidar layout, navegação, tokens, acessibilidade, testes e candidato de staging |
| Alterações | Route groups públicos, SiteShell, componentes estruturais/estados, contratos TypeScript, tokens semânticos e testes DOM |
| Validações | 69 testes Node/Payload/Fase 2; runner 32; conector 34; lint, typecheck, build, generate, migrations descartáveis, Compose; quatro checks verdes; staging healthy e smoke HTTP |
| Backup/rollback | phase2-foundation-predeploy-ac7eb19-20260827-011500 validado; restaurar a imagem anterior e recriar somente app |
| Riscos | 14 avisos do npm audit herdados exigem triagem posterior; homologação visual humana nos cinco viewports pendente |
| Próxima ação | Homologar visualmente o PR draft; não fazer merge nem alterar produção |

## Registro da sessão 2026-08-27 — Constituição e reconciliação documental

| Campo | Conteúdo |
| --- | --- |
| Branch/commit | feat/phase-2-portal-foundation |
| Fase | 2 — Fundação do portal e design system, em execução |
| Objetivo | Integrar a Constituição sanitizada e reconciliar a documentação do estado atual |
| Alterações | Constituição na raiz, protocolo em AGENTS.md, índice, README, Hermes, ADR-022 e auditoria reconciliados |
| Validações | SHA-256 e identidade de bytes, links Markdown, ordem de leitura, escopo do diff, whitespace e auditorias de segredos/inventário operacional |
| Riscos | Homologação visual humana pendente; vulnerabilidades do npm exigem triagem antes do merge |
| Próxima ação | Homologação visual humana do candidato de staging |

## Registro da sessão 2026-08-25 — hardening do repositório público

| Campo | Conteúdo |
| --- | --- |
| Branch/commit | chore/public-repository-hardening |
| Fase | Controle transversal pós-Fase 3C; Fase 4 não iniciada |
| Objetivo | Proteger a main, fixar actions por SHA e tornar o Gitleaks obrigatório sobre todo o histórico |
| Alterações | CI, documentação, ADR-020 e proteção remota da main após merge verde |
| Validações | YAML, `uses:`, diff, segredos, quatro jobs no PR e na main, releitura da proteção e backup documental |
| Riscos | Secret scanning/push protection dependem da disponibilidade da API/plano; runtime da VPS permanece fora do escopo |
| Próxima ação | Nenhuma fase funcional iniciada; manter os controles e tratar alertas de segurança |

## Registro da sessão 2026-08-27 — remediação de dependências do PR #8

| Campo | Conteúdo |
| --- | --- |
| Branch/commit | feat/phase-2-portal-foundation |
| Fase | 2 — Fundação do portal e design system, em execução |
| Objetivo | Remediar advisories confirmados sem mudança major, override ou alteração funcional |
| Alterações | Next.js e eslint-config-next 16.2.9 → 16.3.0; Vitest 4.0.18 → 4.1.0; Vite 7.3.6 fixado como dependência direta de desenvolvimento; js-yaml, brace-expansion, PostCSS e Sharp atualizados pela resolução legítima dos pacotes pais; Payload preservado em 3.88.0 e React em 19.2.7 |
| Audit antes/depois | Completo: 42 (2 baixas, 8 moderadas, 31 altas, 1 crítica) → 11 (5 baixas, 6 moderadas, 0 altas, 0 críticas). `--omit=dev`: 21 (2 baixas, 5 moderadas, 14 altas) → 11 (5 baixas, 6 moderadas, 0 altas, 0 críticas) |
| Validações | `npm ci`; `npm ls --all` sem invalid/extraneous; lint; typecheck; 69 testes da aplicação; 32 do runner; 34 do conector; generate:types/importmap; migrations e status em PostgreSQL 16 descartável; build Next/Webpack; build Docker runner; Compose; standalone sem Vitest; smokes HTTP e Sharp |
| Riscos | Restam somente achados baixos/moderados transitivos do Payload 3.88.0: DOMPurify 3.4.8 fixado pelo Monaco 0.56.0 e esbuild 0.18.20 da cadeia drizzle-kit; sem versão pai compatível corrigida e sem servidor vulnerável exposto pelo projeto |
| Estado do PR | PR #8 deve permanecer aberto e draft; homologação visual humana nos cinco viewports continua pendente |
| Próxima ação | Aguardar os quatro checks do novo HEAD; não fazer merge nem alterar runtime |

Ao concluir uma sessão de trabalho, registrar:

| Campo | Conteúdo |
| --- | --- |
| Data | AAAA-MM-DD |
| Branch/commit | Identificador |
| Fase | Número e nome |
| Objetivo | Entrega prevista |
| Alterações | Arquivos e comportamento |
| Validações | Comandos e resultados |
| Riscos | Pendências reais |
| Próxima ação | Um passo objetivo |

## Regras do quadro

- Marcar item somente após evidência.
- Não substituir evidência por “aparenta funcionar”.
- Se um item for removido, registrar ADR.
- Falha reabre o item correspondente.
- Fase só muda de estado após todos os critérios de saída.

## Registro da sessão 2026-08-29 — início da Fase 7

| Campo | Conteúdo |
| --- | --- |
| Data | 2026-08-29 |
| Branch/merge-base | `feat/phase-7-lead-capture-measurement` / `7cd8aaf6` |
| Fase | 7 — Captação, diagnóstico e mensuração comercial — em execução |
| Objetivo | Implementar captação first-party com consentimento, segurança, outbox e mensuração sem PII |
| Escopo | Coleções privadas Leads/LeadOutbox, endpoint dedicado, formulário acessível, antispam e retenção manual |
| Integrações | Nenhuma credencial/provedor externo utilizável; Search Console, GA4, n8n e Hermes não serão ativados |
| Riscos/gates | Dois gates pré-produção anteriores permanecem preservados e bloqueiam produção |
| Próxima ação | Validar migration, testes, CI e staging; parar para teste humano real |

## Registro da sessão 2026-08-29 — aceite humano e encerramento da Fase 6

| Campo | Conteúdo |
| --- | --- |
| Data | 2026-08-29 |
| Branch/commit | `feat/phase-6-seo-performance` / `057a11c`; encerramento documental após merge do PR #12 |
| Fase | 6 — SEO técnico, dados estruturados e performance — concluída |
| Objetivo | Registrar o aceite humano expresso e encerrar formalmente a fase |
| Alterações | Hero inicialmente perdeu a imagem; z-index e ajustes de opacity/object-position foram insuficientes; solução definitiva com `background-image` WebP otimizado, preload único e testes de regressão |
| Validações | SEO, metadata, canonicals, schemas, sitemap, robots, performance, staging saudável e quatro checks verdes no PR |
| Aceite humano | O proprietário declarou: “Fase 6 aprovada.” A captura confirmou painel tecnológico visível à direita, título legível, contraste adequado, CTAs preservados e identidade visual restaurada |
| Integrações | Search Console e GA4 continuam desativados; produção, n8n e Hermes preservados |
| Riscos/gates | Homologação responsiva integral nos cinco viewports e concretização da copy comercial da Fase 4 continuam bloqueando produção |
| Próxima ação | Nenhuma fase em execução; Fases 7–12 pendentes |

## Registro da sessão 2026-08-30 — transporte SMTP da Fase 7

| Campo | Conteúdo |
| --- | --- |
| Escopo | Hostinger SMTP somente no app de staging; ADR-028 |
| Fonte de verdade | LeadOutbox/PostgreSQL; SMTP apenas transporte |
| Segurança | porta 465/TLS; segredo por arquivo; mensagem sem PII; n8n/Hermes ausentes |
| Execução | verify sem envio antes de processar uma única vez o item explicitamente selecionado |
| Rollback | imagem anterior + notificação desabilitada; banco e outbox preservados |
| Gate | commit, quatro checks verdes, backup validado e redeploy exclusivo do app antes do envio |

## Aceite humano e encerramento da Fase 7 — 30 de agosto de 2026

| Campo | Conteúdo |
| --- | --- |
| Aceite | Formulário claro com textos escuros, envio real, sucesso, consentimento e recebimento da notificação aprovados; declaração final: “Notificação recebida.” |
| Primeira tentativa | Falhou antes de persistir por remoção indevida dos campos canônicos de consentimento; correção coberta por testes |
| Fluxo válido | Segundo e único envio válido criou atomicamente um lead e um outbox; sem duplicidade ou órfão |
| Retenção | Consentimento `2026-08-29.v1` e retenção até 2027-02-25 registrados |
| SMTP | Hostinger 465/TLS, senha somente por arquivo, verify aprovado, mensagem mínima sem PII e outbox processado uma única vez |
| Evidência | 1 lead; 1 outbox sent; attempts 1; timestamps de envio/entrega presentes; dry-run posterior sem elegíveis; notificação recebida |
| Preservado | Produção, n8n, Hermes, GA4 e Search Console; nenhuma nova mensagem ou lead |
| Estado | Fase 7 concluída; Fases 0–7 concluídas; Fases 8–12 pendentes; nenhuma fase em execução |
| Gates | Homologação responsiva integral e concretização da copy da Fase 4 continuam bloqueando produção |

## Controle editorial da Fase 8

O runner aceita somente requisição estruturada, aplica escopo fechado,
canonicalização e deduplicação, e persiste apenas estado operacional mínimo.
Há uma execução ativa no máximo e bateria de até 4 jobs; cada job limita 8
turnos, 3 buscas, 4 fontes, 300 segundos, 4096 tokens por chamada e 256 KiB de
stdout. O guardrail persistente reserva US$ 0,50/job até US$ 2. A agenda
candidata é apenas declarada; cron,
webhook, gateway e workflow n8n permanecem desativados. Mesmo com credenciais
exclusivas montadas, a execução e a bateria real permanecem bloqueadas pelas
duas travas.

Em 31 de agosto de 2026, o provider candidato foi substituído localmente por
DeepSeek V4 Flash (ADR-030). O runner fixa provider/modelo e thinking `none`, aceita a
credencial exclusiva somente por arquivo e falha fechado quando ausente. Não
houve chamada de API, pesquisa, deploy, alteração de runtime ou início da Fase
9; o PR #14 permanece draft.

Em 1º de setembro de 2026, a janela de isolamento recriou somente o runner e o
proxy exclusivo. A dupla trava permaneceu fechada. Verificações únicas de
`GET /models` no DeepSeek e `GET /usage` no Tavily retornaram HTTP 200 sem
inferência ou pesquisa. O runner ficou fora de `n8n_default`; egress direto foi
bloqueado pela rede internal e somente o proxy deny-by-default participa da
rede de saída. A bateria real não foi iniciada.

Ainda em 1º de setembro, o preflight da bateria detectou `/state` sem permissão
de escrita para UID/GID 10000 e interrompeu antes das travas. A remediação
isolada ajustou o volume para `10000:10000 0700`, arquivos 0600 e incluiu
criação correta na imagem mais umask 0077. Persistência e rollback foram
comprovados offline; a bateria continuou bloqueada.

O preflight posterior detectou que `/opt/data` ainda era um volume anônimo RW,
pois a recriação havia preservado o volume herdado apesar da entrada tmpfs. A
remediação isolada passou a exigir container realmente novo e tmpfs de 16 MiB
com `nosuid,nodev,noexec`, modo 0700 e UID/GID 10000. A dupla trava permaneceu
fechada e a bateria não foi executada.
