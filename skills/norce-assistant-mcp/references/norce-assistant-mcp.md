# Norce Assistant MCP Reference

Source: https://docs.norce.io/ai/using-the-assistant-mcp-server

Verified from docs on 2026-02-21.

## Server URLs
- API key mode URL: `https://norceassistant.mcp.kapa.ai/mcp`
- Google auth mode URL: `https://norceassistant2.mcp.kapa.ai/mcp`

## Auth Modes
### API key mode
Use request header:
- `Authorization: Bearer <API_KEY>`

Example JSON config block:
```json
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
```

### Google OAuth mode
Use this server URL and do not add API key headers:
```json
{
  "mcpServers": {
    "norce-assistant": {
      "type": "streamable-http",
      "url": "https://norceassistant2.mcp.kapa.ai/mcp"
    }
  }
}
```

## Minimal Validation
After restarting your MCP client, ask:
- "List available tools from the Norce Assistant MCP server."
- "Find docs for order capture integration in Norce."

