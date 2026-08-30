# Fase 7 — Captação, diagnóstico e mensuração comercial

Estado: concluída em 30 de agosto de 2026 após teste e aceite humano no staging.

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

O ADR-028 autoriza Hostinger SMTP em `smtp.hostinger.com:465` com TLS implícito.
O lead é salvo atomicamente antes de qualquer entrega; o comando manual
`npm run leads:outbox -- --dry-run`, `--verify` ou `--process --limit 1 --id ID`
opera lotes pequenos com claim atômico, lease, Message-ID estável, até cinco
tentativas e backoff. Falha não rejeita nem apaga o lead.

O e-mail contém somente data/hora, UUID interno e link HTTPS autenticado ao
Payload Admin, sem PII, anexos ou rastreamento. A senha existe somente no arquivo
montado read-only. n8n e Hermes não participam; agendamento/reconciliação futura
pertence à Fase 11.

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

## Aceite humano e encerramento

O formulário claro com textos escuros, o envio real e a mensagem de sucesso
foram aprovados. O primeiro envio falhou antes de persistir porque campos
canônicos do consentimento foram removidos indevidamente; a correção foi coberta
por testes. O segundo e único envio válido persistiu atomicamente um lead e um
outbox, com consentimento `2026-08-29.v1`, retenção registrada e idempotência
comprovada.

O verify do Hostinger SMTP foi aprovado antes da entrega. O outbox foi
processado uma única vez, ficou `sent` com attempts 1 e timestamps presentes, e
a notificação mínima sem PII foi recebida humanamente — “Notificação recebida.”
O estado final tem zero duplicidades, zero órfãos, zero eventos com PII e zero
itens elegíveis em dry-run. Produção, n8n e Hermes foram preservados; GA4 e
Search Console permanecem desativados.

A Fase 7 está concluída. As Fases 0–7 estão concluídas, as Fases 8–12 estão
pendentes e nenhuma fase está em execução. Os dois gates pré-produção continuam
obrigatórios e não foram encerrados por este aceite.
