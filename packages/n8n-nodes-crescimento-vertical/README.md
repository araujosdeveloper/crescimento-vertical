# n8n-nodes-crescimento-vertical

Node privado do n8n para o runner editorial Hermes da Crescimento Vertical
(conectividade/validação). A execução real do Hermes permanece **desabilitada**
nesta fase.

## Node

`hermesEditorial` (Hermes Editorial) — operações:

- `health` → `GET /health`
- `validateResearchRequest` → `POST /v1/validate`
- `createJob` → `POST /v1/jobs` (retorna `503 execution_disabled` nesta fase)
- `getJob` → `GET /v1/jobs/{id}`

## Credencial

`crescimentoVerticalHermesApi` (Crescimento Vertical Hermes API):

- `runnerBaseUrl` — exclusivamente `http://cv-hermes-editorial-runner:8100`.
- `hmacSecret` (password) — nunca devolvido nem registrado.

## Autenticação

HMAC-SHA256 sobre `{timestamp}.{nonce}.{body}` (bytes exatos enviados), headers
`X-CV-Signature`, `X-CV-Timestamp`, `X-CV-Nonce`. Sem retry automático em 401,
409 ou erro de validação; erros sanitizados.

## Build e testes

```bash
npm ci
npm run lint
npm run typecheck
npm test        # 34 testes
npm run build   # emite dist/
npm pack --dry-run
```

## Carga no n8n

A imagem customizada (`services/n8n-crescimento-vertical/Dockerfile`) copia
`dist/` para `/opt/n8n-custom` e define `N8N_CUSTOM_EXTENSIONS=/opt/n8n-custom`.
O loader do n8n (`CustomDirectoryLoader`) descobre `*.node.js` e
`*.credentials.js` nesse diretório.

## Segurança

- Sem dependências nativas ou postinstall.
- Tipos locais (`src/n8n-types.ts`) em vez de `n8n-workflow`/`n8n-core`
  (evita dependências pesadas em build/teste).
- O segredo nunca aparece em log, erro, snapshot ou execution data.
