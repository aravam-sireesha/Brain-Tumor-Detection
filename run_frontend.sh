#!/usr/bin/env bash
# Quick-start script: run the React frontend.
set -e
cd "$(dirname "$0")/frontend"

if [ ! -f ".env" ]; then
  cp .env.example .env
fi

if [ ! -d "node_modules" ]; then
  echo "Installing frontend dependencies..."
  npm install
fi

echo "Starting React dev server on http://localhost:5173 ..."
npm run dev
