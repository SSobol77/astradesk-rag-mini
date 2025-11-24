#!/usr/bin/env bash
set -euo pipefail

# build-in-docker.sh
# Run a command inside a JDK 21 container so Gradle/Kotlin tooling uses Java 21.
# Usage: ./scripts/build-in-docker.sh ./gradlew clean build

IMAGE=${IMAGE:-eclipse-temurin:21-jdk}

if [ "$#" -lt 1 ]; then
  echo "Usage: $0 <command...>"
  exit 1
fi

CMD=("$@")

# Preserve UID/GID so files are created with same owner on host
USER_ID=$(id -u)
GROUP_ID=$(id -g)

docker run --rm -it \
  -e "HOME=/root" \
  -e "USER_ID=${USER_ID}" \
  -e "GROUP_ID=${GROUP_ID}" \
  -v "$(pwd)":/workspace \
  -w /workspace \
  ${IMAGE} bash -lc "${CMD[*]}"
