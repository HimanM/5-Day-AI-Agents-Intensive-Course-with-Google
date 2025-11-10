"""Simple FastAPI CORS proxy to forward requests to ADK API server avoiding browser CORS issues.

Usage:
  1. Start ADK API server (example):
       adk api_server . --port 8080
  2. Start this proxy:
       python cors_proxy.py
  3. Point frontend 'Server' field to: http://127.0.0.1:8090/api

The proxy forwards /api/* to http://127.0.0.1:8080/* and sets permissive CORS headers.
"""
from fastapi import FastAPI, Request, Response
from fastapi.middleware.cors import CORSMiddleware
import httpx
import uvicorn

TARGET = "http://127.0.0.1:8080"
PREFIX = "/api"

app = FastAPI(title="ADK CORS Proxy")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*",],
    allow_headers=["*"],
)

async def forward(request: Request) -> Response:
    path = request.url.path[len(PREFIX):] or "/"
    url = TARGET + path
    params = request.query_params.multi_items()
    headers = {k: v for k, v in request.headers.items() if k.lower() not in {"host", "origin", "referer"}}
    method = request.method.upper()
    body = await request.body()
    async with httpx.AsyncClient(timeout=60.0) as client:
        resp = await client.request(method, url, params=params, headers=headers, content=body)
    proxy_headers = {"content-type": resp.headers.get("content-type", "application/json")}
    return Response(content=resp.content, status_code=resp.status_code, headers=proxy_headers)

@app.api_route(f"{PREFIX}/{{full_path:path}}", methods=["GET","POST","DELETE","PUT","PATCH","OPTIONS"])
async def proxy_all(full_path: str, request: Request):
    return await forward(request)

@app.get("/")
async def root():
    return {"status": "ok", "target": TARGET}

if __name__ == "__main__":
    uvicorn.run(app, host="127.0.0.1", port=8090)
