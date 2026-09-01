# Runner editorial interno (Fase 3B)

## Papel

Servidor HTTP interno (`cv-hermes-editorial-runner`) que recebe requisições de
pesquisa assinadas por HMAC, valida contra `editorial-research-request.v1` e,
em fase futura, executa o Hermes em modo one-shot. Nesta fase a execução está
**desabilitada**.

~~~text
phase8_execution (internal)
    cliente temporário --> runner --> proxy
                                  proxy --> phase8_egress --> allowlist HTTPS
~~~

O executor **não** acessa Docker Socket, PostgreSQL ou Payload.

Na janela pré-run da Fase 8 o runner não participa de `n8n_default`. Somente o
proxy participa também da rede de saída; isto é isolamento por rede+proxy, não
firewall absoluto. O proxy CONNECT deny-by-default permite exclusivamente
`api.deepseek.com:443` e `api.tavily.com:443`, recusa IP literal, outras portas,
outros hosts e resoluções não públicas, sem cache ou log de headers.

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

`services/hermes-editorial-runner/tests/` (`unittest`): HMAC, nonce,
schemas, dupla trava, comando sem shell e integração HTTP (401/409/413/400/422/
503/404/200). Execução: `python3 -m unittest discover -s tests -t .`.

## Cliente n8n (Fase 3C)

O n8n consome o runner por meio do node privado `hermesEditorial` (docs/26),
assinando com o mesmo HMAC-SHA256 e usando a credencial
`crescimentoVerticalHermesApi` (URL interna). A conectividade foi validada com
health/validate 200, createJob 503 e getJob 404.

Na Fase 8 o runner também aplica política de escopo, canonicalização e hash de
fontes, fingerprint de pauta, estado SQLite idempotente, limite de concorrência
1, timeout, limite de saída, usage file obrigatório e validação integral do
dossiê. A execução real continua bloqueada sem credencial exclusiva.

O comando one-shot fixa `--provider deepseek --model deepseek-v4-flash
--reasoning none`. O perfil limita 4096 tokens, 8 turnos, 3 buscas e nenhum
fallback; o runner limita 4 jobs, 300 s, 256 KiB, concorrência 1 e guardrail
persistente de US$ 2. A credencial é lida de `/run/secrets/deepseek-api-key`
somente depois da dupla trava e enviada apenas ao ambiente do subprocesso como
`DEEPSEEK_API_KEY`. Arquivo ausente ou vazio falha fechado antes de iniciar o
Hermes. Não existe fallback automático para OpenAI ou outro provedor.

As credenciais exclusivas são binds individuais read-only, informadas apenas
por `DEEPSEEK_API_KEY_FILE` e `TAVILY_API_KEY_FILE`. Seus valores só entram no
processo temporário autorizado; não aparecem no env do container, inspect ou
argumentos. `/opt/data` é sombreado por tmpfs limitado e `/state` é a única
persistência autorizada. A declaração `VOLUME` herdada conserva como metadado
o volume anterior, mas o mount efetivo é tmpfs; nenhum volume novo foi criado
ou removido.

## Propriedade do state

Em 2026-09-01 foi detectado que o volume nomeado `/state` havia nascido como
`root:root 0755`, enquanto o serviço executa como `10000:10000`, impedindo a
abertura do SQLite. O volume foi reparado para `10000:10000 0700`; arquivos
SQLite permanecem `0600`. A imagem agora cria `/state` com esses metadados
antes de mudar para o usuário não-root, e o processo fixa umask 0077. Não há
init amplo como root no serviço principal.

A correção foi validada com escrita/fsync, WAL e locking SQLite, integrity
check, commit/rollback, guardrail e idempotência offline, concorrência serial,
persistência após recriação e restauração do archive em volume temporário.
Fixtures identificadas e volumes temporários foram removidos.

## Neutralização efetiva de `/opt/data`

A imagem herdada declara `VOLUME /opt/data`. Uma recriação que preservou o
volume anônimo anterior manteve simultaneamente esse mount e a intenção de
`tmpfs`, e o volume prevaleceu no container efetivo. O Compose agora declara
explicitamente `rw,nosuid,nodev,noexec,size=16m,mode=0700,uid=10000,gid=10000`.
O procedimento operacional exige criar um container realmente novo, sem
reaproveitar volume anônimo. `/state` continua sendo a única persistência.
