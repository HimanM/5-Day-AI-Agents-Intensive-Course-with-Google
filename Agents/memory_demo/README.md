# Memory Demo Agent

## Overview
Demonstrates **Day 3b - Agent Memory** concepts from the Kaggle course:
- Long-term memory storage and retrieval
- Memory search functionality
- Persistent memory using TinyDB
- Backend helper agent for exposing memory data

## Features

### 1. Memory Management Tools
- `save_memory(key, content, category)` - Save memories to long-term storage
- `search_memories(query, category)` - Search memories by content
- `get_memory_by_key(key)` - Retrieve specific memory
- `list_all_memories(category)` - List all stored memories
- `delete_memory(key)` - Remove a memory

### 2. Backend Helper Agent
- `get_backend_memory_data()` - Returns memory store in `BACKEND_PROCESSES:` format
- Includes statistics, categories, and recent memories

### 3. Memory Categories
- **personal**: Birthdays, names, personal details
- **preferences**: Favorite things, likes/dislikes
- **facts**: General knowledge, learned information
- **goals**: User goals, aspirations

## Usage

### Run the agent:
```bash
cd Agents
adk run memory_demo
```

### Example Interactions:

**Save memories:**
```
User: My birthday is March 15th
Agent: [Saves to memory with key 'birthday', category 'personal']

User: I love playing guitar
Agent: [Saves to memory with key 'hobby_guitar', category 'preferences']
```

**Search memories:**
```
User: What do you remember about my hobbies?
Agent: [Searches memories for 'hobby' or 'guitar']
```

**Get backend data:**
```
User: Show me all my memories
Agent: [Returns BACKEND_PROCESSES block with all memories organized by category]
```

## Database Schema

### Memory Table
```json
{
  "key": "birthday",
  "content": "User's birthday is March 15th",
  "category": "personal",
  "timestamp": "2025-11-12T10:30:00",
  "user_id": "default_user"
}
```

## Memory vs Session State

| Feature | Session State | Memory |
|---------|--------------|--------|
| **Duration** | Single conversation | Across conversations |
| **Storage** | Temporary + DB | Persistent DB |
| **Purpose** | Current context | Long-term knowledge |
| **Example** | "User just asked about weather" | "User is allergic to peanuts" |

## Backend Data Structure

The `get_backend_memory_data()` tool returns:
```json
{
  "type": "memory_store",
  "total_memories": 5,
  "categories": ["personal", "preferences", "facts"],
  "memories_by_category": { ... },
  "recent_memories": [ ... ]
}
```

## Implementation Notes

- Each memory has a unique key, content, category, and timestamp
- Search is currently keyword-based (simple matching)
- Frontend can parse `BACKEND_PROCESSES:` blocks to show memory inspector UI
- Backend data is sanitized (content truncated to 100 chars for overview)

## Related
- Kaggle Notebook: `day-3b-agent-memory.ipynb`
- Demonstrates concepts from Day 3b of the 5-day AI Agents course
