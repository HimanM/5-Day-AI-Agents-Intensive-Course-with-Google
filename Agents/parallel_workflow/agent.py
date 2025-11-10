"""Parallel multi-agent workflow example using ADK with Google Search.

Pattern: Parallel fan-out (3 researchers) -> Sequential gather (synthesizer)
At least one agent uses Google Search built-in tool.

Run (from parent directory):
    adk run parallel_workflow
Web UI:
    adk web . --port 8000
Select agent: parallel_workflow
Requires: pip install google-adk (and GOOGLE_API_KEY in .env)
Note: Google Search tool requires Gemini 2.x models and you'll need to display Search suggestions in UI per policy.
"""
from google.adk.agents import ParallelAgent, SequentialAgent, LlmAgent
from google.adk.tools import google_search

MODEL = "gemini-2.0-flash"

renewables = LlmAgent(
    name="RenewableEnergyResearcher",
    model=MODEL,
    instruction=(
        "You research 'renewable energy sources'. Use Google Search tool when helpful. "
        "Return 1-2 sentence summary only."
    ),
    description="Researches renewable energy sources.",
    tools=[google_search],
    output_key="renewable_energy_result",
)

ev = LlmAgent(
    name="EVResearcher",
    model=MODEL,
    instruction=(
        "You research 'electric vehicle technology'. Use Google Search tool when helpful. "
        "Return 1-2 sentence summary only."
    ),
    description="Researches electric vehicle technology.",
    tools=[google_search],
    output_key="ev_technology_result",
)

carbon = LlmAgent(
    name="CarbonCaptureResearcher",
    model=MODEL,
    instruction=(
        "You research 'carbon capture methods'. Use Google Search tool when helpful. "
        "Return 1-2 sentence summary only."
    ),
    description="Researches carbon capture methods.",
    tools=[google_search],
    output_key="carbon_capture_result",
)

parallel_research = ParallelAgent(
    name="ParallelWebResearch",
    sub_agents=[renewables, ev, carbon],
    description="Runs three researchers concurrently; writes results into session state.",
)

synthesizer = LlmAgent(
    name="SynthesisAgent",
    model=MODEL,
    instruction="""
You will receive three summaries from state:
- Renewable: {renewable_energy_result}
- EV Tech: {ev_technology_result}
- Carbon Capture: {carbon_capture_result}

Write a cohesive, structured report with headings per topic and a brief conclusion. Do not invent facts.
Output ONLY the report text.
""",
    description="Synthesizes parallel research into a short report.",
)

root_agent = SequentialAgent(
    name="ParallelResearchAndSynthesis",
    sub_agents=[parallel_research, synthesizer],
    description="Orchestrates parallel research then synthesis.",
)
