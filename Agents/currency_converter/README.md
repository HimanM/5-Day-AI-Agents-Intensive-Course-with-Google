# Currency Converter Agent

An ADK agent that uses Google's built-in **code execution** tool to perform real-time currency conversions.

## Features

- ✅ Real-time exchange rate fetching using public APIs
- ✅ Support for 150+ currency pairs (USD, EUR, GBP, JPY, INR, etc.)
- ✅ Multi-currency conversion calculations
- ✅ Clear formatted output with currency symbols
- ✅ Error handling for invalid currency codes

## How It Works

This agent uses the `code_execution` built-in tool from Google ADK, which allows the model to:
1. Write Python code dynamically to fetch exchange rates
2. Execute calculations in a sandboxed environment
3. Return formatted results to the user

Unlike custom function tools, `code_execution` provides flexibility to handle various conversion scenarios without predefined functions.

## Run

```powershell
# From parent directory containing Agents/
adk run currency_converter

# Or web UI
adk web . --port 8000
```

Then select `currency_converter` from the agent dropdown.

## Example Prompts

```
"Convert 100 USD to EUR"
"What's the current GBP to JPY exchange rate?"
"How much is 500 Indian rupees in US dollars?"
"Convert 1000 euros to dollars and pounds"
"What's the exchange rate between Canadian dollar and Australian dollar?"
```

## API Used

The agent dynamically uses free exchange rate APIs:
- **Frankfurter.app** - Free, no auth required, up-to-date rates
- **exchangerate-api.com** - Fallback option

These are accessed via code execution, so no external dependencies needed.

## Technical Notes

- Model: `gemini-2.0-flash` (required for code execution)
- Built-in tool: `code_execution` from `google.adk.tools`
- No custom functions needed - the model writes conversion code on-demand
- Sandboxed execution environment ensures security

## Architecture Pattern

This follows the **Day 2a Kaggle notebook pattern**:
- Single agent with built-in code execution tool
- No mixing of custom functions and built-in tools
- Model autonomously writes Python code for conversions
- Real-time data access through code execution

## Environment

Set API key in `.env` (one directory above):
```powershell
Set-Content .env 'GOOGLE_API_KEY="YOUR_KEY"'
```
