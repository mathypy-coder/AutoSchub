#!/bin/bash
# Session Claude Code dans le cloud : installe les dépendances (serveur + client)
# pour que `npm test` et `npm run build` fonctionnent dès le début de la session.
set -euo pipefail

if [ "${CLAUDE_CODE_REMOTE:-}" != "true" ]; then
  exit 0
fi

cd "$CLAUDE_PROJECT_DIR"
# npm install (et non npm ci) : réutilise node_modules mis en cache avec le conteneur.
npm install --no-audit --no-fund
