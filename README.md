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
├─ my_agent/                  # math tools demo (add/multiply) for ADK
├─ sequential_workflow/       # SequentialAgent: expand → draft → improve
├─ parallel_workflow/         # ParallelAgent + synthesis; uses google_search
├─ loop_workflow/             # LoopAgent: critique/refine with escalation
└─ README.md                  # This document
```

- Each agent package defines a `root_agent` in `agent.py` so ADK can discover it.
- Parallel workflow includes the ADK built‑in `google_search` tool.

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
- `sequential_workflow`
- `parallel_workflow` (shows Search grounding behavior)
- `loop_workflow`
- `my_agent`

If you see a Windows reload error, try:
```powershell
adk web . --port 8000 --no-reload
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
