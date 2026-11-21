#!/usr/bin/env bash
set -e

echo "========================================================"
echo "              CLIPFORGE - AI VIDEO CLIPPING"
echo "========================================================"
echo ""

# Ensure virtualenv exists
if [ ! -d ".venv" ]; then
    echo "[1/3] Creating Python virtual environment..."
    uv venv .venv --python 3.11
    uv pip install -r requirements.txt
fi

echo "[2/3] Starting FastAPI Backend on http://localhost:8000..."
(
  export PYTHONPATH=apps/api
  export PYTHONIOENCODING=utf-8
  .venv/bin/uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
) &
API_PID=$!

echo "[3/3] Starting Next.js Web Frontend on http://localhost:3000..."
(
  cd apps/web
  npm run dev
) &
WEB_PID=$!

trap "kill $API_PID $WEB_PID" EXIT

echo ""
echo "========================================================"
echo "  ClipForge is running!"
echo "  Web Studio:   http://localhost:3000"
echo "  API Docs:     http://localhost:8000/docs"
echo "========================================================"

wait
