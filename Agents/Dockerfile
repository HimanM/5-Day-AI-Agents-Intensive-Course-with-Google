# Dockerfile for ADK Agents Backend
FROM python:3.11-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    gcc \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Copy agent folders
COPY my_agent ./my_agent
COPY sequential_workflow ./sequential_workflow
COPY parallel_workflow ./parallel_workflow
COPY loop_workflow ./loop_workflow

# Copy .env file if it exists
COPY .env* ./

# Install Google ADK and dependencies
RUN pip install --no-cache-dir google-adk

# Expose ADK API port
EXPOSE 8080

# Run the ADK API server
CMD ["adk", "api_server", ".", "--port", "8080", "--host", "0.0.0.0"]
