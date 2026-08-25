# Contrato de integração Hermes/n8n (Fase 3A)

Este documento fixa o contrato técnico entre o Hermes Agent, o n8n e o Payload
CMS. É a base para as Fases 8 (perfil/skill do Hermes) e 9 (workflows n8n,
Telegram e aprovação). Nenhuma integração é ativada nesta fase.

## Papéis

| Ator | Responsabilidade | Limites |
| --- | --- | --- |
| Hermes | Pesquisar, extrair, triar, deduplicar e produzir o dossiê | Nunca publica; não administra usuários; usa somente a role `automation` |
| n8n | Validar schema/assinatura/timestamp/idempotência; criar draft; integrar Telegram; aplicar aprovação | Determinístico e auditável; não toma decisão editorial |
| Humano | Aprovar, revisar ou rejeitar (Telegram) | Único autorizador de publicação |
| Payload/PostgreSQL | Fonte de verdade de conteúdo, estado e decisão | — |

Fluxo canônico:

~~~text
Fontes → Hermes → dossiê JSON assinado → n8n (CV-01 intake)
                                          → draft no CMS
                                          → Telegram (CV-02)
                                          → decisão humana
                                          → publicação (CV-03)
~~~

## 1. Webhook de entrada (CV-01 — Hermes Intake)

### Requisição

- `POST {webhook}` com `Content-Type: application/json`.
- A URL exata é provisionada na Fase 9 (nó Webhook dedicado do n8n), fora do
  escopo desta fase.

### Cabeçalhos obrigatórios

| Cabeçalho | Valor | Observação |
| --- | --- | --- |
| `X-CV-Signature` | hex (HMAC-SHA256) | ver assinatura abaixo |
| `X-CV-Timestamp` | inteiro Unix (segundos) | janela de replay |
| `X-CV-Schema-Version` | `1.0` | versão do schema |
| `X-CV-Idempotency-Key` | string | deve ser igual a `idempotencyKey` do corpo |

### Assinatura (v1)

~~~text
signature = hex( hmac_sha256(
  segredo_rotacionável,
  "<X-CV-Timestamp>.<X-CV-Schema-Version>.<corpo bruto>"
) )
~~~

- O segredo é **rotacionável** e exclusivo do fluxo Crescimento Vertical
  (distinto de outros segredos do n8n).
- A comparação da assinatura é feita em **tempo constante**.

### Validação (ordem)

1. **Assinatura**: recalcular HMAC sobre o corpo bruto e comparar em tempo
   constante; falha → `401`.
2. **Replay**: rejeitar se `|agora − X-CV-Timestamp| > 300 s`; falha → `401`.
3. **Corpo máximo**: rejeitar corpos acima de 1 MiB; falha → `413`.
4. **Schema**: validar contra `editorial-dossier.v1.schema.json`
   (`additionalProperties: false` nas estruturas críticas); falha → `400`.
5. **Idempotência**: ver seção 4.

### Respostas

| Código | Situação |
| --- | --- |
| `202` | `EditorialRun` criado/atualizado; corpo `{ "editorialRunId": "…" }` |
| `200` | replay idempotente; retorna o recurso existente |
| `400` | schema/validação inválida |
| `401` | assinatura/timestamp inválidos |
| `409` | mesmo `idempotencyKey` com corpo diferente |
| `413` | corpo excede o limite |

Erro sempre retorna corpo JSON uniforme **sem stack trace** e sem detalhe de
estrutura interna.

## 2. Dossiê JSON v1

Contrato de saída do Hermes (docs/06), formalizado no schema
`docs/schemas/editorial-dossier.v1.schema.json`.

Campos do envelope:

| Campo | Tipo | Obrigatório |
| --- | --- | --- |
| `schemaVersion` | `"1.0"` | Sim |
| `idempotencyKey` | string | Sim |
| `hermesRunId` | string | Sim |
| `discoveredAt` | ISO-8601 | Sim |
| `contentType` | enum | Sim |
| `primaryPillar` | enum | Sim |
| `riskLevel` | enum (`low`/`medium`/`high`/`blocked`) | Sim |
| `title` | string | Não |
| `dek` | string | Não |
| `executiveSummary` | string | Não |
| `businessImpact` | string | Não |
| `draft` | string/object | Não |
| `sources[]` | objeto | Sim (≥ 1) |
| `claims[]` | objeto | Não |
| `relatedServiceSlug` | string/null | Não |
| `warnings[]` | string | Não |

`contentType`: `news`, `analysis`, `guide`, `tool`, `comparison`, `case`.
`primaryPillar`: `ai-business`, `automation`, `sales-attendance`,
`sites-conversion`, `tools-integrations`.

`source`: `url`, `publisher`, `sourceLevel` (`A`/`B`/`C`), `publishedAt`,
`accessedAt`, `supports[]`. `claim`: `id`, `text`, `sourceUrls[]`, `status`
(`verified`/`unverified`).

## 3. Ciclo EditorialRun

| Etapa | Responsável | Resultado |
| --- | --- | --- |
| CV-01 Intake | n8n | valida e cria `EditorialRun` + draft no CMS |
| CV-02 Telegram Approval | n8n | envia resumo e persiste APROVAR/REJEITAR/REVISAR |
| CV-03 CMS Publish | n8n | aplica decisão válida; solicita `published` via revalidação |
| CV-04 Monitoring | n8n | checa links/fontes e cria tarefa de revisão; nunca altera texto sem decisão |

Aprovação é sempre humana e persistida no CMS. Publicação ocorre somente quando
o fluxo editorial do Payload (Fase 2A) permitir: status `published`, `publishedAt`
válido, título/resumo/conteúdo/autor/categoria/imagem e fonte verificada.

## 4. Idempotência e deduplicação

- `EditorialRun.idempotencyKey` possui índice único.
- Replay com o mesmo corpo retorna o recurso existente (`200`).
- Mesmo `idempotencyKey` com corpo diferente é conflito (`409`) e gera alerta.
- Deduplicação de pauta (docs/06): URL canônica normalizada + hash
  `publisher + título + data` + similaridade semântica + consulta a
  `EditorialRun`/posts.

## 5. Fronteira de permissões

- Hermes/n8n usam a role `automation` (docs/17): criam/atualizam **draft**,
  criam `EditorialRun`; nunca publicam, apagam, administram usuários, leem leads
  ou alteram configuração.
- O segredo do webhook não concede acesso administrativo ao CMS.
- `sources` e `research-dossiers` permanecem não públicos.

## 6. Falha segura

O fluxo para e alerta quando: fonte insuficiente; fontes discordam; JSON não
valida; webhook rejeita assinatura; CMS indisponível; custo/limite atingido;
pauta excede o risco permitido. Nenhuma falha é contornada por publicação
direta.

## 7. Versão e evolução

A evolução do schema exige nova versão (`editorial-dossier.v1` → `v2`) com
validação de `schemaVersion` e janela de compatibilidade. Mudanças de contrato
são registradas em docs/14.
