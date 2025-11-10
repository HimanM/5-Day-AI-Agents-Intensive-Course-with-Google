# 5‑Day AI Agents Intensive (Google × Kaggle) — Personal Notes and Project

Date: 2025‑11‑10 (Day 1)

Welcome to my working repository for the “5‑Day AI Agents Intensive Course with Google,” hosted in partnership with Kaggle. I’m documenting what I learn each day and building hands‑on multi‑agent systems using Google’s Agent Development Kit (ADK). The repo includes runnable examples for everyday content posted on kaggle by this 5 day course`.

A quick thanks to the Kaggle team and presenters — this is shaping up to be a very practical sprint into agentic architectures. 🎯

---

## Today’s Learnings (Day 1 — 2025‑11‑10)

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
│  └─ loop_workflow/          # LoopAgent: critique/refine with escalation
├─ web/                       # Next.js 14 frontend (Tailwind, shadcn, SSE chat UI)
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

## Plan for the week (placeholders)
- Day 1 (today) — Agent architectures and ADK workflows ✅
- Day 2 (tomorrow) — TODO (will update after the session)
- Day 3 — TODO
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
