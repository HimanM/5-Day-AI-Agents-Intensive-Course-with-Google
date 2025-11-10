# Sequential Workflow Example

Demonstrates a simple three-step deterministic pipeline using ADK `SequentialAgent`.

Steps:
1. `TopicExpander` expands a user topic into bullet points (state key: `expanded_points`).
2. `ResearchDraft` generates a paragraph from those points (state key: `draft`).
3. `CritiqueImprove` improves the paragraph (state key: `improved`).

## Run
```powershell
# From parent directory containing sequential_workflow/
adk run sequential_workflow
# or web UI
adk web . --port 8000
```
Select `sequential_workflow` in the UI.

## Prompt Example
"Explain impacts of solar adoption in cities." -> pipeline expands -> drafts -> improves.

## Notes
- Model: `gemini-2.0-flash`
- Provide `GOOGLE_API_KEY` in a `.env` one directory above.
