#!/usr/bin/env bash
# Builds and deploys to Cloudflare Workers.
#
# CF_WORKER_NAME and CF_CUSTOM_DOMAIN are read from .env.local when present
# (local runs), or from already-exported env vars otherwise (CI, where
# they're injected from GitHub Secrets — see .github/workflows/*.yml).
# This is the single place that name/domain get turned into wrangler flags,
# so wrangler.toml itself never needs project-specific editing.
#
# Usage:
#   ./scripts/deploy.sh                    # build + deploy as CF_WORKER_NAME, with custom domain if set
#   ./scripts/deploy.sh --name=foo-pr-123  # deploy under a different name, no custom domain (PR previews)

set -euo pipefail

ENV_FILE=".env.local"
NAME_OVERRIDE=""

for arg in "$@"; do
  case $arg in
    --name=*) NAME_OVERRIDE="${arg#--name=}" ;;
    --env=*) ENV_FILE="${arg#--env=}" ;;
  esac
done

if [[ -f "$ENV_FILE" ]]; then
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
  : "${CF_ACCOUNT_ID:=${ENV[CF_ACCOUNT_ID]:-}}"
  : "${CF_API_TOKEN:=${ENV[CF_API_TOKEN]:-}}"
  : "${CF_WORKER_NAME:=${ENV[CF_WORKER_NAME]:-}}"
  : "${CF_CUSTOM_DOMAIN:=${ENV[CF_CUSTOM_DOMAIN]:-}}"
fi

: "${CF_ACCOUNT_ID:?CF_ACCOUNT_ID not set (in $ENV_FILE or environment)}"
: "${CF_API_TOKEN:?CF_API_TOKEN not set (in $ENV_FILE or environment)}"
: "${CF_WORKER_NAME:?CF_WORKER_NAME not set (in $ENV_FILE or environment)}"

export CLOUDFLARE_API_TOKEN="$CF_API_TOKEN"
export CLOUDFLARE_ACCOUNT_ID="$CF_ACCOUNT_ID"

NAME="${NAME_OVERRIDE:-$CF_WORKER_NAME}"

pnpm build

ARGS=(deploy --name="$NAME")
# Only the canonical worker (no --name override) gets the custom domain —
# PR previews attaching the same route would fight over it.
if [[ -n "${CF_CUSTOM_DOMAIN:-}" && -z "$NAME_OVERRIDE" ]]; then
  ARGS+=(--domains="$CF_CUSTOM_DOMAIN")
fi

echo "==> Deploying '$NAME'..."
npx wrangler "${ARGS[@]}"
