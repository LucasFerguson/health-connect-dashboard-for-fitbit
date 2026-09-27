#!/usr/bin/env bash
# Lifecycle wrapper around docker-compose.yml's two profiles.
#
#   scripts/deploy.sh up [prod|dev|all]   rebuild + (re)start, wait until healthy
#   scripts/deploy.sh rollback <tag>      redeploy a previously built prod image
#   scripts/deploy.sh versions            list prod images you can roll back to
#   scripts/deploy.sh logs [prod|dev] [N] follow logs (last N lines, default 100)
#   scripts/deploy.sh status              containers, health, and HTTP check
#   scripts/deploy.sh down [prod|dev|all] stop and remove containers
#
# Every prod build is also tagged `health-connect-dashboard:<git-sha>` (with a
# `-dirty` suffix when the tree has uncommitted changes), so `rollback` can put
# any earlier build back without rebuilding. Compose itself only knows the
# moving `:local` tag; rollback just re-points it.
#
# Exit status is non-zero if the deployed container never becomes healthy, so
# this is safe to chain: `scripts/deploy.sh up prod && echo shipped`.
set -euo pipefail

cd "$(dirname "$0")/.."

IMAGE=health-connect-dashboard
PROD_CONTAINER=health-connect-dashboard
DEV_CONTAINER=health-connect-dashboard-dev
# Compose reads port overrides from `.env`; read the same ones so the health
# checks probe the port that was actually published.
env_value() { [[ -f .env ]] && sed -n "s/^$1=[\"']\{0,1\}\([^\"']*\).*/\1/p" .env | tail -1; }
PROD_PORT=${PROD_PORT:-$(env_value PROD_PORT)}
PROD_PORT=${PROD_PORT:-3000}
DEV_PORT=${DEV_PORT:-$(env_value DEV_PORT)}
DEV_PORT=${DEV_PORT:-3001}
# The dev server's first request compiles routes cold (~20-30s), plus `npm ci`
# on a fresh volume, so it gets a longer budget than prod.
PROD_TIMEOUT=${PROD_TIMEOUT:-120}
DEV_TIMEOUT=${DEV_TIMEOUT:-300}

compose() { docker compose "$@"; }
log() { printf '\033[1;34m==>\033[0m %s\n' "$*"; }
fail() { printf '\033[1;31mxx\033[0m %s\n' "$*" >&2; exit 1; }

profiles_for() {
  case "${1:-prod}" in
    prod) echo "--profile prod" ;;
    dev) echo "--profile dev" ;;
    all) echo "--profile prod --profile dev" ;;
    *) fail "unknown target '$1' (expected prod, dev, or all)" ;;
  esac
}

version_tag() {
  local sha
  sha=$(git rev-parse --short HEAD)
  if [[ -n $(git status --porcelain) ]]; then sha="$sha-dirty"; fi
  echo "$sha"
}

# Prod has a Dockerfile HEALTHCHECK, so trust Docker's verdict.
wait_prod() {
  log "waiting for $PROD_CONTAINER to report healthy (timeout ${PROD_TIMEOUT}s)"
  local deadline=$((SECONDS + PROD_TIMEOUT)) state
  while ((SECONDS < deadline)); do
    state=$(docker inspect -f '{{.State.Health.Status}}' "$PROD_CONTAINER" 2>/dev/null || echo missing)
    case $state in
      healthy) log "prod healthy on http://localhost:$PROD_PORT"; return 0 ;;
      unhealthy | missing) break ;;
    esac
    sleep 3
  done
  docker logs --tail 40 "$PROD_CONTAINER" 2>&1 || true
  fail "prod did not become healthy (last state: $state)"
}

