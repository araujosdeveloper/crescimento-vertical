# Deploy do conector n8n ↔ Hermes (Fase 3C)

## Pré-requisitos

- Runner `cv-hermes-editorial-runner` saudável (Fase 3B), `executionEnabled=false`.
- Segredo HMAC em `/opt/crescimento-vertical/.secrets/hmac-secret`.

## Imagem customizada

`services/n8n-crescimento-vertical/Dockerfile`:

- Base: `docker.n8n.io/n8nio/n8n@sha256:3989d9b8…` (digest exato em execução).
- Copia somente `packages/n8n-nodes-crescimento-vertical/dist/` para
  `/opt/n8n-custom`.
- Define `N8N_CUSTOM_EXTENSIONS=/opt/n8n-custom`; mantém usuário `node` e
  entrypoint `tini`.

Build (raiz do repositório):

~~~bash
docker build -f services/n8n-crescimento-vertical/Dockerfile \
  -t cv-n8n-hermes-connector:1.0.0 .
~~~

## Aplicação ao n8n existente

A configuração persistente `/docker/n8n/docker-compose.yml` aponta o serviço
`n8n` para `image: cv-n8n-hermes-connector:1.0.0`. Traefik, portas, volumes,
networks e demais serviços permanecem inalterados. Referência sanitizada em
`services/n8n-crescimento-vertical/docker-compose.n8n.yml`.

Recreate controlado (somente o serviço n8n):

~~~bash
cd /docker/n8n
docker compose up -d n8n
~~~

## Credencial

Criada via `n8n import:credentials` (mecanismo oficial, criptografada em
repouso por `encryptV2`):

- nome: `CV Hermes Editorial Runner — Internal`;
- tipo: `crescimentoVerticalHermesApi`;
- `runnerBaseUrl`: `http://cv-hermes-editorial-runner:8100`;
- `hmacSecret`: valor do `.secrets/hmac-secret` (nunca exibido).

O arquivo temporário em claro é removido imediatamente após o import.

## Workflow de conectividade

`n8n/workflows/cv-hermes-editorial-connectivity-validation.json` (template
sanitizado, sem credencial embutida). Nome no n8n:
`CV — Hermes Editorial — Connectivity Validation`. INATIVO, Manual Trigger →
Health → Validate. Executado uma única vez via `n8n execute --id` (com
`N8N_RUNNERS_BROKER_PORT` alternativo para evitar conflito de porta).

## Backup e rollback

Backup pré-recreate em `/opt/backups/crescimento-vertical/phase3c-pre-n8n-*`
(compose, `.env`, imagem `docker.n8n.io/n8nio/n8n:latest`, volume
`n8n_data.tar.gz`, SQLite consistente `VACUUM INTO`, workflows e credenciais
exportados de forma criptografada).

Rollback:

1. restaurar `image: docker.n8n.io/n8nio/n8n` em `/docker/n8n/docker-compose.yml`;
2. `docker compose up -d n8n`;
3. restaurar o volume `n8n_data` e o SQLite a partir do backup, se necessário.

## Estado nesta fase

Execução do Hermes desabilitada; nenhum workflow ativo novo; nenhuma pesquisa
ou chamada LLM; nenhuma escrita no Payload; nenhuma porta pública nova.
