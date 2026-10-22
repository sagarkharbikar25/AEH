#!/usr/bin/env bash
set -euo pipefail

# ==============================================================================
# POLARIS ONE-COMMAND DEPLOYMENT SCRIPT
# Builds workspace packages, restarts systemd services, and probes health check
# ==============================================================================

TARGET_HOST="${1:-localhost}"
API_URL="http://${TARGET_HOST}:3000/api/health"

echo ">>> [1/4] Running root workspace build & typecheck..."
npm run build
npm run typecheck

echo ">>> [2/4] Restarting systemd services..."
if command -v systemctl >/dev/null 2>&1; then
  sudo systemctl restart decider || true
  sudo systemctl restart polaris-api
  sudo systemctl reload caddy || true
else
  echo ">>> [Note] systemctl not found (local/dev container environment). Skipping service restart."
fi

echo ">>> [3/4] Probing backend API health check at ${API_URL}..."
sleep 2

MAX_ATTEMPTS=10
ATTEMPT=1
SUCCESS=0

while [ "$ATTEMPT" -le "$MAX_ATTEMPTS" ]; do
  if curl -sf "${API_URL}" >/dev/null 2>&1; then
    SUCCESS=1
    break
  fi
  echo ">>> Health probe attempt ${ATTEMPT}/${MAX_ATTEMPTS} failed, retrying in 2s..."
  sleep 2
  ATTEMPT=$((ATTEMPT + 1))
done

if [ "$SUCCESS" -eq 1 ]; then
  echo ">>> [4/4] Deployment SUCCESSFUL! Health check returned HTTP 200."
  curl -s "${API_URL}" | grep -o '"version":"[^"]*"' || true
else
  echo ">>> [ERROR] Deployment FAILED: Health probe at ${API_URL} did not respond within timeout." >&2
  exit 1
fi
