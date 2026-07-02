#!/bin/zsh
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"

"$ROOT/scripts/bundle-backend.zsh"
"$ROOT/scripts/bundle-frontend.zsh"

echo "✅ All deploy artifacts ready."
echo "   Frontend → $ROOT/frontend/dist/"
echo "   Backend  → $ROOT/backend/deploy/"
