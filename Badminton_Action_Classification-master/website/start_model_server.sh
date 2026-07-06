#!/usr/bin/env bash
# Launch the Python FastAPI model server for badminton action classification.
# Run this BEFORE (or alongside) `npm run dev` so the Next.js app can
# forward video uploads to the real ML model.
#
# Usage:
#   ./start_model_server.sh            # default: port 8000, cpu
#   PORT=8080 ./start_model_server.sh  # override port

set -euo pipefail

# ---- paths ------------------------------------------------------------------
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
ML_PROJECT="$(cd "$SCRIPT_DIR/../model" && pwd)"
VENV="${ML_PROJECT}/.venv/bin"
MODEL="${ML_PROJECT}/model.pt"

if [ ! -f "$MODEL" ]; then
  echo "❌  model.pt not found at ${MODEL}" >&2
  exit 1
fi

# ---- env --------------------------------------------------------------------
export MODEL_PATH="$MODEL"
export PYTHONPATH="${ML_PROJECT}/src${PYTHONPATH:+:$PYTHONPATH}"
export POSE_DEVICE="${POSE_DEVICE:-cpu}"   # cpu | cuda | mps
export POSE_MODE="${POSE_MODE:-balanced}"  # lightweight | balanced | performance

PORT="${PORT:-8000}"

echo "🚀  Starting model server on http://127.0.0.1:${PORT}"
echo "    MODEL_PATH  = ${MODEL_PATH}"
echo "    POSE_DEVICE = ${POSE_DEVICE}"
echo "    POSE_MODE   = ${POSE_MODE}"
echo ""

exec "${VENV}/uvicorn" badminton.serving.app:app \
  --host 127.0.0.1 \
  --port "$PORT" \
  --log-level info
