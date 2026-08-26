# Imagem n8n customizada da Crescimento Vertical (Fase 3C).
#
# Base: digest exato da imagem n8n em execução (não atualiza o n8n).
# Copia somente o pacote COMPILADO do node privado (sem source, sem secrets).
# Nenhum `npm install` remoto no startup.
FROM ghcr.io/n8n-io/n8n@sha256:3989d9b8ebb77b4ee8f604519eb73e44f4384bfaa689526e0104eed79a237d30

USER root
RUN mkdir -p /opt/n8n-custom
COPY packages/n8n-nodes-crescimento-vertical/dist/ /opt/n8n-custom/
RUN chown -R node:node /opt/n8n-custom

USER node

ENV N8N_CUSTOM_EXTENSIONS=/opt/n8n-custom
