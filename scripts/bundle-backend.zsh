#!/bin/zsh
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT/backend"

if [[ ! -f .env ]]; then
  echo "❌ backend/.env not found. Copy backend/.env.example to backend/.env and configure it."
  exit 1
fi

echo "📦 Installing backend dependencies..."
npm install

echo "📁 Running backend bundle (deploy/ folder)..."
npm run bundle

echo "✅ Backend deploy artifact: $ROOT/backend/deploy/"
