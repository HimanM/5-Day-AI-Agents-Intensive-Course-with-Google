"""Currency Converter Agent using ADK Code Execution.

This agent uses Google's built-in code execution tool to perform currency conversions
by executing Python code that fetches real-time exchange rates and calculates conversions.

Features:
- Real-time exchange rate fetching via code execution
- Support for multiple currency pairs
- Historical rate queries
- Currency information lookup

Run:
    adk run currency_converter
Web UI:
    adk web . --port 8000
    
Select agent: currency_converter
Requires: google-adk installed & API key
"""
from typing import Dict
from google.genai import types

from google.adk.agents import LlmAgent
from google.adk.runners import InMemoryRunner
from google.adk.sessions import InMemorySessionService
from google.adk.tools import google_search, AgentTool, ToolContext
from google.adk.code_executors import BuiltInCodeExecutor
from google.adk.models.google_llm import Gemini

MODEL = "gemini-2.0-flash"

retry_config=types.HttpRetryOptions(
    attempts=5,  # Maximum retry attempts
    exp_base=7,  # Delay multiplier
    initial_delay=1,
    http_status_codes=[429, 500, 503, 504] # Retry on these HTTP errors
)


currency_agent = LlmAgent(
    name="currency_fetcher_agent",
    model=Gemini(
        model="gemini-2.5-flash-lite",
        retry_options=retry_config
    ),
    instruction="""You are a helpful currency conversion assistant. You utilize google_search 
    fucntion to get uptodate currency exchange rates
    return the base currency, target currency, exchange rates and return those values in a json format""",
    tools=[google_search],
    description="Currency result fetch using google search for real-time exchange rates and calculations.",

)
calculation_agent = LlmAgent(
      name="CalculationAgent",
      model=Gemini(
        model="gemini-2.5-flash-lite",
        retry_options=retry_config
      ),
      instruction="""You are a specialized calculator that ONLY responds with Python code. You are forbidden from providing any text, explanations, or conversational responses.
 
     Your task is to take a request for a calculation and translate it into a single block of Python code that calculates the answer.
     
     **RULES:**
    1.  Your output MUST be ONLY a Python code block.
    2.  Do NOT write any text before or after the code block.
    3.  The Python code MUST calculate the result.
    4.  The Python code MUST print the final result to stdout.
    5.  You are PROHIBITED from performing the calculation yourself. Your only job is to generate the code that will perform the calculation.
   
    Failure to follow these rules will result in an error.
       """,
        code_executor=BuiltInCodeExecutor(),  # Use the built-in Code Executor Tool. This gives the agent code execution capabilities
    )

root_agent = LlmAgent(
    name="currency_converter_agent",
    model=Gemini(
        model="gemini-2.5-flash-lite",
        retry_options=retry_config
    ),
    instruction="""You are a helpful currency conversion assistant. You can:

1. Convert amounts between different currencies using real-time exchange rates
2. Provide current exchange rates for currency pairs
3. Calculate multi-currency conversions

use the currency_fetcher_agent to get exchange rates and convert currencies returned from it using
the calculation_agent tool to generate Python code that calculates the final converted amount.
""",
    tools=[
        AgentTool(agent=currency_agent)
        ,AgentTool(agent=calculation_agent)],
)

