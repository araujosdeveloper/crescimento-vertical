# Fase 3 — Payload CMS, PostgreSQL e autenticação

Data: 28 de agosto de 2026.

Status: em execução, tecnicamente validada localmente e aguardando CI, staging
e aceite humano no painel administrativo. A Fase 4 não foi iniciada.

## Escopo reconciliado

A Fase 2A antecipou a maior parte da fundação: Payload 3.88.0 no Next.js 16.3.0,
PostgreSQL 16, sete coleções, cinco papéis, autenticação, drafts, versões,
workflow, mídia, migrations, DTOs públicos e staging blue-green. A Fase 3 formal
não recria essas capacidades e não antecipa coleções de fases futuras.

## Matriz de lacunas

| Requisito formal | Implementação existente | Evidência | Lacuna real | Ação da Fase 3 | Proprietário futuro |
| --- | --- | --- | --- | --- | --- |
| Configuração Payload/PostgreSQL | adapter Postgres e `push:false` | tipos e duas migrations | nenhuma | preservar e revalidar | — |
| Sete coleções | users, authors, categories, media, sources, research-dossiers, articles | configs e schema | nenhuma | não recriar | — |
| Autenticação e lockout | Payload auth, 5 tentativas, 5 min, token 1 h | `Users.ts` | inativo ainda autenticava | `beforeLogin` e `active` no JWT | MFA depende de integração aprovada |
| Papéis e acesso no servidor | admin/editor/reviewer/researcher/automation | access e hooks | helpers ignoravam `active`; edição publicada ampla | usuário ativo e filtros por estado | capacidades comerciais em fases próprias |
| Drafts e versões | `versions.drafts:true` | `_articles_v` e teste integrado | nenhuma | ampliar evidência | tags/UX ampliada: Fase 5 |
| Preview | ausente | nenhuma rota ou config | completa | sessão server-side, draftMode, rota e saída seguras | — |
| Workflow editorial | grafo e gate de fonte | hooks e testes | consulta interna usava bypass | `overrideAccess:false` com usuário validado | automação executora: Fase 9 |
| Conteúdo público | filtros e DTOs estritos | workflow e data | access REST não exigia `_status` | defesa em profundidade | redirects quando houver migração real |
| Mídia | volume, Sharp e derivados | upload e staging | prova formal integrada faltava | upload, arquivo e checksum temporários | storage de produção: gate operacional |
| Migrations | duas versionadas | banco vazio e status | nenhuma | provar idempotência no restore | — |
| Backup/restauração | backups de staging existentes | docs/18 | prova formal completa faltava | dump custom, mídia, segundo PG16 e teste | — |
| APIs/DTOs | REST Payload e Local API pública | mappers estritos | preview precisava DTO seguro | reutilizar `toArticleDetail` | — |
| Staging | candidato `575e232`, PG16 e admin preservados | health e inventário | código novo ainda não implantado | deploy somente após CI verde | — |
| Coleções futuras | ausentes por decisão | roteiro e ADR-021 | não são lacunas | não antecipar | Fases 4, 5, 7 e 9 |

## Contrato de segurança

- somente usuário editorial ativo acessa Admin e preview;
- admin gerencia usuários; `roles` e `active` são campos exclusivos de admin,
  inclusive na autoatualização;
- editor cria e edita draft e envia para revisão, mas não altera aprovado ou
  publicado;
- reviewer aprova, publica e arquiva;
- researcher gerencia fontes e dossiês;
- automation cria e altera somente drafts e nunca aprova ou publica;
- fontes e dossiês não possuem leitura anônima;
- draft, futuro, arquivado ou não publicado não passa pela leitura pública;
- preview não aceita target arbitrário, não usa token na URL e não expõe dados
  internos no DTO.

## Evidência descartável

O teste `cms.integration` aplicou as duas migrations em PostgreSQL 16 em tmpfs,
criou todos os papéis e entidades temporárias, processou PNG válido, percorreu o
workflow completo e validou versões e acessos. O backup custom e a mídia foram
restaurados em segundo PostgreSQL 16; `cms-recovery.integration` confirmou
autenticação, contagens, relações, versões, publicado público, draft privado e
mídia. Ambos os containers foram destruídos após o registro.

Não houve migration nova, alteração de schema, dependência ou lockfile.
Produção, n8n e Hermes permaneceram inalterados. A homologação responsiva do
ADR-023 continua bloqueando produção, independentemente do aceite desta fase.
