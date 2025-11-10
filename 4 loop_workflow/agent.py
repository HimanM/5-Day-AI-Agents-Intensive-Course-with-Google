"""Loop multi-agent workflow example using ADK.

Pattern: Initial draft -> Loop (critic, refiner) until quality phrase or max iterations.
Termination: custom exit tool escalates loop when critique indicates completion.

Run:
    adk run loop_workflow
Web UI:
    adk web . --port 8000
Select agent: loop_workflow
Requires: google-adk installed & API key.
"""
from typing import AsyncGenerator
from google.adk.agents import LoopAgent, SequentialAgent, LlmAgent, BaseAgent
from google.adk.events import Event, EventActions
from google.adk.agents.invocation_context import InvocationContext

MODEL = "gemini-2.0-flash"
COMPLETION_PHRASE = "No major issues found."

initial_writer = LlmAgent(
    name="InitialWriter",
    model=MODEL,
    instruction="""Write a concise (2-3 sentence) overview about the user topic. Store text only.""",
    description="Generates initial draft.",
    output_key="current_doc",
)

critic = LlmAgent(
    name="CriticAgent",
    model=MODEL,
    instruction=f"""Assess the document for clarity and quality. If satisfactory respond EXACTLY with '{COMPLETION_PHRASE}'. Otherwise provide 1-2 bullet improvements only.""",
    description="Critiques current draft, may signal completion.",
    output_key="critique",
)

class RefinerOrExit(BaseAgent):
    name: str = "RefinerAgent"
    description: str = "Refines based on critique or escalates loop if complete."

    async def _run_async_impl(self, ctx: InvocationContext) -> AsyncGenerator[Event, None]:
        critique = ctx.session.state.get("critique", "")
        current = ctx.session.state.get("current_doc", "")
        if critique.strip() == COMPLETION_PHRASE:
            # escalate to stop loop
            yield Event(author=self.name, actions=EventActions(escalate=True))
        else:
            # produce refined text (LLM-like transformation can be delegated to an LlmAgent; here we emulate inline)
            improved = f"REFINED VERSION (apply suggestions):\nOriginal: {current}\nCritique: {critique}"
            ctx.session.state["current_doc"] = improved
            yield Event(author=self.name, actions=EventActions())

refiner_exit = RefinerOrExit()

refinement_loop = LoopAgent(
    name="RefinementLoop",
    sub_agents=[critic, refiner_exit],  # order: critique then refine/exit
    max_iterations=5,
    description="Iteratively critiques and refines until completion or limit.",
)

root_agent = SequentialAgent(
    name="DocumentRefinementPipeline",
    sub_agents=[initial_writer, refinement_loop],
    description="Initial draft then iterative refinement loop.",
)
