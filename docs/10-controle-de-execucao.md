# Controle de execução

Este documento é o quadro de controle. O detalhamento das fases permanece em
../ROTEIRO-MESTRE.md.

## Situação

- Fase ativa: Fase 1 — Baseline técnico e segurança de implantação.
- Última fase concluída: Fase 0 — Governança, auditoria e documentação.
- Próxima fase: Fase 2, somente depois do gate integral da Fase 1.
- Produção alterada por este planejamento: não.
- Deploy realizado: não.

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
- [ ] Auditar containers, redes, volumes e portas.
- [ ] Confirmar DNS, TLS e redirects www/apex.
- [ ] Inventariar variáveis sem expor valores.
- [x] Criar backup pré-mudança.
- [x] Verificar restauração do backup.
- [x] Registrar commit-base local: 5b461252037f6670be7d8cd4095c5d202f97ae5d.
- [x] Executar npm ci, lint, typecheck e build.
- [ ] Registrar baseline visual.
- [x] Remover telefone fictício e tornar o contato configurável.
- [ ] Confirmar e configurar WhatsApp e e-mail reais.
- [x] Criar branch feat/portal-phase-1-baseline.
- [ ] Criar staging protegido/noindex.
- [x] Criar healthchecks live e ready.
- [x] Gerar aplicação Next.js em modo standalone.
- [x] Executar smoke test HTTP da home e dos healthchecks.
- [x] Validar sintaxe YAML do Docker Compose.
- [x] Construir e validar imagem Docker em ambiente com Docker.
- [x] Demonstrar rollback.
- [x] Atualizar auditoria com evidências.

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

## Registro por sessão

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
