#!/usr/bin/env bash
set -euo pipefail

MODE="${1:-api-key}"

if [[ "$MODE" == "api-key" ]]; then
  cat <<'JSON'
{
  "mcpServers": {
    "norce-assistant": {
      "type": "streamable-http",
      "url": "https://norceassistant.mcp.kapa.ai/mcp",
      "headers": {
        "Authorization": "Bearer ${NORCE_ASSISTANT_API_KEY}"
      }
    }
  }
}
JSON
elif [[ "$MODE" == "google" ]]; then
  cat <<'JSON'
{
  "mcpServers": {
    "norce-assistant": {
      "type": "streamable-http",
      "url": "https://norceassistant2.mcp.kapa.ai/mcp"
    }
  }
}
JSON
else
  echo "Usage: $0 [api-key|google]" >&2
  exit 1
fi
