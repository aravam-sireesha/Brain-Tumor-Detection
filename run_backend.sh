#!/usr/bin/env bash
# Quick-start script: run the FastAPI backend.
set -e
cd "$(dirname "$0")/backend"

if [ ! -d "venv" ]; then
  echo "Creating virtual environment..."
  python3 -m venv venv
fi

source venv/bin/activate
pip install -q -r requirements.txt

echo "Starting FastAPI backend on http://localhost:8000 ..."
uvicorn app.main:app --reload --port 8000
