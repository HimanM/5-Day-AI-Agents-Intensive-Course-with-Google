"""
Memory Demo Agent - Day 3b Implementation

Demonstrates:
- Long-term memory storage using TinyDB
- Memory search and retrieval
- Backend helper agent for returning memory data
"""

import os
import json
from typing import Dict, Any, List, Optional
from datetime import datetime
from tinydb import TinyDB, Query
from google.adk.agents import LlmAgent
from google.adk.models.google_llm import Gemini
from google.adk.tools.tool_context import ToolContext
from google.genai import types

# Configuration
MODEL = "gemini-2.0-flash"
DB_PATH = os.path.join(os.path.dirname(__file__), "memory_store.db")

# Initialize TinyDB for memory storage
db = TinyDB(DB_PATH)
memory_table = db.table('memories')

# ============================================================
# Memory Management Tools
# ============================================================

def save_memory(
    tool_context: ToolContext,
    memory_key: str,
    memory_content: str,
    category: str = "general"
) -> Dict[str, Any]:
    """
    Save a memory to long-term storage.
    
    Args:
        memory_key: Unique identifier for the memory (e.g., 'birthday', 'favorite_food')
        memory_content: The actual memory content
        category: Category for organizing memories (e.g., 'personal', 'preferences', 'facts')
    """
    memory_record = {
        'key': memory_key,
        'content': memory_content,
        'category': category,
        'timestamp': datetime.now().isoformat(),
        'user_id': tool_context.state.get('user_id', 'default_user')
    }
    
    MemQuery = Query()
    memory_table.upsert(memory_record, MemQuery.key == memory_key)
    
    return {
        "status": "success",
        "message": f"Memory '{memory_key}' saved successfully",
        "memory": memory_record
    }


def search_memories(
    tool_context: ToolContext,
    query: str,
    category: Optional[str] = None
) -> Dict[str, Any]:
    """
    Search for memories containing the query string.
    
    Args:
        query: Search query string
        category: Optional category filter
    """
    MemQuery = Query()
    
    # Build search condition
    if category:
        results = memory_table.search(
            (MemQuery.content.search(query, flags=0)) & (MemQuery.category == category)
        )
    else:
        results = memory_table.search(MemQuery.content.search(query, flags=0))
    
    return {
        "status": "success",
        "query": query,
        "count": len(results),
        "memories": results
    }


def get_memory_by_key(
    tool_context: ToolContext,
    memory_key: str
) -> Dict[str, Any]:
    """
    Retrieve a specific memory by its key.
    
    Args:
        memory_key: The unique key of the memory to retrieve
    """
    MemQuery = Query()
    result = memory_table.search(MemQuery.key == memory_key)
    
    if result:
        return {
            "status": "success",
            "memory": result[0]
        }
    else:
        return {
            "status": "not_found",
            "message": f"No memory found with key '{memory_key}'"
        }


def list_all_memories(
    tool_context: ToolContext,
    category: Optional[str] = None
) -> Dict[str, Any]:
    """
    List all stored memories, optionally filtered by category.
    
    Args:
        category: Optional category filter
    """
    if category:
        MemQuery = Query()
        results = memory_table.search(MemQuery.category == category)
    else:
        results = memory_table.all()
    
    # Group by category
    by_category = {}
    for mem in results:
        cat = mem.get('category', 'general')
        if cat not in by_category:
            by_category[cat] = []
        by_category[cat].append(mem)
    
    return {
        "status": "success",
        "total_count": len(results),
        "categories": list(by_category.keys()),
        "memories_by_category": by_category
    }


def delete_memory(
    tool_context: ToolContext,
    memory_key: str
) -> Dict[str, Any]:
    """
    Delete a memory by its key.
    
    Args:
        memory_key: The key of the memory to delete
    """
    MemQuery = Query()
    removed = memory_table.remove(MemQuery.key == memory_key)
    
    if removed:
        return {
            "status": "success",
            "message": f"Memory '{memory_key}' deleted successfully"
        }
    else:
        return {
            "status": "not_found",
            "message": f"No memory found with key '{memory_key}'"
        }


# ============================================================
# Backend Helper Agent
# ============================================================

def get_backend_memory_data(tool_context: ToolContext) -> str:
    """
    Backend helper tool that returns memory data in BACKEND_PROCESSES format.
    This data will be parsed by the frontend for special rendering.
    """
    # Get all memories
    all_memories = memory_table.all()
    
    # Group by category
    by_category = {}
    for mem in all_memories:
        cat = mem.get('category', 'general')
        if cat not in by_category:
            by_category[cat] = []
        by_category[cat].append({
            'key': mem['key'],
            'content': mem['content'],
            'timestamp': mem['timestamp']
        })
    
    # Get statistics
    total_count = len(all_memories)
    categories = list(by_category.keys())
    
    # Recent memories (last 5)
    recent = sorted(all_memories, key=lambda x: x['timestamp'], reverse=True)[:5]
    
    # Build backend data structure
    backend_data = {
        "type": "memory_store",
        "total_memories": total_count,
        "categories": categories,
        "memories_by_category": by_category,
        "recent_memories": [
            {
                'key': m['key'],
                'content': m['content'][:100] + '...' if len(m['content']) > 100 else m['content'],
                'category': m['category'],
                'timestamp': m['timestamp']
            }
            for m in recent
        ]
    }
    
    # Return in BACKEND_PROCESSES format (strict marker)
    return f"BACKEND_PROCESSES: {json.dumps(backend_data, indent=2)}"


# ============================================================
# Main Agent
# ============================================================

memory_demo_agent = LlmAgent(
    model=Gemini(
        model=MODEL,
        generation_config=types.GenerateContentConfig(
            temperature=0.7,
            top_p=0.95,
            top_k=40,
        ),
    ),
    name="memory_demo_agent",
    instruction="""You are a helpful assistant that demonstrates long-term memory management.

Your capabilities:
1. Save memories using save_memory tool - use meaningful keys like 'birthday', 'favorite_color', 'hobby_guitar'
2. Search memories using search_memories tool - find memories by content
3. Retrieve specific memories using get_memory_by_key tool
4. List all memories using list_all_memories tool
5. Delete memories using delete_memory tool
6. Provide backend memory data using get_backend_memory_data tool

When users share information that should be remembered long-term (birthdays, preferences, facts),
automatically save them as memories with descriptive keys and appropriate categories.

Categories to use:
- 'personal': birthdays, names, personal details
- 'preferences': favorite things, likes/dislikes
- 'facts': general knowledge, learned information
- 'goals': user goals, aspirations

When asked about past information, search memories to retrieve it.

If the user asks to see backend data or memory store, use get_backend_memory_data tool.
""",
    tools=[
        save_memory,
        search_memories,
        get_memory_by_key,
        list_all_memories,
        delete_memory,
        get_backend_memory_data,
    ],
)

# Export as root_agent for ADK
root_agent = memory_demo_agent
