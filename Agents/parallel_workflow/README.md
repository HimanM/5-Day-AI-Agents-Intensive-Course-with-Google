# Parallel Workflow Example (with Google Search)

Demonstrates a fan-out/fan-in pattern using `ParallelAgent` nested in a `SequentialAgent`.

Parallel sub-agents (each may call Google Search):
- `RenewableEnergyResearcher` -> `renewable_energy_result`
- `EVResearcher` -> `ev_technology_result`
- `CarbonCaptureResearcher` -> `carbon_capture_result`

Then `SynthesisAgent` combines results.

## Run
```powershell
adk run parallel_workflow
# or
adk web . --port 8000
```
Select `parallel_workflow` in UI.

## Example Prompt
"Provide latest concise summaries for renewable energy, EV tech, and carbon capture." -> runs parallel -> synthesizes.

## Google Search Notes
- Uses built-in `google_search` tool (requires Gemini 2.x model).
- You must display search suggestions & attributions in UI per grounding policy.

## Environment
Set API key in `.env` above this folder:
```powershell
Set-Content .env 'GOOGLE_API_KEY="YOUR_KEY"'
```
