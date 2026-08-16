#!/usr/bin/env bash
# Sync CI secrets from .env.local to GitHub Secrets.
#
# Usage:
#   ./scripts/sync-secrets.sh           # sync all
#   ./scripts/sync-secrets.sh --dry-run # preview without syncing
#
# Requires: gh CLI (authenticated), jq
#
# ADDING A NEW SECRET
# -------------------
# 1. Add it to .env.example with a comment.
# 2. Add it to the ROUTING table below.

set -euo pipefail

ENV_FILE=".env.local"
DRY_RUN=false

for arg in "$@"; do
  case $arg in
    --dry-run) DRY_RUN=true ;;
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

get() { echo "${ENV[$1]:-}"; }

# ============================================================
# Routing table — single source of truth.
# Format: "KEY:gh"  (gh = y to sync to GitHub Secrets)
# ============================================================
ROUTING=(
  "CF_ACCOUNT_ID:y"
  "CF_API_TOKEN:y"
  "CF_WORKER_NAME:y"
  "CF_CUSTOM_DOMAIN:y"
)

GH_SECRETS=()
declare -A ROUTED_KEYS
for entry in "${ROUTING[@]}"; do
  IFS=: read -r k gh <<< "$entry"
  ROUTED_KEYS["$k"]=1
  [[ "$gh" == "y" ]] && GH_SECRETS+=("$k")
done

# Warn about keys in .env.example not in the routing table
ENV_EXAMPLE="$(dirname "$ENV_FILE")/.env.example"
if [[ -f "$ENV_EXAMPLE" ]]; then
  while IFS= read -r line; do
    [[ "$line" =~ ^[[:space:]]*# ]] && continue
    [[ -z "${line// }" ]] && continue
    if [[ "$line" =~ ^([A-Za-z_][A-Za-z0-9_]*)= ]]; then
      k="${BASH_REMATCH[1]}"
      if [[ -z "${ROUTED_KEYS[$k]:-}" ]]; then
        echo "Warning: '$k' is in .env.example but not in ROUTING table in this script." >&2
      fi
    fi
  done < "$ENV_EXAMPLE"
fi

echo "==> Syncing GitHub Secrets..."
for secret in "${GH_SECRETS[@]}"; do
  val="$(get $secret)"
  if [[ -z "$val" ]]; then
    printf "  %-30s skip (empty)\n" "$secret"
    continue
  fi
  if $DRY_RUN; then
    printf "  %-30s [dry-run]\n" "$secret"
  else
    printf "  %-30s " "$secret"
    printf '%s' "$val" | gh secret set "$secret"
    echo "ok"
  fi
done

echo ""
echo "All done."
