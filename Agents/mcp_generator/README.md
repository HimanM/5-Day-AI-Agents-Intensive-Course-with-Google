# MCP Generator Agent

An ADK agent that demonstrates **Model Context Protocol (MCP)** integration for content generation using a local MCP server.

## Features

- ✅ **MCP Integration** - Connects to local MCP server using stdio communication
- ✅ **Content Generation Tools** - Uses local MCP server with getTinyImage, echo, and addNumbers tools
- ✅ **Image Generation** - Generate tiny sample images (16x16 pixels)
- ✅ **Text Processing** - Echo and manipulate text content
- ✅ **Math Operations** - Perform basic arithmetic calculations
- ✅ **Local Server** - No external dependencies or npx hanging issues
- ✅ **Stable Connection** - Local server provides reliable MCP tool access

## How It Works

This agent uses the **Model Context Protocol (MCP)** to connect to a local MCP server:

1. **Local MCP Server**: Custom Node.js server (`simple_mcp_server.js`) implements MCP tools
2. **MCP Client**: Your ADK agent that uses these tools through standardized interfaces
3. **Communication**: Uses stdio (standard input/output) for secure, local communication

**Available Tools:**
- `getTinyImage`: Generate a tiny 16x16 pixel sample image (base64 encoded)
- `echo`: Echo back text with optional modifications
- `addNumbers`: Add two numbers together

## Run

```powershell
# From parent directory containing Agents/
adk run Agents/mcp_generator

# Or web UI
adk web . --port 8000
```

Then select `mcp_generator` from the agent dropdown.

## Example Prompts

```
"Generate a sample image"
"Echo this text: hello world"
"Add 5 + 3"
"Create a tiny image for me"
```

## Technical Details

- **Model**: `gemini-2.0-flash`
- **MCP Server**: Local Node.js server (`simple_mcp_server.js`)
- **Communication**: Stdio connection with 30-second timeout
- **Tool Filtering**: Limited to safe content generation tools
- **No External Dependencies**: Everything runs locally

## Requirements

- **Node.js**: Required for running the local MCP server
- **Google ADK**: For agent framework
- **API Key**: GOOGLE_API_KEY environment variable

## Architecture Pattern

This follows the **Day 2b Kaggle notebook pattern**:
- Single agent with MCP tool integration
- Local server connection without external dependencies
- Standardized tool interfaces
- Stable stdio communication

## Why Local MCP Server?

**Before**: External npx servers that could hang or disconnect
**Now**: Local Node.js server with stable, persistent connections

MCP enables agents to:
- 🔧 Use community-built integrations
- 📈 Scale capabilities without custom development
- 🔒 Maintain security through standardized protocols
- ⚡ Provide stable, local tool access

## Files

- `agent.py`: Main ADK agent with MCP integration
- `simple_mcp_server.js`: Local MCP server implementing tools
- `__init__.py`: Package initialization
- `README.md`: This documentation

## Notes

- The local MCP server implements all tools in pure JavaScript
- No external API calls or network dependencies
- All tool execution happens locally for maximum stability
- This demonstrates MCP integration patterns that can be extended to other servers