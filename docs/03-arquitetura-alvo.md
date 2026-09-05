# Arquitetura alvo

## Visão geral

~~~text
Internet
  |
Traefik / TLS
  |
Next.js + Payload CMS
  |              \
PostgreSQL        Armazenamento de mídia S3 compatível
  ^
  |
n8n <---- aprovação ---- Telegram
  ^
  |
Hermes Agent ---- pesquisa/extrai ---- fontes autorizadas
~~~

## Responsabilidades

### Next.js

- Renderização pública.
- Rotas editoriais e comerciais.
- Server Components por padrão.
- Metadados, sitemap, robots e dados estruturados.
- Preview autenticado de rascunhos.
- Formulários públicos por endpoints controlados.

### Payload CMS

- Painel administrativo.
- Fonte de verdade de conteúdo e configurações.
- Drafts, versões, preview e controle de acesso.
- API para integrações.
- Registro de mídias, redirecionamentos, leads e execuções editoriais.

### PostgreSQL

- Persistência editorial e comercial.
- Relações entre posts, fontes, serviços, CTAs e leads.
- Auditoria de estados.
- Migrações versionadas.
- Sem porta publicada na internet.

### Armazenamento de mídia

- Objetos persistentes fora do filesystem efêmero do contêiner.
- Compatibilidade S3.
- Controle de acesso e URLs públicas somente quando necessário.
- Versionamento ou backup independente.
- Transformação e entrega otimizada de imagens.

O fornecedor será escolhido na Fase 1 conforme conta, região e custo, mas a
interface S3 compatível é uma decisão arquitetural.

### Hermes Agent

- Pesquisa, extração, triagem, deduplicação e produção do dossiê.
- Execução em perfil isolado.
- Skill editorial versionada.
- Sem credencial de publicação.
- Saída estruturada enviada ao n8n.

### n8n

- Validação determinística.
- Controle de idempotência.
- Integração com Telegram.
- Criação/atualização de draft no Payload.
- Aplicação da aprovação.
- Alertas e reprocessamento controlado.

### Runner editorial (Fase 3B)

Entre o n8n e o Hermes existe o runner interno `cv-hermes-editorial-runner`
(docs/24, docs/25): recebe requisições assinadas por HMAC, valida o schema
`editorial-research-request.v1` e, em fase futura, executa o Hermes em modo
one-shot no perfil isolado `crescimento-vertical-editorial`. Sem acesso a
Docker Socket, PostgreSQL ou Payload; execução desabilitada por dupla trava.

### Conector n8n (Fase 3C)

O n8n acessa o runner por um node privado `hermesEditorial` (pacote
`n8n-nodes-crescimento-vertical`, docs/26) carregado via
`N8N_CUSTOM_EXTENSIONS` na imagem `cv-n8n-hermes-connector`. A credencial
`crescimentoVerticalHermesApi` aponta exclusivamente para
`http://cv-hermes-editorial-runner:8100` e é armazenada criptografada. O
workflow de conectividade é INATIVO e executado uma única vez (health/validate).

### Telegram

- Interface operacional para pauta, revisão e decisão.
- Aprovadores explicitamente autorizados.
- Comando relacionado a um identificador imutável da execução.
- Não é fonte de verdade; decisões são persistidas no CMS.

## Topologia de produção planejada

### Serviços

- crescimento-vertical-web
- crescimento-vertical-postgres
- crescimento-vertical-backup
- Hermes existente na VPS, com perfil crescimento-vertical-editorial isolado
- n8n existente, integrado por webhook autenticado

### Redes

- proxy: somente web e Traefik.
- internal: web, PostgreSQL e backup.
- automation: conexão controlada entre web/n8n quando necessária.

Não manter PostgreSQL na mesma rede pública do proxy. Não usar a rede n8n_default
como rede universal de todos os serviços após a reestruturação.

## Ambientes

| Ambiente | Uso | Indexação | Dados |
| --- | --- | --- | --- |
| Local | Desenvolvimento | Bloqueada | Sintéticos |
| Staging | Aceite e integração | Bloqueada e autenticada | Não produtivos |
| Produção | Público | Permitida conforme rota | Reais |

Staging terá banco, chaves e Telegram próprios. Produção não será usada para
testes funcionais destrutivos.

## Contratos entre componentes

- Hermes produz um dossiê JSON versionado.
- n8n valida schema, assinatura, timestamp e idempotencyKey.
- n8n cria ou atualiza um EditorialRun.
- Payload cria Post em status draft.
- Aprovação humana altera o EditorialRun.
- Somente o workflow de publicação solicita status published.
- Next.js lê apenas documentos publicados em rotas públicas.

## Compatibilidade com a base atual

O Payload atual suporta integração no projeto Next.js existente e adaptador
PostgreSQL. Drafts e versões serão usados para manter rascunhos separados do
conteúdo publicado. A fundação em código foi implementada na Fase 2A
(ver docs/17-fundacao-editorial-payload.md): Payload 3.88.0 integrado, PostgreSQL
dedicado com migrações versionadas, coleções, papéis e controle de acesso no
servidor. O deploy e a ativação permanecem para a Fase 3.

## Decisões de simplicidade

### Layout público consolidado (Fase 2)

As rotas visuais existentes usam o route group `(public)` e compartilham um
`SiteShell`. A home e o grupo `(editorial)` recebem Header, Footer, SkipLink e
um único `main`; `(payload)`, APIs, healthchecks, feed, robots e sitemap
permanecem fora desse layout. Route groups preservam todas as URLs públicas.

- Um único projeto Next.js/Payload reduz duplicação de tipos, layouts e deploy.
- PostgreSQL concentra conteúdo e relações; estado interno do Hermes não substitui
  o banco.
- Hermes usa agenda própria para pesquisa; n8n assume o último trecho
  determinístico.
- Não adicionar Redis até existir necessidade medida de fila ou cache distribuído.
- Não criar microsserviço separado para cada etapa editorial.

## Referências técnicas

- [Payload: instalação em aplicação Next.js existente](https://payloadcms.com/docs/getting-started/installation)
- [Payload: adaptador PostgreSQL e migrações](https://payloadcms.com/docs/database/postgres)
- [Payload: versões e drafts](https://payloadcms.com/docs/versions/drafts)
- [Hermes: pesquisa e extração](https://hermes-agent.nousresearch.com/docs/user-guide/features/web-search)
- [Hermes: cron, continuidade e entrega](https://hermes-agent.nousresearch.com/docs/user-guide/features/cron)
- [Next.js: App Router](https://nextjs.org/docs/app)
- [Next.js: convenções de metadata](https://nextjs.org/docs/app/api-reference/file-conventions/metadata)

## Reconciliação da Fase 8

O runner editorial é a única fronteira de execução e permanece sem acesso a
Payload, PostgreSQL, Docker Socket ou portas públicas. O perfil é montado em
modo somente leitura; jobs são one-shot, idempotentes e validados por schema.
N8n continua validate-only até a Fase 9. A credencial de modelo deve ser
exclusiva do perfil/runner; credencial compartilhada não é reutilizada.
