# 5‑Day AI Agents Intensive (Google × Kaggle) — Personal Notes and Project

Date: 2025‑11‑10 (Day 1)

Welcome to my working repository for the “5‑Day AI Agents Intensive Course with Google,” hosted in partnership with Kaggle. I’m documenting what I learn each day and building hands‑on multi‑agent systems using Google’s Agent Development Kit (ADK). The repo includes runnable examples for everyday content posted on kaggle by this 5 day course`.

A quick thanks to the Kaggle team and presenters — this is shaping up to be a very practical sprint into agentic architectures. 🎯

---

## Day 2 — 2025-11-11

Today I followed the Kaggle Day 2 materials focused on agent tools and best practices. The official notebooks we used as reference are:

- Day 2a — Agent tools: https://www.kaggle.com/code/kaggle5daysofai/day-2a-agent-tools
- Day 2b — Agent tools & best practices: https://www.kaggle.com/code/kaggle5daysofai/day-2b-agent-tools-best-practices

Summary of the notebooks (high level)
- Day 2a walks through practical agent tool patterns: defining simple tools, exposing them via the ADK tool API, and wiring agents to call tools during generation. It covers I/O shapes for tool responses (text, structured data, and binary payloads encoded as base64) and shows example tools like "echo", arithmetic helpers, and small content servers.
- Day 2b focuses on best practices: robust streaming, handling tool-generated structured parts (text vs. images), sanitizing data URLs, and safe rendering in frontends. It also covers stable local development patterns (run tool servers locally instead of relying on npx remote scripts) and defensive SSE parsing on the client.

What we implemented today in this repo
- `Agents/currency_converter` — Currency conversion agent (tool & code-execution hybrid)
  - Purpose: Demonstrates a multi-agent pattern where one agent fetches exchange-rate data (using `google_search`) and a separate agent is used as a code-execution tool to run Python that computes the final converted amount.
  - Implementation details:
    - `currency_fetcher_agent` — an LlmAgent that uses the ADK `google_search` tool to obtain up-to-date exchange rate information and returns structured rate data.
    - `calculation_agent` — an LlmAgent configured to ONLY emit Python code; it is wired with `BuiltInCodeExecutor()` so that its generated code is executed safely and its stdout is captured as the calculation result.
    - `currency_converter_agent` (root agent) — composes the two agents above by wrapping them as `AgentTool(agent=...)` instances. The root agent calls the fetcher to obtain rates and then invokes the code-execution agent to perform the numeric conversion.
  - Key files: `Agents/currency_converter/agent.py` (defines `currency_fetcher_agent`, `calculation_agent` with `BuiltInCodeExecutor()`, and the `currency_converter_agent` that uses both as tools).
  - Notes: This pattern (agents-as-tools + code execution) is useful when you want the LLM to generate code for precise numeric tasks while still grounding lookups in search results. It also separates concerns (data retrieval vs. deterministic computation).

- `Agents/mcp_generator` — MCP (Model Context Protocol) generator agent
  - Purpose: Demonstrates using MCP tools to generate content (tiny images, echo text, and numeric operations) and integrating a local MCP server for stability on Windows.
  - Key files:
    - `Agents/mcp_generator/agent.py` — ADK agent that configures a McpToolset using stdio connection params; the agent computes the script path at runtime so it can spawn the local server reliably.
    - `Agents/mcp_generator/simple_mcp_server.js` — Local Node.js MCP server implementing `getTinyImage`, `echo`, and `addNumbers` tools. Runs as an stdio-based MCP server for local development without npx.
    - `Agents/mcp_generator/package.json` — sets `type: "module"` so the local server runs as ESM.
  - Frontend integration: The web UI was updated to parse MCP `functionResponse` parts (including nested image parts), sanitize base64 payloads, and render images inline in the chat safely (no ERR_INVALID_URL).



## Day 1 — 2025‑11‑10

Focus: Agent architectures and workflow orchestration with ADK, grounded in Kaggle’s Day 1 materials and the ADK documentation.

Key takeaways:
- ADK supports modular multi‑agent systems: define specialized agents and compose them using workflow agents.
- Workflow agents are deterministic orchestrators (no LLM inside the orchestrator):
  - SequentialAgent — run sub‑agents in a strict order (A → B → C)
  - ParallelAgent — run sub‑agents concurrently (fan‑out), then aggregate (gather)
  - LoopAgent — iterate a set of sub‑agents until a condition (escalation) or a max iteration count
- Shared session state (`session.state`) enables lightweight data‑passing between steps; `output_key` is used to write values into state.
- Built‑in tools (e.g., `google_search`) can ground responses with real‑time info; Google Search requires displaying suggestions/attributions in UI.

What I implemented today:
- Sequential workflow: topic expansion → drafting → quality improvement.
- Parallel workflow: three research agents run in parallel (each can use Google Search), then a synthesis step.
- Loop workflow: iterative critique and refinement with escalation to stop.

Kaggle references for Day 1:
- Author: https://www.kaggle.com/kaggle5daysofai
- Notebooks uploaded for today cover agent architectures (sequential/parallel/loop). I mirrored and adapted those patterns here with ADK idioms (sub_agents hierarchy, `output_key`, state sharing, escalation) so everything runs locally in `adk web`.

> Note: Kaggle pages may require authentication to view details; titles/structure are reflected conceptually here. As new links are published, I’ll add exact notebook names and specific pointers.

---

## Project structure (what you can run now)

```
Gemini/
├─ Agents/                    # ADK agent packages
│  ├─ my_agent/               # math tools demo (add/multiply)
│  ├─ sequential_workflow/    # SequentialAgent: expand → draft → improve
│  ├─ parallel_workflow/      # ParallelAgent + synthesis; uses google_search
│  ├─ loop_workflow/          # LoopAgent: critique/refine with escalation
│  ├─ currency_converter/     # Currency conversion (google_search + code execution)
│  ├─ mcp_generator/          # MCP demo: local MCP server + tools (images, echo, add)
│  ├─ session_demo/           # Session state management with TinyDB persistence
│  └─ memory_demo/            # Long-term memory storage with categorization
├─ web/                       # Next.js 14 frontend (Tailwind, shadcn, SSE chat UI, markdown support)
├─ frontend/                  # Simple HTML/JS prototype (legacy)
├─ cors_proxy.py              # FastAPI CORS proxy (dev only)
├─ nginx.conf                 # Production reverse proxy config
└─ README.md                  # This document
```

- Each agent package in `Agents/` defines a `root_agent` in `agent.py` for ADK discovery.
- Parallel workflow includes the ADK built‑in `google_search` tool.
- Web UI: Next.js app with Material Design-inspired styling, sidebar for agent selection + history, streaming chat.

### Running the agents (ADK)
Prereqs (Windows):
```powershell
pip install google-adk
Set-Content .env 'GOOGLE_API_KEY="YOUR_API_KEY"'
```
Launch web UI from the parent directory that contains the agent folders:
```powershell
adk web . --port 8000
```
Open the URL shown (e.g., http://127.0.0.1:8000). Select an agent in the top‑left dropdown:
Open the URL shown (e.g., http://127.0.0.1:8000). Select an agent in the top‑left dropdown:
 - `sequential_workflow`
 - `parallel_workflow` (shows Search grounding behavior)
 - `loop_workflow`
 - `my_agent`

If you see a Windows reload error, try:
To restrict which agents appear, run the server from a directory containing only the desired folders. Each `agent.py` now defines an `app` object wrapping its `root_agent` for improved compatibility.

### Production Web UI (Next.js + Nginx)
For a production-ready setup with Google Material Design styling:

**Development:**
```powershell
# Terminal 1: ADK API server (from Agents folder)
cd Agents
adk api_server . --port 8080

