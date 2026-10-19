"""
Pydantic models define the *shape* of data flowing through the app, and
validate it automatically at runtime - the same job the n8n Structured
Output Parser node did, but as actual Python classes instead of a JSON
Schema blob pasted into a node.
"""

from typing import Literal, Optional
from pydantic import BaseModel, Field


class ChatRequest(BaseModel):
    """What the frontend sends us. Same shape as the n8n webhook input."""
    message: str
    session_id: str


class TableData(BaseModel):
    """A result table: column headers + rows of values."""
    headers: list[str]
    rows: list[list[str]]


class Visualization(BaseModel):
    """Chart data, matching exactly what the Next.js frontend expects."""
    type: Literal["bar", "line", "pie"]
    labels: list[str]
    values: list[float]
    x_label: Optional[str] = None
    y_label: Optional[str] = None


class AgentResponse(BaseModel):
    """
    The final shape returned to the frontend. This is the Python
    equivalent of the JSON Schema in the n8n Structured
    Output Parser node - Claude/GPT will be asked to produce exactly
    this shape, and Pydantic validates it actually did.
    """
    response: str = Field(description="Natural language answer, 2-4 sentences, conversational")
    data: Optional[TableData] = None
    visualization: Optional[Visualization] = None
    sql: Optional[str] = None


class QueryValidationResult(BaseModel):
    """Internal result from the SQL validator - not sent to the frontend."""
    valid: bool
    sql: str
    error: Optional[str] = None
