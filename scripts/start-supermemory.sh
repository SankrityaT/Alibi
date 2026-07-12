#!/usr/bin/env bash
# Start Supermemory Local with the memory layer fully on-device (local Xenova
# embeddings, local storage, local search + graph) and the one-off memory
# EXTRACTION step pointed at OpenAI gpt-4o-mini.
#
# Why a cloud key for extraction: Supermemory turns raw text into memory rows
# with an LLM. The only local model its docs bless for that is gpt-oss:20b
# (~14GB), which doesn't fit comfortably on this machine; small local models
# emit 0 memories. gpt-4o-mini does the split correctly for ~pennies. Swap to a
# local model any time by setting OPENAI_BASE_URL=http://localhost:11434/v1 and
# OPENAI_MODEL=gpt-oss:20b.
#
# Config is read from the gitignored .env (SUPERMEMORY_MODEL_API_KEY, etc.).
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
[ -f "$ROOT/.env" ] && set -a && . "$ROOT/.env" && set +a

DATA_DIR="${SUPERMEMORY_DATA_DIR:-$HOME/.supermemory-v5}"
DATA_DIR="${DATA_DIR/#\~/$HOME}"
MODEL="${SUPERMEMORY_MODEL_MODEL:-gpt-4o-mini}"
BIN="$HOME/.supermemory/bin/supermemory-server"

if [ -z "${SUPERMEMORY_MODEL_API_KEY:-}" ]; then
  echo "SUPERMEMORY_MODEL_API_KEY is not set in .env — extraction will fail." >&2
  exit 1
fi

pkill -9 -f supermemory-server 2>/dev/null || true
sleep 1

echo "Starting Supermemory (data: $DATA_DIR, extraction model: $MODEL) …"
cd "$HOME"
SUPERMEMORY_DATA_DIR="$DATA_DIR" \
OPENAI_API_KEY="$SUPERMEMORY_MODEL_API_KEY" \
OPENAI_MODEL="$MODEL" \
  nohup "$BIN" > /tmp/supermemory.out 2>&1 &

for i in $(seq 1 25); do
  code="$(curl -s -o /dev/null -w '%{http_code}' --max-time 3 http://localhost:6767/ 2>/dev/null || true)"
  if [ "$code" != "000" ] && [ -n "$code" ]; then
    echo "Supermemory up on http://localhost:6767 (after ${i}s)"
    exit 0
  fi
  sleep 1
done
echo "Supermemory did not come up in time — check /tmp/supermemory.out" >&2
exit 1
