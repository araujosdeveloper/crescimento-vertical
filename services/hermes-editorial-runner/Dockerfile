FROM ghcr.io/hostinger/hvps-hermes-agent:latest@sha256:7af25fad2af3673f5be39824e38772a9895cb70af83c157917b4cd5e3983e9f9

# jsonschema 4.26.0 já está presente no venv da imagem base (/opt/hermes/.venv).
# Nenhuma dependência adicional é instalada nesta fase.

WORKDIR /app

COPY services/hermes-editorial-runner/app.py \
     services/hermes-editorial-runner/config.py \
     services/hermes-editorial-runner/hmac_auth.py \
     services/hermes-editorial-runner/nonce_store.py \
     services/hermes-editorial-runner/schemas.py \
     services/hermes-editorial-runner/hermline.py \
     services/hermes-editorial-runner/policy.py \
     services/hermes-editorial-runner/state.py \
     services/hermes-editorial-runner/hermes_wrapper.py \
     ./
COPY docs/schemas/ ./schemas/

RUN chown -R hermes:hermes /app && chmod -R a+rX /app \
    && chmod 0755 /app/hermes_wrapper.py \
    && install -d -o 10000 -g 10000 -m 0700 /state

ENV SCHEMAS_DIR=/app/schemas \
    RUNNER_EXECUTION_ENABLED=false \
    RUNNER_HOST=0.0.0.0 \
    RUNNER_PORT=8100 \
    HERMES_BIN=/app/hermes_wrapper.py \
    RUNNER_STATE_DIR=/state \
    HMAC_SECRET_FILE=/run/secrets/hmac-secret \
    EXECUTION_ENABLE_FILE=/run/secrets/execution-enable

USER hermes

# Executa o runner diretamente, sem o entrypoint/s6-overlay do Hermes
# (o runner é um servidor HTTP independente, não o agente).
ENTRYPOINT ["/opt/hermes/.venv/bin/python"]
CMD ["app.py"]

EXPOSE 8100

HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD ["/opt/hermes/.venv/bin/python", "-c", "import urllib.request; urllib.request.urlopen('http://127.0.0.1:8100/health', timeout=5)"]
