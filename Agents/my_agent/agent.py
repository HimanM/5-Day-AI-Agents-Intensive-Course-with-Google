"""Example ADK agent integrating existing add/multiply tools.

How to run:
- CLI (from parent directory that contains the 'my_agent' folder):
        adk run my_agent
- Web UI (from parent directory):
        adk web . --port 8000
    Then open http://127.0.0.1:8000/dev-ui/?app=my_agent
"""
import os
from typing import Dict
from google.adk.agents.llm_agent import Agent

# Tool implementations (simple math) matching your earlier script

def add_numbers(a: float, b: float) -> Dict[str, float]:
    """Returns the sum of two numbers."""
    return {"result": a + b}


def multiply_numbers(a: float, b: float) -> Dict[str, float]:
    """Returns the product of two numbers."""
    return {"result": a * b}

# Root agent definition. ADK automatically exposes tools when listed.
root_agent = Agent(
    model="gemini-2.0-flash",  # You can switch to gemini-2.5-flash when available
    name="math_chat_agent",
    description="Conversational agent that can chat and do basic math using tools.",
    instruction=(
        "You are a friendly assistant. For math operations use the provided tools: "
        "add_numbers and multiply_numbers. Keep responses concise unless asked to expand."
    ),
    tools=[add_numbers, multiply_numbers],
)
