"""
FastAPI entry point. How it maps to the n8n prototype:

  n8n Webhook node (with Header Auth)  -> the auth check below
  n8n's "Data Analyst AI Agent" chain  -> compiled_graph.invoke(...)
  n8n's "Respond" node                 -> FastAPI returning the response
"""

import os
from contextlib import asynccontextmanager

from dotenv import load_dotenv
from fastapi import FastAPI, Header, HTTPException

load_dotenv()

from app import db  # noqa: E402 - must come after load_dotenv()
from app.graph import compiled_graph  # noqa: E402
from app.models import AgentResponse, ChatRequest  # noqa: E402
from fastapi.middleware.cors import CORSMiddleware


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Runs once when the server starts - equivalent to n8n's credential
    # setup happening once, not per-request.
    db.init_pool()
    yield
    db.close_pool()


app = FastAPI(lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[os.environ.get("FRONTEND_URL", "http://localhost:3000")],  # the Next.js frontend
    allow_methods=["POST"],
    allow_headers=["Content-Type", "X-API-Key"],
)


@app.get("/health")
def health():
    """Standard practice: a route to check the service is actually up."""
    return {"status": "ok"}


@app.post("/chat", response_model=AgentResponse)
async def chat(request: ChatRequest, x_api_key: str = Header(default=None)):
    # Same job as n8n's Header Auth on the Webhook node.
    expected_token = os.environ.get("API_AUTH_TOKEN")
    if expected_token and x_api_key != expected_token:
        raise HTTPException(status_code=401, detail="Invalid or missing API key")

    result = compiled_graph.invoke(
        {"user_message": request.message, "session_id": request.session_id}
    )
    return result["final_response"]
