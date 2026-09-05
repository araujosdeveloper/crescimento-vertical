#!/bin/sh
set -euo pipefail

BASE=/opt/crescimento-vertical/docker-compose.hermes-editorial.yml
ENV_FILE=/opt/crescimento-vertical/.env.hermes-editorial
ENABLE=/opt/crescimento-vertical/.secrets/execution-enable
NETWORK=crescimento-vertical-hermes-editorial_phase8_execution
RESOLVER=/opt/crescimento-vertical/scripts/phase8_orchestrator_image.py
WORK_DIR=$(mktemp -d /tmp/phase8-battery.XXXXXX)
chmod 700 "$WORK_DIR"
RESOLUTION="$WORK_DIR/image-resolution"
OVERRIDE="$WORK_DIR/runner-override.yaml"
IMAGE_REF=
IMAGE_ID=
IMAGE_PINNED=
ENABLE_CREATED=0
WINDOW_OPENED=0
cleanup() {
  set +e
  if [ "$ENABLE_CREATED" -eq 1 ]; then
    rm -f "$ENABLE"
    ENABLE_CREATED=0
  fi
  if [ "$WINDOW_OPENED" -eq 1 ] && [ -n "$IMAGE_REF" ] && [ -n "$IMAGE_ID" ]; then
    if ! "$RESOLVER" recheck --reference "$IMAGE_REF" --image-id "$IMAGE_ID"; then
      IMAGE_REF=$IMAGE_PINNED
    fi
    printf 'services:\n  cv-hermes-editorial-runner:\n    image: "%s"\n' "$IMAGE_REF" > "$OVERRIDE"
    chmod 600 "$OVERRIDE"
    docker compose --env-file "$ENV_FILE" -f "$BASE" -f "$OVERRIDE" up -d --no-deps --no-build --pull never --force-recreate cv-hermes-editorial-runner >/dev/null 2>&1
    WINDOW_OPENED=0
  fi
  rm -f "$RESOLUTION" "$OVERRIDE"
  rmdir "$WORK_DIR" >/dev/null 2>&1 || true
}
on_signal() { cleanup; exit 130; }
trap cleanup EXIT
trap on_signal HUP INT TERM

"$RESOLVER" resolve --output "$RESOLUTION" -- \
  docker compose --env-file "$ENV_FILE" -f "$BASE"
IMAGE_REF=$(sed -n '1p' "$RESOLUTION")
IMAGE_ID=$(sed -n '2p' "$RESOLUTION")
IMAGE_PINNED=$(sed -n '3p' "$RESOLUTION")
[ -n "$IMAGE_REF" ] && [ -n "$IMAGE_ID" ] && [ -n "$IMAGE_PINNED" ] || exit 26

if docker inspect cv-hermes-editorial-runner --format '{{range .Config.Env}}{{println .}}{{end}}' | grep -q '^RUNNER_EXECUTION_ENABLED=true$'; then
  exit 26
fi
if docker inspect cv-hermes-editorial-runner --format '{{range .Mounts}}{{println .Destination}}{{end}}' | grep -q '^/run/secrets/execution-enable$'; then
  exit 26
fi
install -m 600 /dev/null "$ENABLE"
ENABLE_CREATED=1
"$RESOLVER" recheck --reference "$IMAGE_REF" --image-id "$IMAGE_ID"
printf 'services:\n  cv-hermes-editorial-runner:\n    image: "%s"\n    environment:\n      RUNNER_EXECUTION_ENABLED: "true"\n    volumes:\n      - type: bind\n        source: %s\n        target: /run/secrets/execution-enable\n        read_only: true\n' "$IMAGE_PINNED" "$ENABLE" > "$OVERRIDE"
chmod 600 "$OVERRIDE"
docker compose --env-file "$ENV_FILE" -f "$BASE" -f "$OVERRIDE" up -d --no-deps --no-build --pull never --force-recreate cv-hermes-editorial-runner >/dev/null
WINDOW_OPENED=1

# stdin is consumed exactly once by the versioned client; it performs one POST
# and, only for queued/running, GET-only polling. No request body is persisted.
docker run -i --rm --network "$NETWORK" --read-only --user 10000:10000 \
  --cap-drop ALL --security-opt no-new-privileges:true \
  --mount type=bind,source=/opt/crescimento-vertical/.secrets/hmac-secret,target=/run/secrets/hmac-secret,readonly \
  --entrypoint /opt/hermes/.venv/bin/python "$IMAGE_PINNED" -m controlled_battery \
  --execute --confirm SINGLE_POST_AUTHORIZED "$@"