# Terminal 2: Next.js dev server
cd web
npm install
npm run dev
```
Open http://localhost:3000 (Next.js has built-in API routes that proxy to ADK at port 8080, no CORS issues).

**Configuration:** Edit `web/.env.local` to change the ADK server URL (default: `http://127.0.0.1:8080`).

**Production (with Nginx):**
```powershell
# Build Next.js static export
cd web
npm run build

# Start ADK API server
cd ../Agents
adk api_server . --port 8080

# Start Nginx with provided config
# (Install Nginx, copy nginx.conf to /etc/nginx/sites-available/, symlink to sites-enabled)
sudo nginx -c /path/to/nginx.conf
```
Nginx config (`nginx.conf`):
- Serves Next.js static build from `web/out/`
- Proxies `/api/*` to ADK server on port 8080
- **Allow-lists only required endpoints** (`/list-apps`, sessions, `/run`, `/run_sse`)
- **Blocks** `/docs`, `/openapi.json`, and other ADK internals to prevent abuse

Features:
- Material Design-inspired UI (Google fonts, rounded cards, sidebar)
- Agent dropdown + session config in sidebar
- Streaming chat with SSE, aggregates multi-agent responses by author
- Click messages to expand/collapse, single-line truncation by default

### Legacy minimal frontend (optional)
For quick testing, `frontend/index.html` is a standalone HTML file. Requires `cors_proxy.py`:
```powershell
adk api_server Agents --port 8080
python cors_proxy.py
# Open frontend/index.html in browser
```

