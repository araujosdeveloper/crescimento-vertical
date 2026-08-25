# Runner editorial interno (Fase 3B)

## Papel

Servidor HTTP interno (`cv-hermes-editorial-runner`) que recebe requisições de
pesquisa assinadas por HMAC, valida contra `editorial-research-request.v1` e,
em fase futura, executa o Hermes em modo one-shot. Nesta fase a execução está
**desabilitada**.

~~~text
n8n_default
    n8n --HMAC--> cv-hermes-editorial-runner --CLI one-shot--> crescimento-vertical-editorial
~~~

O executor **não** acessa Docker Socket, PostgreSQL ou Payload.

## Implementação

`services/hermes-editorial-runner/` (Python, biblioteca padrão + `jsonschema`,
já presente no venv da imagem Hermes):

- `app.py` — servidor HTTP (`http.server`); endpoints abaixo.
- `hmac_auth.py` — HMAC-SHA256 com comparação em tempo constante.
- `nonce_store.py` — proteção contra replay por nonce (TTL, limite).
- `schemas.py` — validação Draft 2020-12 (request + dossier).
- `hermline.py` — montagem do comando Hermes (lista, `shell=False`) e execução
  bloqueada por dupla trava.

## Segurança

- HMAC-SHA256 sobre `{timestamp}.{nonce}.{body}`; janela de replay de 300 s;
  nonce obrigatório; corpo máximo 1 MiB; timeout; concorrência máxima 1;
  fila limitada; logs estruturados sem payload/segredos; `correlationId` nos
  logs.
- O comando Hermes é construído internamente (nunca entrada do usuário como
  argumento de shell); a saída é validada pelo schema do dossiê; falha fechada.

## Dupla trava de execução

`execution_enabled()` só retorna `true` quando **ambas** as condições valem:

1. `RUNNER_EXECUTION_ENABLED=true`;
2. existência do arquivo `/run/secrets/execution-enable`.

Nesta fase ambas são falsas, portanto nenhum subprocesso Hermes é iniciado.

## Endpoints

| Método | Rota | Auth | Comportamento |
| --- | --- | --- | --- |
| GET | `/health` | não | `{status, executionEnabled}` (sem segredos) |
| POST | `/v1/validate` | HMAC | valida a requisição, sem executar Hermes |
| POST | `/v1/jobs` | HMAC | `503 execution_disabled` nesta fase |
| GET | `/v1/jobs/{jobId}` | HMAC | estado seguro (404 nesta fase) |

Erros: 400 (JSON inválido), 401 (assinatura/timestamp), 409 (nonce repetido),
413 (corpo excessivo), 422 (schema), 503 (execução desabilitada).

## Testes

`services/hermes-editorial-runner/tests/` (32 testes, `unittest`): HMAC, nonce,
schemas, dupla trava, comando sem shell e integração HTTP (401/409/413/400/422/
503/404/200). Execução: `python3 -m unittest discover -s tests -t .`.

## Cliente n8n (Fase 3C)

O n8n consome o runner por meio do node privado `hermesEditorial` (docs/26),
assinando com o mesmo HMAC-SHA256 e usando a credencial
`crescimentoVerticalHermesApi` (URL interna). A conectividade foi validada com
health/validate 200, createJob 503 e getJob 404.
