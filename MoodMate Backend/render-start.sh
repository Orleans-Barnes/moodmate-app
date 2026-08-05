#!/usr/bin/env bash
set -euo pipefail

PUBLIC_PORT="${PORT:-10000}"
JAVA_OPTS="${JAVA_OPTS:-}"

start_service() {
  local module="$1"
  local port="$2"
  local jar

  jar="$(find "$module/target" -maxdepth 1 -type f -name '*.jar' ! -name '*sources.jar' ! -name '*javadoc.jar' | head -n 1)"
  if [[ -z "$jar" ]]; then
    echo "Could not find jar for $module" >&2
    exit 1
  fi

  echo "Starting $module on $port"
  java $JAVA_OPTS -jar "$jar" --server.port="$port" &
}

start_service moodmate-auth 8091
start_service moodmate-mood 8092
start_service moodmate-support 8093
start_service moodmate-community 8094
start_service moodmate-wellness 8095
start_service moodmate-wallet 8096
start_service moodmate-journal 8097
start_service moodmate-gamification 8098
start_service moodmate-admin 8099
start_service moodmate-crisis 8100
start_service moodmate-ai 8101
start_service moodmate-notifications 8102

jar="$(find moodmate-gateway/target -maxdepth 1 -type f -name '*.jar' ! -name '*sources.jar' ! -name '*javadoc.jar' | head -n 1)"
if [[ -z "$jar" ]]; then
  echo "Could not find jar for moodmate-gateway" >&2
  exit 1
fi

echo "Starting moodmate-gateway on public port $PUBLIC_PORT"
exec java $JAVA_OPTS -jar "$jar" --server.port="$PUBLIC_PORT"
