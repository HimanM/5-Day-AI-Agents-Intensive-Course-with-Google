# Loop Workflow Example

Demonstrates iterative refinement with `LoopAgent`.

Sequence:
1. `InitialWriter` creates initial draft (`current_doc`).
2. Loop runs:
   - `CriticAgent` sets `critique` or completion phrase.
   - `RefinerAgent` refines or escalates to stop.

Stops when `critique` == "No major issues found." or after 5 iterations.

## Run
```powershell
adk run loop_workflow
# or UI
adk web . --port 8000
```
Select `loop_workflow`.

## Prompt Example
"Topic: Benefits of urban green roofs" triggers drafting then iterative refinement.

## Notes
- Demonstrates custom BaseAgent for termination handling.
- No external tools; pure state-based refinement.
