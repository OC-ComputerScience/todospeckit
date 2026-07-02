#!/bin/zsh
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT/frontend"

echo "📦 Installing frontend dependencies..."
npm install

echo "🏗️  Building frontend..."
npm run build

echo "📁 Running frontend bundle (SPA .htaccess into dist/)..."
npm run bundle

echo "✅ Frontend deploy artifact: $ROOT/frontend/dist/"
