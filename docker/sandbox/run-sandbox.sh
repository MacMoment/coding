#!/bin/sh

# Sandbox execution script
# Usage: run-sandbox.sh <project-type> <command> <project-path>

set -e

PROJECT_TYPE=$1
COMMAND=$2
PROJECT_PATH=$3

TIMEOUT=${SANDBOX_TIMEOUT_MS:-60000}
MEMORY_LIMIT=${SANDBOX_MEMORY_LIMIT_MB:-512}

case $PROJECT_TYPE in
  "discord-node")
    docker run --rm \
      --memory="${MEMORY_LIMIT}m" \
      --cpus="0.5" \
      --network none \
      -v "$PROJECT_PATH:/app:ro" \
      -w /app \
      node:20-alpine \
      timeout $((TIMEOUT/1000)) $COMMAND
    ;;
  "discord-python")
    docker run --rm \
      --memory="${MEMORY_LIMIT}m" \
      --cpus="0.5" \
      --network none \
      -v "$PROJECT_PATH:/app:ro" \
      -w /app \
      python:3.11-alpine \
      timeout $((TIMEOUT/1000)) $COMMAND
    ;;
  "minecraft-java")
    docker run --rm \
      --memory="${MEMORY_LIMIT}m" \
      --cpus="1" \
      --network none \
      -v "$PROJECT_PATH:/app:ro" \
      -w /app \
      gradle:8-jdk17-alpine \
      timeout $((TIMEOUT/1000)) $COMMAND
    ;;
  *)
    echo "Unknown project type: $PROJECT_TYPE"
    exit 1
    ;;
esac
