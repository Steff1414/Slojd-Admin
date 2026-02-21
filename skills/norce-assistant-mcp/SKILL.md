---
name: norce-assistant-mcp
description: Configure and use the Norce Assistant MCP server for AI-assisted Norce integration work. Use when the user asks to connect an MCP client to Norce Assistant, troubleshoot MCP auth/connection issues, or query Norce Assistant for APIs, integrations, apps, or setup guidance.
---

# Norce Assistant MCP

## Quick Start
- Read `references/norce-assistant-mcp.md` for the current server endpoints and auth modes.
- Choose auth mode:
  - API key (recommended for automation).
  - Google OAuth (interactive).
- Generate a ready-to-paste config snippet with `scripts/render_mcp_config.sh`.
- Add the snippet to the user's MCP client config and restart the client.
- Validate by asking the model to list tools from the Norce Assistant MCP server.

## Workflow
1. Confirm which MCP client/environment the user wants to configure.
2. Ask for auth mode if not specified.
3. If API key mode is selected:
   - Prefer storing the token as an environment variable (for example `NORCE_ASSISTANT_API_KEY`).
   - Use `Authorization: Bearer <token>` in MCP headers.
4. If Google OAuth mode is selected:
   - Use the Google-auth server URL and no API key header.
5. Provide a minimal config block and one verification prompt.
6. If connection fails, troubleshoot in this order:
   - Wrong server URL.
   - Missing or malformed `Authorization` header.
   - Bearer token missing prefix `Bearer `.
   - Client restart not performed after config update.

## Security Rules
- Never commit live API keys to repo files.
- Prefer environment-variable placeholders in examples.
- If the user explicitly asks to embed a key locally, warn that it should stay uncommitted.

## Output Rules
- Keep config examples minimal and copy-paste ready.
- Show one example per auth mode.
- Always include one validation step after setup.

## Resources
- `references/norce-assistant-mcp.md`: Canonical MCP endpoint/auth reference for Norce Assistant.
- `scripts/render_mcp_config.sh`: Generates ready config snippets for API key or Google mode.
