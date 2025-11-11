"""
Session Demo Agent - Day 3a Implementation

Demonstrates:
- Session state management (user preferences, context)
- State persistence with TinyDB
- Backend helper agent for returning session data
"""

import os
from typing import Dict, Any
from tinydb import TinyDB, Query
from google.adk.agents import LlmAgent
from google.adk.models.google_llm import Gemini
from google.adk.tools.tool_context import ToolContext
from google.genai import types

# Configuration
MODEL = "gemini-2.0-flash"
DB_PATH = os.path.join(os.path.dirname(__file__), "session_state.db")

# Initialize TinyDB for persistent state storage
# Delete if already exists

def delete_db_if_exists():
    try:
        if os.path.exists(DB_PATH):
            os.remove(DB_PATH)
    except Exception as e:
        return

delete_db_if_exists()
db = TinyDB(DB_PATH)
state_table = db.table('session_state')

# ============================================================
# State Management Tools
# ============================================================

def save_user_preference(
    tool_context: ToolContext,
    preference_key: str,
    preference_value: str
) -> Dict[str, Any]:
    """
    Save a user preference to session state and persistent storage.
    
    Args:
        preference_key: The key for the preference (e.g., 'favorite_color', 'name', 'country')
        preference_value: The value to store
    """
    # Save to session state (temporary)
    state_key = f"user:{preference_key}"
    tool_context.state[state_key] = preference_value
    
    # Save to TinyDB (persistent)
    UserQuery = Query()
    state_table.upsert(
        {'key': state_key, 'value': preference_value},
        UserQuery.key == state_key
    )
    
    return {
        "status": "success",
        "message": f"Saved {preference_key} = {preference_value}"
    }


def get_user_preference(
    tool_context: ToolContext,
    preference_key: str
) -> Dict[str, Any]:
    """
    Retrieve a user preference from session state or persistent storage.
    
    Args:
        preference_key: The key for the preference to retrieve
    """
    state_key = f"user:{preference_key}"
    
    # Try session state first
    value = tool_context.state.get(state_key)
    
    # Fall back to persistent storage
    if not value:
        UserQuery = Query()
        result = state_table.search(UserQuery.key == state_key)
        if result:
            value = result[0]['value']
            # Restore to session state
            tool_context.state[state_key] = value
    
    if value:
        return {
            "status": "success",
            "preference_key": preference_key,
            "value": value
        }
    else:
        return {
            "status": "not_found",
            "message": f"No preference found for {preference_key}"
        }


def list_all_preferences(tool_context: ToolContext) -> Dict[str, Any]:
    """
    List all stored user preferences.
    """
    # Get from persistent storage (State object doesn't support .items())
    all_records = state_table.all()
    all_prefs = {
        record['key'].replace('user:', ''): record['value']
        for record in all_records
        if record['key'].startswith('user:')
    }
    
    return {
        "status": "success",
        "count": len(all_prefs),
        "preferences": all_prefs
    }


# ============================================================
# Backend Helper Agent
# ============================================================

def get_backend_session_data(tool_context: ToolContext) -> str:
    """
    Backend helper tool that returns session state data in BACKEND_PROCESSES format.
    This data will be parsed by the frontend for special rendering.
    """
    # Get persistent data from TinyDB
    all_db_records = state_table.all()
    persistent_data = {record['key']: record['value'] for record in all_db_records}
    
    # Build backend data structure
    backend_data = {
        "type": "session_state",
        "persistent_state": persistent_data,
        "total_keys": len(persistent_data),
    }
    
    # Return in BACKEND_PROCESSES format (strict marker)
    import json
    return f"BACKEND_PROCESSES: {json.dumps(backend_data, indent=2)}"


# ============================================================
# Main Agent
# ============================================================

session_demo_agent = LlmAgent(
    model=Gemini(
        model=MODEL,
        generation_config=types.GenerateContentConfig(
            temperature=0.7,
            top_p=0.95,
            top_k=40,
        ),
    ),
    name="session_demo_agent",
    instruction="""You are a helpful assistant that demonstrates session state management.

    Every Time a User Starts a new session (new conversation) call delete_db_if_exists tool to reset the session state.

Your capabilities:
1. Save user preferences using save_user_preference tool
2. Retrieve preferences using get_user_preference tool
3. List all preferences using list_all_preferences tool
4. Provide backend session data using get_backend_session_data tool

When users tell you about their preferences (name, favorite color, country, hobbies, etc.),
automatically save them using the appropriate tools.

When asked about preferences, retrieve them from the session state.

If the user asks to see backend data or session state, use get_backend_session_data tool.
""",
    tools=[
        delete_db_if_exists,
        save_user_preference,
        get_user_preference,
        list_all_preferences,
        get_backend_session_data,
    ],
)

# Export as root_agent for ADK
root_agent = session_demo_agent
