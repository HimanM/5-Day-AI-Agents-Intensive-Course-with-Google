"""MCP Generator Agent using ADK.

This agent uses the Model Context Protocol (MCP) to connect to external services
and generate content. It demonstrates MCP integration with ADK agents.

Features:
- Connects to MCP servers using stdio communication
- Uses the Everything MCP server for content generation
- Demonstrates MCP tool integration patterns

Run:
    adk run mcp_generator
Web UI:
    adk web . --port 8000

Select agent: mcp_generator
Requires: google-adk installed & API key
Note: Requires Node.js/npm for MCP server execution
"""
import os
from google.adk.agents import Agent
from google.adk.tools.mcp_tool.mcp_toolset import McpToolset
from google.adk.tools.mcp_tool.mcp_session_manager import StdioConnectionParams
from mcp import StdioServerParameters

MODEL = "gemini-2.0-flash"

# Compute path to the local MCP server script relative to this file.
# This lets the agent spawn the server using a path that's valid
# whether ADK is run from the repo root or from the Agents folder.
SCRIPT_PATH = os.path.join(os.path.dirname(__file__), "simple_mcp_server.js")

# MCP integration with local Simple Content Server
# This provides various tools including content generation capabilities
mcp_content_server = McpToolset(
    connection_params=StdioConnectionParams(
        server_params=StdioServerParameters(
                command='node',  # Run our local MCP server
                args=[SCRIPT_PATH],  # Path to our local server script (computed at runtime)
                tool_filter=['getTinyImage', 'echo', 'addNumbers']  # Filter to specific tools
            ),
        timeout=30,  # Shorter timeout for local server
    )
)

# Main agent with MCP integration
root_agent = Agent(
    model=MODEL,
    name="mcp_generator_agent",
    description="Content generator using MCP servers for external tool integration.",
    instruction="""You are a content generator assistant that uses MCP (Model Context Protocol) tools.

Available MCP tools you can use:
- getTinyImage: Generate a tiny sample image (16x16 pixels, base64 encoded)
- echo: Echo back text with optional modifications
- addNumbers: Add two numbers together

When users ask you to generate content:
1. Use the appropriate MCP tool based on their request
2. For image requests, use getTinyImage to generate sample images
3. For text manipulation, use echo tool
4. For calculations, use addNumbers tool
5. After using a tool, provide a brief explanation of what was generated
6. Keep responses concise and end after tool usage

IMPORTANT: After using any MCP tool, provide your final response and stop. Do not continue the conversation or ask follow-up questions.

Examples:
- User: "Generate a sample image"
  You: [Use getTinyImage tool] → "Here's a tiny 16x16 pixel sample image generated using the MCP getTinyImage tool."

- User: "Echo hello world"
  You: [Use echo tool] → "Echo result: hello world"

- User: "Add 5 + 3"
  You: [Use addNumbers tool] → "5 + 3 = 8"

Be helpful and demonstrate MCP tool capabilities clearly.""",
    tools=[mcp_content_server],
)