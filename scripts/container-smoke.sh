#!/usr/bin/env bash
set -euo pipefail

image_ref="${1:?Usage: container-smoke.sh IMAGE_REF}"
host_port="${PAGMANAGER_SMOKE_PORT:-18080}"
suffix="${GITHUB_RUN_ID:-local}-$$"
container_name="pagmanager-smoke-${suffix}"
volume_name="pagmanager-smoke-data-${suffix}"
base_url="http://127.0.0.1:${host_port}"

cleanup() {
  docker rm --force "$container_name" >/dev/null 2>&1 || true
  docker volume rm "$volume_name" >/dev/null 2>&1 || true
}
trap cleanup EXIT

docker volume create "$volume_name" >/dev/null
docker run --detach \
  --name "$container_name" \
  --publish "127.0.0.1:${host_port}:8080" \
  --volume "${volume_name}:/data" \
  "$image_ref" >/dev/null

wait_for_health() {
  for _ in $(seq 1 60); do
    if curl --fail --silent "$base_url/api/v1/health" >/dev/null; then
      return 0
    fi
    if [ "$(docker inspect --format '{{.State.Running}}' "$container_name")" != true ]; then
      docker logs "$container_name"
      return 1
    fi
    sleep 1
  done

  docker logs "$container_name"
  echo "Container did not become healthy at /api/v1/health." >&2
  return 1
}

wait_for_health
curl --fail --silent "$base_url/" | grep -q 'id="root"'
curl --fail --silent "$base_url/login" | grep -q 'id="root"'

suffix_email="${suffix//[^a-zA-Z0-9]/}"
email="container-${suffix_email}@example.test"
password="ContainerSmokePass123!"
curl --fail --silent --show-error --output /dev/null \
  --header 'content-type: application/json' \
  --data "{\"username\":\"Container Smoke\",\"email\":\"${email}\",\"passwd\":\"${password}\"}" \
  "$base_url/api/v1/auth/register"

docker restart "$container_name" >/dev/null
wait_for_health

curl --fail --silent --show-error \
  --header 'content-type: application/json' \
  --data "{\"email\":\"${email}\",\"passwd\":\"${password}\"}" \
  "$base_url/api/v1/auth/login" >/dev/null

echo "Container serves the UI and API and retained the registered account after restart."
