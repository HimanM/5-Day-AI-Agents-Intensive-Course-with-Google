"""Sequential multi-agent workflow example using ADK.

Pipeline stages:
1. TopicExpander: expands a user topic into sub-points (state['expanded_points']).
2. ResearchDraft: drafts a paragraph based on expanded points (state['draft']).
3. CritiqueImprove: reviews draft and improves it (state['improved']).

Run (from parent directory):
    adk run sequential_workflow
Web UI:
    adk web . --port 8000
Select agent: sequential_workflow
Requires: pip install google-adk (and GOOGLE_API_KEY in .env)
"""
from google.adk.agents import SequentialAgent, LlmAgent

MODEL = "gemini-2.0-flash"

# Step 1: expand topic
expand_agent = LlmAgent(
    name="TopicExpander",
    model=MODEL,
    instruction="""You expand a short user topic into 3-5 concise bullet points capturing key aspects.
Output ONLY the bullet points (no intro).""",
    description="Expands topic into key points.",
    output_key="expanded_points",
)

# Step 2: draft based on expansion
draft_agent = LlmAgent(
    name="ResearchDraft",
    model=MODEL,
    instruction="""Write a cohesive paragraph synthesizing the points: {expanded_points}.
Do not list bullets; integrate them naturally. Output ONLY the paragraph.""",
    description="Generates draft paragraph from expanded points.",
    output_key="draft",
)

# Step 3: critique & improve
improve_agent = LlmAgent(
    name="CritiqueImprove",
    model=MODEL,
    instruction="""You are a writing quality improver. Read draft: {draft}
Provide an improved version focusing on clarity & concision. If already excellent, return it unchanged.
Output ONLY improved paragraph.""",
    description="Improves draft quality.",
    output_key="improved",
)

root_agent = SequentialAgent(
    name="SequentialResearchPipeline",
    sub_agents=[expand_agent, draft_agent, improve_agent],
    description="Sequential pipeline: expand -> draft -> improve.",
)
