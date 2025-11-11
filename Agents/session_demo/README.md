# Session Demo Agent

## Overview
Demonstrates **Day 3a - Agent Sessions** concepts from the Kaggle course:
- Session state management with user preferences
- Persistent storage using TinyDB
- Backend helper agent for exposing session data

## Features

### 1. State Management Tools
- `save_user_preference(key, value)` - Save user preferences
- `get_user_preference(key)` - Retrieve saved preferences
- `list_all_preferences()` - List all stored preferences

### 2. Backend Helper Agent
- `get_backend_session_data()` - Returns session state in `BACKEND_PROCESSES:` format
- Frontend can parse this data for special rendering

### 3. Persistent Storage
- Uses TinyDB for storing state across sessions
- Database file: `session_state.db`

## Usage

### Run the agent:
```bash
cd Agents
adk run session_demo
```

### Example Interactions:

**Save preferences:**
```
User: My name is Sam and I'm from Poland. My favorite color is blue.
Agent: [Saves preferences automatically]
```

**Retrieve preferences:**
```
User: What's my name?
Agent: Your name is Sam.

User: What preferences do you know about me?
Agent: [Lists all saved preferences]
```

**Get backend data:**
```
User: Show me the session state data
Agent: [Returns BACKEND_PROCESSES block with session state]
```

## Database Schema

### Session State Table
```json
{
  "key": "user:name",
  "value": "Sam"
}
```

## Implementation Notes

- Preferences are stored with `user:` prefix for organization
- Session state is synchronized with persistent storage
- Backend data includes both in-memory and persistent state
- Frontend can parse `BACKEND_PROCESSES:` blocks for special rendering

## Related
- Kaggle Notebook: `day-3a-agent-sessions.ipynb`
- Demonstrates concepts from Day 3a of the 5-day AI Agents course
