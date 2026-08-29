# Fase 7 — Captação, diagnóstico e mensuração comercial

Estado: em execução até teste e aceite humano no staging.

## Fluxo e modelo

`/diagnostico` usa formulário first-party acessível e endpoint dedicado
`POST /api/leads`. O Payload/PostgreSQL é a fonte de verdade. A coleção `leads`
contém somente dados necessários ao atendimento, atribuição reduzida, UTMs
normalizadas, consentimento versionado, idempotency key, retenção e status de
notificação. `lead-outbox` registra a entrega comercial sem duplicar o conteúdo
pessoal integral.

Leads e outbox não têm leitura, criação ou exclusão pública. A leitura no Admin
é restrita a admin/reviewer; o endpoint público não usa a API Payload genérica.
Automation não acessa leads. Nenhuma migration é aplicada em produção.

## Consentimento e segurança

O checkbox é desmarcado por padrão e informa finalidade, dados utilizados,
revogação, retenção e política de privacidade. A versão atual é
`2026-08-29.v1`, acompanhada pelo SHA-256 do texto. Marketing não é coletado.

O endpoint exige JSON pequeno, schema estrito, Content-Type, allowlist de
Origin, token HMAC com expiração, honeypot, tempo mínimo, tamanho máximo,
normalização, idempotência e rate limit em memória. Não armazena IP bruto,
User-Agent ou dados pessoais em logs. A configuração essencial ausente provoca
falha fechada.

## Atribuição e mensuração

São aceitos somente rota, CTA/serviço, conteúdo de origem, referrer reduzido e
UTMs permitidas. Query completa, tokens e identificadores de publicidade são
descartados. Eventos first-party não identificáveis ficam preparados para CTA,
WhatsApp e estados do formulário, sem GA4, scripts externos, cookies não
essenciais, nome, e-mail, telefone, mensagem ou leadId.

## Outbox e notificação

Nenhuma credencial ou provedor externo de notificação estava presente/utilizável
no preflight. O lead é salvo com outbox `pending`; a integração externa fica
explicitamente pendente. Não são usados n8n, Hermes, Telegram ou WhatsApp como
atalho. A notificação futura deverá ser mínima, idempotente e desacoplada.

## Retenção e exclusão

O prazo inicial de retenção é de 180 dias (`retentionUntil`). A exclusão ou
anonimização deve ser executada manualmente em modo dry-run, por lote limitado,
com contagens e IDs internos não públicos. Não há cron de produção nesta fase.

## Testes, rollback e limites

Testes cobrem validação estrita, consentimento, token, honeypot, UTMs,
idempotência e permissões. Migrations e testes de persistência devem usar
PostgreSQL descartável. Rollback restaura a imagem anterior e reverte a
migration somente com backup verificável. CAPTCHA, provedor de e-mail, SMS,
WhatsApp, webhook, analytics e automação operacional estão fora do escopo.

Os gates pré-produção — homologação responsiva integral nos cinco viewports e
concretização da copy comercial da Fase 4 — permanecem preservados.
