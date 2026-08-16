#!/usr/bin/env bash
# Validates .env.local before your first deploy.
#
# Workers static assets don't need a project-creation step or custom-domain
# API calls — scripts/deploy.sh passes both the worker name and (if set)
# the custom domain straight to `wrangler deploy` as CLI flags. This script
# just checks the required vars are present before you go further.
#
# Usage:
#   ./scripts/scaffold.sh              # validate .env.local
#   ./scripts/scaffold.sh --env=FILE   # validate a different env file

set -euo pipefail

ENV_FILE=".env.local"

for arg in "$@"; do
  case $arg in
    --env=*) ENV_FILE="${arg#--env=}" ;;
  esac
done

if [[ ! -f "$ENV_FILE" ]]; then
  echo "Error: $ENV_FILE not found. Copy .env.example to .env.local and fill it in." >&2
  exit 1
fi

# --- Parse env file ---
declare -A ENV
while IFS= read -r line; do
  [[ "$line" =~ ^[[:space:]]*# ]] && continue
  [[ -z "${line// }" ]] && continue
  if [[ "$line" =~ ^([A-Za-z_][A-Za-z0-9_]*)=(.*)$ ]]; then
    key="${BASH_REMATCH[1]}"
    val="${BASH_REMATCH[2]}"
    val="${val#\"}" ; val="${val%\"}"
    val="${val#\'}" ; val="${val%\'}"
    ENV["$key"]="$val"
  fi
done < "$ENV_FILE"

for var in CF_ACCOUNT_ID CF_API_TOKEN CF_WORKER_NAME; do
  if [[ -z "${ENV[$var]:-}" ]]; then
    echo "Error: $var not set in $ENV_FILE" >&2; exit 1
  fi
done

echo "$ENV_FILE looks good."
echo ""
echo "Next steps:"
echo "  1. Run ./scripts/sync-secrets.sh to push CI secrets to GitHub"
echo "  2. Run 'pnpm run deploy' for your first deploy"