---

## Notes on Google Search Grounding (used in parallel workflow)
- The `google_search` tool works with Gemini 2.x models.
- You must display Search suggestions and source attributions returned by the model in your UI.
- ADK surfaces grounding metadata; the UI should render `renderedContent` for suggestions (per policy).

---

## Day 3 — 2025-11-12

Today I followed the Kaggle Day 3 materials focused on agent sessions and memory management. The official notebooks we used as reference are:

- Day 3a — Agent sessions: https://www.kaggle.com/code/kaggle5daysofai/day-3a-agent-sessions
- Day 3b — Agent memory: https://www.kaggle.com/code/kaggle5daysofai/day-3b-agent-memory

Summary of the notebooks (high level)
- Day 3a covers session state management: maintaining conversation context, storing user preferences temporarily, and persisting state across interactions using TinyDB. It demonstrates how to track conversation context and user preferences within a session.
- Day 3b focuses on long-term memory: storing facts, personal information, and learned knowledge that persists across multiple sessions. It shows how to categorize memories, search through them, and retrieve relevant information when needed.

What we implemented today in this repo
- `Agents/session_demo` — Session State Management Agent
  - Purpose: Demonstrates session state management with persistent storage using TinyDB. Tracks user preferences and conversation context.
  - Implementation details:
    - State management tools: `save_user_preference`, `get_user_preference`, `list_all_preferences` for managing user data
    - Persistent storage using TinyDB with session_state.db file
    - Backend helper function `get_backend_session_data` that returns session data in `BACKEND_PROCESSES:` format for frontend visualization
    - Automatic preference extraction from user messages (name, country, favorite color, etc.)
  - Key files: `Agents/session_demo/agent.py` (defines session tools and backend helper)
  - Notes: Session state is useful for maintaining context within a conversation and storing temporary user preferences that need to persist across interactions.

- `Agents/memory_demo` — Long-Term Memory Agent
  - Purpose: Demonstrates long-term memory storage and retrieval using TinyDB. Stores facts, preferences, and personal information with categorization.
  - Key files:
    - `Agents/memory_demo/agent.py` — ADK agent with memory management tools including save, search, retrieve, list, and delete operations
  - Memory tools:
    - `save_memory(key, content, category)` — Save memories with unique keys and categories
    - `search_memories(query, category)` — Search memories by content or filter by category
    - `get_memory_by_key(key)` — Retrieve specific memories
    - `list_all_memories(category)` — List all stored memories grouped by category
    - `delete_memory(key)` — Remove memories
    - `get_backend_memory_data()` — Backend helper that returns memory data in `BACKEND_PROCESSES:` format
  - Memory categories:
    - `personal` — Birthdays, names, personal details
    - `preferences` — Favorite things, likes/dislikes
    - `facts` — General knowledge, learned information
    - `goals` — User goals, aspirations
  - Notes: Long-term memory enables AI assistants to remember information across multiple conversations and sessions, creating a more personalized experience.

Frontend enhancements
- Added `react-markdown` support for rendering markdown-formatted text in chat bubbles
- LLM outputs with markdown (bold, italic, code blocks, lists, headings) are now properly formatted
- Custom component styling for markdown elements with dark mode support

---

## Plan for the week (placeholders)
- Day 1 — Agent architectures and ADK workflows ✅
- Day 2 — Agent tools & best practices ✅
  - Covered: defining and wiring tools, agents-as-tools patterns, local MCP servers, safe SSE handling, and frontend image rendering.
  - Implemented in repo: `Agents/currency_converter` (google_search + BuiltInCodeExecutor) and `Agents/mcp_generator` (local MCP server + getTinyImage/echo/addNumbers tools).
- Day 3 — Agent sessions and memory management ✅
  - Covered: session state management, persistent storage with TinyDB, long-term memory with categorization and search, backend data exposure patterns.
  - Implemented in repo: `Agents/session_demo` (session state with preferences) and `Agents/memory_demo` (long-term memory with categories).
- Day 4 — TODO
- Day 5 — TODO (Capstone planning and build)

> I’ll update this README after each live session and assignment drop, linking to any new notebooks from the Kaggle author account.

---

## Credits & Links
- Kaggle course user: https://www.kaggle.com/kaggle5daysofai
- ADK docs: https://google.github.io/adk-docs/
  - Workflow agents: Sequential / Parallel / Loop
  - Built‑in tools: google_search (grounding)
- Discord: https://discord.gg/kaggle

Staying focused on solid agent design and runnable examples — more updates after tomorrow’s session. 🧭
