# Conector n8n ↔ Hermes (Fase 3C)

## Objetivo

Conectividade, autenticação e validação entre o n8n e o runner editorial do
Hermes, **sem execução real do Hermes**.

~~~text
n8n_default
  n8n --(HMAC)--> cv-hermes-editorial-runner --CLI one-shot--> crescimento-vertical-editorial
~~~

## Componentes

| Componente | Papel |
| --- | --- |
| `n8n-nodes-crescimento-vertical` | Node privado do n8n (`hermesEditorial`) + credencial `crescimentoVerticalHermesApi` |
| Imagem `cv-n8n-hermes-connector` | n8n (digest pinado) + node privado compilado em `/opt/n8n-custom` |
| `cv-hermes-editorial-runner` | Runner HMAC (Fase 3B), execução desabilitada |

## Node privado

`packages/n8n-nodes-crescimento-vertical/` (TypeScript, sem dependências nativas):

- `credentials/CrescimentoVerticalHermesApi.credentials.ts` — `runnerBaseUrl`
  (exclusivamente `http://cv-hermes-editorial-runner:8100`) + `hmacSecret`
  (password).
- `nodes/HermesEditorial/HermesEditorial.node.ts` — operações `health`,
  `validateResearchRequest`, `createJob`, `getJob`.
- `src/` — `hmac.ts` (assinatura), `client.ts` (HTTP + timeout + limite de
  resposta), `validation.ts` (validação local da requisição), `url.ts`
  (validação da URL interna), `errors.ts` (erros sanitizados).
- `src/n8n-types.ts` — tipos mínimos compatíveis (evita `n8n-workflow`/`n8n-core`
  no build/teste).

O node é carregado pelo `CustomDirectoryLoader` do n8n via
`N8N_CUSTOM_EXTENSIONS=/opt/n8n-custom`; o tipo no workflow é
`CUSTOM.hermesEditorial` e a credencial é `crescimentoVerticalHermesApi`.

## Autenticação

HMAC-SHA256 sobre `{timestamp}.{nonce}.{body}` (bytes exatos), headers
`X-CV-Signature`, `X-CV-Timestamp`, `X-CV-Nonce`. Serialização única do corpo;
sem retry automático em 401/409/erro de validação; erros sanitizados; segredo
nunca em log/erro/snapshot.

## Operações validadas

| Operação | Resultado nesta fase |
| --- | --- |
| `health` | 200 |
| `validateResearchRequest` | 200 (validação local + runner) |
| `createJob` | 503 `execution_disabled` |
| `getJob` (inexistente) | 404 sanitizado |

## Segurança

- URL interna exclusiva (`http://cv-hermes-editorial-runner:8100`), sem
  credenciais/query/fragment, nunca vinda de item/expressão.
- Credencial armazenada **criptografada** pelo n8n (Cipher/encryptV2).
- Sem webhook, cron, schedule, Payload, banco, Execute Command ou Code node no
  workflow de conectividade.

## Limitações

- Execução do Hermes desabilitada por dupla trava (Fase 3B).
- n8n não atualizado (2.33.7, `:latest` resolvido para digest `3989d9b8…`).
- Node customizado aparece na auditoria como "Custom nodes" (esperado).
