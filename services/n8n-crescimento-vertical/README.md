# Imagem n8n customizada — n8n + node privado Crescimento Vertical

## Objetivo

Imagem reproduzível do n8n (versão instalada, sem atualização) com o node
privado `hermesEditorial` compilado em `/opt/n8n-custom`.

- Base: `docker.n8n.io/n8nio/n8n@sha256:3989d9b8…` (digest exato em execução).
- Copia apenas `packages/n8n-nodes-crescimento-vertical/dist/`.
- Define `N8N_CUSTOM_EXTENSIONS=/opt/n8n-custom`.
- Mantém o usuário `node` e o entrypoint original (`tini`).

## Build

```bash
# a partir da raiz do repositório
docker build -f services/n8n-crescimento-vertical/Dockerfile \
  -t cv-n8n-hermes-connector:1.0.0 .
```

## Aplicação ao n8n existente

A configuração persistente do n8n (`/docker/n8n/docker-compose.yml`) aponta o
serviço `n8n` para a imagem `cv-n8n-hermes-connector:1.0.0`. Traefik, portas,
volumes, networks e demais serviços permanecem inalterados.

Ver `docker-compose.n8n.yml` (versão sanitizada para referência).
