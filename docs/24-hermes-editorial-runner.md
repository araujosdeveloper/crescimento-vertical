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

## Matriz de papéis (ADR-034)

O runner é **governança**, nunca editor. Papéis imutáveis:

| Papel | Componente | Responsabilidade |
| --- | --- | --- |
| `HERMES_ROLE=EDITOR_CHEFE` | perfil `crescimento-vertical-editorial` | decide pauta, estratégia de pesquisa, fontes, estrutura e conteúdo; produz o dossiê |
| `RUNNER_ROLE=GOVERNANCA` | `cv-hermes-editorial-runner` | autentica, limita, contabiliza, valida e persiste |
| `DEEPSEEK_ROLE=MODELO_DO_HERMES` | provider `deepseek` | inferência subordinada ao Hermes |
| `TAVILY_ROLE=PESQUISA_DO_HERMES` | toolset `web` (Tavily) | busca/extração subordinadas ao Hermes |
| `PAYLOAD_ROLE=CMS_E_REVISAO` | Payload/PostgreSQL | recebe somente conteúdo validado e aprovado |
| `N8N_ROLE=ORQUESTRACAO_OPERACIONAL` | n8n (futuro) | orquestra sem decidir editorialmente |

`PUBLICACAO_AUTOMATICA=false`; `RETRY3=PROIBIDO` (`MAX_RETRY_CHAIN=2`). O runner
não produz pauta ou texto editorial e não chama DeepSeek/Tavily em substituição
ao Hermes. O `provider_adapter.py` existe somente para a prova de contrato de
capacidades do orquestrador, nunca para o caminho editorial.

## Contrato de observabilidade

O runner consome o contrato versionado
`docs/schemas/hermes-observability.v1.schema.json` (ADR-034). O runner não exige
campo que o Hermes não exporte sem o patch de instrumentação correspondente
(`services/hermes-editorial-runner/hermes-instrumentation/`). Enquanto o patch
não estiver aplicado à imagem, o runner permanece fail-closed quando a
telemetria obrigatória (`provider_finish_reason`, `tavily_operations`) estiver
ausente.

Correção do finish_reason (ADR-034 v2): `provider_finish_reason` (vindo
diretamente da resposta/chunk final do SDK; valores `stop`, `length`,
`content_filter`, `tool_calls` ou `null`) é SEPARADO de `hermes_turn_exit_reason`
(decisão interna do loop, sanitizada e enumerada). `turn_exit_reason` nunca é
tratado como finish_reason do provedor; ausência permanece `null` e nunca é
inferida como `stop`. O campo `finish_reason` é deprecated e reflete somente
`provider_finish_reason`.

Telemetria Tavily: o plugin é instrumentado no ponto real do HTTP e registra,
separadamente, `attempted`/`succeeded`/`failed` para `search` e `extract`. A
invariante `succeeded + failed == attempted` é obrigatória; o limite de busca
usa `attempted`; `GET /usage` não é contabilizado e logs CONNECT não são fonte
de verdade.

Aplicação determinística do patch: `apply-instrumentation.py` verifica o build
SHA e a versão do Hermes (0.20.4/`649c2062…`), confere os hashes SHA-256 dos
cinco arquivos-alvo antes e depois, aplica com `patch -p1 --fuzz=0` (falha se
já parcialmente aplicado) e grava `manifest.json` não secreto. Divergência de
versão ou hash falha o build fechado.

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

## Destino operacional dos logs

O Hermes v0.20.4 resolve `logs/agent.log` por `get_hermes_home()/logs` e não
oferece configuração independente por CLI, ambiente ou perfil. O runner usa
`hermes_wrapper.py`, chamando a API oficial `setup_logging` com
`hermes_home=/opt/data`, sem alterar `HERMES_HOME`. Os logs ficam no tmpfs
efêmero de `/opt/data/logs`; `agent.log` tem rotação de 1 MiB e um backup,
umask 0077, diretório 0700 e arquivos 0600. Nenhum log é persistido em
`/state` ou inclui credenciais, headers, prompts ou respostas integrais.

## Executor da bateria

O comando versionado `scripts/phase8-controlled-battery.sh` é a única camada
operacional autorizada para uma bateria futura. Ele abre as travas somente após
validar o runner, executa `controlled_battery.py` uma vez via stdin em
container UID 10000 e fecha as travas em `trap/finally`. O cliente valida a
entrada e a resposta, registra um único POST e usa somente GET no polling de
`queued`/`running`, sem retry ou idempotência.

Após o post-mortem de `invalid_dossier_schema`, a saída é normalizada apenas
para BOM, finais de linha e um code fence JSON único sem conteúdo extra. O
prompt explicita o contrato versionado e limites editoriais; falhas de schema
continuam terminais. A telemetria do executor preserva contadores mesmo em
erro. A migração SQLite v3 registra operações Tavily (`search`/`extract`) e
rejeita usage sem contador exato ou a quarta busca.

### Resolução imutável da imagem

O orquestrador não contém tag de imagem. Antes de criar o arquivo de
habilitação, `scripts/phase8_orchestrator_image.py` lê o `docker compose config
--format json`, seleciona exclusivamente o serviço
`cv-hermes-editorial-runner` e exige referência fixa, imagem local, container
ativo healthy e igualdade exata entre referência e Image ID do Compose,
container e armazenamento local.

O helper obtém o RepoDigest correspondente ao Image ID e executa por ele um
probe offline (`--network none`) dentro da imagem. O probe comprova SQLite v5,
executor controlado, observabilidade, contrato `retryNumber`/`rootJobId`, cadeia
máxima 2 e adapter DeepSeek com thinking disabled. A resolução existe somente
em diretório temporário 0700 e arquivo 0600.

A tag é reconfirmada antes da abertura. O cliente executa pelo RepoDigest
inicial, sem build, pull, latest, fallback ou nova resolução. O `finally`
remove a trava e recria somente o runner com `--no-deps --no-build --pull
never`; se a tag mudar durante a janela, usa exclusivamente o RepoDigest já
aprovado para fechar com segurança. O override mínimo é 0600 e removido pelo
trap.
