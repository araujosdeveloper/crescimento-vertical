#!/bin/sh
set -euo pipefail

BASE=/opt/crescimento-vertical/docker-compose.hermes-editorial.yml
ENV_FILE=/opt/crescimento-vertical/.env.hermes-editorial
ENABLE=/opt/crescimento-vertical/.secrets/execution-enable
NETWORK=crescimento-vertical-hermes-editorial_phase8_execution
IMAGE=cv-hermes-editorial-runner:phase8-hermes-logs-f0638ac
cleanup() {
  set +e
  rm -f "$ENABLE"
  docker compose --env-file "$ENV_FILE" -f "$BASE" up -d --no-deps --no-build --force-recreate cv-hermes-editorial-runner >/dev/null 2>&1
}
on_signal() { cleanup; exit 130; }
trap cleanup EXIT
trap on_signal HUP INT TERM

if docker inspect cv-hermes-editorial-runner --format '{{range .Config.Env}}{{println .}}{{end}}' | grep -q '^RUNNER_EXECUTION_ENABLED=true$'; then
  exit 26
fi
if docker inspect cv-hermes-editorial-runner --format '{{range .Mounts}}{{println .Destination}}{{end}}' | grep -q '^/run/secrets/execution-enable$'; then
  exit 26
fi
install -m 600 /dev/null "$ENABLE"
printf '%s\n' 'services:' '  cv-hermes-editorial-runner:' '    environment:' '      RUNNER_EXECUTION_ENABLED: "true"' '    volumes:' '      - type: bind' '        source: ./.secrets/execution-enable' '        target: /run/secrets/execution-enable' '        read_only: true' |
  docker compose --env-file "$ENV_FILE" -f "$BASE" -f - up -d --no-deps --no-build --force-recreate cv-hermes-editorial-runner >/dev/null

# stdin is consumed exactly once by the versioned client; it performs one POST
# and, only for queued/running, GET-only polling. No request body is persisted.
docker run -i --rm --network "$NETWORK" --read-only --user 10000:10000 \
  --cap-drop ALL --security-opt no-new-privileges:true \
  --mount type=bind,source=/opt/crescimento-vertical/.secrets/hmac-secret,target=/run/secrets/hmac-secret,readonly \
  --entrypoint /opt/hermes/.venv/bin/python "$IMAGE" -m controlled_battery \
  --execute --confirm SINGLE_POST_AUTHORIZED "$@"
