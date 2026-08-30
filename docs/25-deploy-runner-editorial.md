# Deploy do runner editorial (Fase 3B)

## Pré-requisitos

- Perfil `crescimento-vertical-editorial` instalado (docs/23).
- Segredos locais (fora do Git): `.env.hermes-editorial` e `.secrets/hmac-secret`.

## Container

`docker-compose.hermes-editorial.yml` cria o serviço `cv-hermes-editorial-runner`:

- Imagem construída a partir do Hermes **pinado por digest**
  (`ghcr.io/hostinger/hvps-hermes-agent@sha256:7af25fad…`).
- Rede `n8n_default`; sem `ports`, sem labels Traefik, sem Docker Socket.
- `expose` somente da porta interna 8100.
- `read_only: true`, `cap_drop: ALL`, `no-new-privileges`, `tmpfs /tmp`,
  `pids: 64`, limites `cpus: 0.50` e `memory: 768M`.
- Usuário não-root `hermes` (uid 10000).
- `HERMES_HOME` aponta para o diretório do perfil editorial (bind read-only,
  caminho via `EDITORIAL_PROFILE_PATH`).
- Segredo HMAC via bind read-only em `/run/secrets/hmac-secret`.
- `RUNNER_EXECUTION_ENABLED=false`.
- Healthcheck via `/health`; restart `unless-stopped`.

## Segredos locais (não versionados)

- `.env.hermes-editorial` (600): `EDITORIAL_PROFILE_PATH` real.
- `.secrets/hmac-secret` (600, ≥32 bytes): segredo HMAC.
- `.gitignore` ignora `.secrets/` e `.env.hermes-editorial`.

## Execução

~~~bash
docker compose --env-file .env.hermes-editorial \
  -f docker-compose.hermes-editorial.yml build
docker compose --env-file .env.hermes-editorial \
  -f docker-compose.hermes-editorial.yml up -d
~~~

## Rollback (documentado, não executado)

1. Parar/remover somente `cv-hermes-editorial-runner`.
2. Preservar o volume `runner-state` para análise.
3. Remover o perfil somente mediante comando explícito futuro
   (`hermes profile delete`).
4. Confirmar `default` e o gateway intactos.

## Estado nesta fase

Execução desabilitada; nenhum workflow n8n, nenhuma credencial Payload, nenhuma
pesquisa real ou chamada de LLM, nenhum conteúdo criado.

## Fase 8 — candidato controlado

O candidato só pode ser construído após CI verde e backup. O compose mantém
usuário não-root, rootfs read-only, `cap_drop: ALL`, `no-new-privileges`, sem
ports e sem Docker Socket. A flag e o arquivo de habilitação permanecem ausentes
por padrão; não há cron, gateway ou workflow ativo. Sem credencial exclusiva de
modelo, não se recria o runner nem se inicia bateria real.

## Integração com o n8n (Fase 3C)

O n8n acessa o runner via node privado e credencial HMAC; ver docs/26 e
docs/27 para o conector e seu deploy.