# The dev container has no HEALTHCHECK; poll the same cheap route prod uses.
wait_dev() {
  log "waiting for dev server on :$DEV_PORT (timeout ${DEV_TIMEOUT}s; first compile is slow)"
  local deadline=$((SECONDS + DEV_TIMEOUT))
  while ((SECONDS < deadline)); do
    if curl -fs -o /dev/null --max-time 60 "http://localhost:$DEV_PORT/api/sync-status"; then
      log "dev ready on http://localhost:$DEV_PORT"
      return 0
    fi
    if [[ $(docker inspect -f '{{.State.Running}}' "$DEV_CONTAINER" 2>/dev/null) != true ]]; then
      break
    fi
    sleep 5
  done
  docker logs --tail 40 "$DEV_CONTAINER" 2>&1 || true
  fail "dev server did not come up"
}

cmd_up() {
  local target=${1:-prod}
  # shellcheck disable=SC2046
  case $target in
    prod | all)
      local tag
      tag=$(version_tag)
      log "building prod image ($tag)"
      compose $(profiles_for prod) build
      docker tag "$IMAGE:local" "$IMAGE:$tag"
      compose $(profiles_for prod) up -d
      ;;
  esac
  case $target in
    dev | all)
      # Source is bind-mounted and hot-reloads; recreating picks up changes to
      # package.json / env / compose config, which hot reload does not.
      log "recreating dev container"
      compose $(profiles_for dev) up -d --force-recreate
      ;;
  esac
  case $target in
    prod) wait_prod ;;
    dev) wait_dev ;;
    all) wait_prod && wait_dev ;;
    *) profiles_for "$target" >/dev/null ;;
  esac
}

cmd_rollback() {
  local tag=${1:-}
  [[ -n $tag ]] || fail "usage: deploy.sh rollback <tag>   (see: deploy.sh versions)"
  docker image inspect "$IMAGE:$tag" >/dev/null 2>&1 || fail "no image $IMAGE:$tag"
  log "rolling prod back to $tag"
  docker tag "$IMAGE:$tag" "$IMAGE:local"
  compose --profile prod up -d --no-build --force-recreate
  wait_prod
}

cmd_versions() {
  local current
  current=$(docker image inspect -f '{{.Id}}' "$IMAGE:local" 2>/dev/null || true)
  docker images "$IMAGE" --format '{{.ID}}\t{{.Tag}}\t{{.CreatedSince}}' |
    awk -F'\t' '$2 != "local"' |
    while IFS=$'\t' read -r id tag created; do
      marker=" "
      [[ $current == *"$id"* ]] && marker="*"
      printf '%s %-20s %s\n' "$marker" "$tag" "$created"
    done
  echo "(* = currently deployed as :local)"
}

cmd_logs() {
  local target=${1:-prod} lines=${2:-100}
  case $target in
    prod) docker logs -f --tail "$lines" "$PROD_CONTAINER" ;;
    dev) docker logs -f --tail "$lines" "$DEV_CONTAINER" ;;
    *) fail "logs takes prod or dev" ;;
  esac
}

cmd_status() {
  docker ps -a --filter "name=^$PROD_CONTAINER\$" --filter "name=^$DEV_CONTAINER\$" \
    --format 'table {{.Names}}\t{{.Status}}\t{{.Image}}'
  for port in "$PROD_PORT" "$DEV_PORT"; do
    code=$(curl -s -o /dev/null -w '%{http_code}' --max-time 10 "http://localhost:$port/api/sync-status" || true)
    echo ":$port /api/sync-status -> ${code:-no response}"
  done
}

cmd_down() {
  # shellcheck disable=SC2046
  compose $(profiles_for "${1:-all}") down
}

case "${1:-}" in
  up) shift; cmd_up "$@" ;;
  rollback) shift; cmd_rollback "$@" ;;
  versions) cmd_versions ;;
  logs) shift; cmd_logs "$@" ;;
  status) cmd_status ;;
  down) shift; cmd_down "$@" ;;
  *) sed -n '2,15p' "$0" | sed 's/^# \{0,1\}//'; exit 1 ;;
esac
