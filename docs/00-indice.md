# Índice da documentação

## Documentos de direção

- [Constituição do Projeto](../CONSTITUICAO-DO-PROJETO.md)
- [Roteiro Mestre](../ROTEIRO-MESTRE.md)
- [Visão e objetivos](01-visao-e-objetivos.md)
- [Escopo e requisitos](02-escopo-e-requisitos.md)
- [Registro de decisões](14-registro-decisoes.md)
- [Auditoria do estado atual](15-auditoria-estado-atual.md)

## Produto e experiência

- [Arquitetura de informação](04-arquitetura-de-informacao.md)
- [Modelo editorial e SEO](05-modelo-editorial-e-seo.md)
- [UX e design system](08-ux-e-design-system.md)
- [Monetização e métricas](13-monetizacao-e-metricas.md)

## Tecnologia e operação

- [Arquitetura alvo](03-arquitetura-alvo.md)
- [Hermes Agent](06-hermes-agent.md)
- [CMS, dados e APIs](07-cms-dados-e-apis.md)
- [Segurança e LGPD](09-seguranca-e-lgpd.md)
- [Controle de execução](10-controle-de-execucao.md)
- [Qualidade e aceite](11-qualidade-e-aceite.md)
- [Operação, deploy e recuperação](12-operacao-deploy-e-recuperacao.md)
- [Ambiente de staging](16-staging.md)
- [Fundação editorial — Payload + PostgreSQL](17-fundacao-editorial-payload.md)
- [Fase 3 — CMS, PostgreSQL e autenticação](30-fase-3-cms-postgresql-autenticacao.md)
- [Fase 4 — Arquitetura pública e páginas comerciais](31-fase-4-arquitetura-publica-paginas-comerciais.md)
- [Deploy blue-green do staging](18-deploy-phase2-staging.md)
- [Portal editorial público](19-portal-editorial-publico.md)
- [Deploy do portal editorial público no staging](20-deploy-phase2b-staging.md)
- [Auditoria da integração Hermes/n8n](21-auditoria-integracao-hermes-n8n.md)
- [Contrato de integração Hermes/n8n](22-contrato-integracao-hermes-n8n.md)
- [Perfil Hermes editorial](23-perfil-hermes-editorial.md)
- [Runner editorial interno](24-hermes-editorial-runner.md)
- [Deploy do runner editorial](25-deploy-runner-editorial.md)
- [Conector n8n ↔ Hermes](26-conector-n8n-hermes.md)
- [Deploy do conector n8n ↔ Hermes](27-deploy-conector-n8n-hermes.md)
- [Hardening do repositório público](28-hardening-repositorio-publico.md)
- [Fase 2 — Fundação do portal e design system](29-fase-2-fundacao-portal-design-system.md)

### Contratos de integração (schemas JSON)

- [Dossiê editorial v1](schemas/editorial-dossier.v1.schema.json)
- [Registro de fonte v1](schemas/source-record.v1.schema.json)
- [Rascunho de artigo v1](schemas/article-draft.v1.schema.json)
- [Requisição de pesquisa editorial v1](schemas/editorial-research-request.v1.schema.json)

## Templates

- [Decisão arquitetural](templates/adr.md)
- [Dossiê de pauta](templates/dossie-de-pauta.md)
- [Checklist de release](templates/checklist-release.md)

## Regra de manutenção

Cada mudança de código deve identificar qual documento governa a alteração.
Quando o comportamento real divergir da documentação, a entrega permanece
incompleta até que um deles seja corrigido conscientemente.
