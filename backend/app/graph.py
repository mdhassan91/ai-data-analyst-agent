"""
The agent as a LangGraph state machine: a port of the original n8n prototype
(see docs/build-report.md, phase 2).

Each node function does what the n8n node of the same name did:

    n8n node                      ->  function below
    -----------------------------------------------
    Data Analyst AI Agent (decide) -> decide_node
    SQL-query-Generator            -> generate_sql_node
    Query Validation               -> validate_node
    Execute SQL query              -> execute_node
    Format Response                -> respond_node / direct_respond_node

And the graph's edges at the bottom mirror the n8n connections and the
Valid? true/false branch exactly.
"""

import os
from typing import Optional, TypedDict

from langchain_anthropic import ChatAnthropic
from langchain_openai import ChatOpenAI
from langgraph.graph import StateGraph, END

from app.prompts import MAIN_AGENT_SYSTEM_PROMPT, SQL_GENERATOR_SYSTEM_PROMPT
from app.validator import validate_sql
from app.models import AgentResponse, TableData
from app import db
from pydantic import BaseModel
os.environ.pop("ANTHROPIC_BASE_URL", None)

# Force this explicitly: ChatAnthropic falls back to reading
# ANTHROPIC_API_KEY directly from the environment in some versions,
# even when api_key= is passed to the constructor. Overwriting it here
# guarantees our real key wins, no matter what else is lurking.
if "APP_ANTHROPIC_KEY" in os.environ:
    os.environ["ANTHROPIC_API_KEY"] = os.environ["APP_ANTHROPIC_KEY"]

# ---------------------------------------------------------------------------
# STATE
#
# This is the LangGraph equivalent of "the JSON flowing between n8n nodes".
# Every node function below receives the current state and returns a dict
# of fields to update - LangGraph merges that into the running state,
# the same way each n8n node's output became the next node's input.
# ---------------------------------------------------------------------------

class GraphState(TypedDict, total=False):
    user_message: str
    session_id: str
    needs_query: bool
    query_description: Optional[str]
    sql: Optional[str]
    valid: Optional[bool]
    validation_error: Optional[str]
    query_headers: Optional[list[str]]
    query_rows: Optional[list[list[str]]]
    execution_error: Optional[str]
    final_response: Optional[AgentResponse]
    logged: Optional[bool]  # LangGraph requires every node to update state (build report, challenge 11)


# ---------------------------------------------------------------------------
# MODELS
#
# Two different models for two different jobs - same "match the model to
# the task" reasoning as the n8n prototype: GPT for the conversational agent
# decision, Claude for the precise SQL-generation task.
# ---------------------------------------------------------------------------
def _main_model() -> ChatOpenAI:
    return ChatOpenAI(model="gpt-4o", temperature=0, api_key=os.environ["OPENAI_API_KEY"])


def _sql_model() -> ChatAnthropic:
    return ChatAnthropic(
        model="claude-opus-4-5-20251101",
        temperature=0,
        api_key=os.environ["APP_ANTHROPIC_KEY"],
    )


# ---------------------------------------------------------------------------
# NODE 1: decide_node
#   Equivalent to: the "Data Analyst AI Agent" node deciding whether to
#   call the database_query tool at all.
# ---------------------------------------------------------------------------
class _Decision(BaseModel):
    needs_query: bool
    query_description: Optional[str] = None


def decide_node(state: GraphState) -> dict:
    model = _main_model().with_structured_output(_Decision)

    decision: _Decision = model.invoke(
        [
            ("system", MAIN_AGENT_SYSTEM_PROMPT
                + "\n\nDecide whether this message needs a database query. "
                  "If yes, write a clear natural-language description of "
                  "exactly what data to fetch (this becomes the input to "
                  "the SQL generator, so be specific)."),
            ("human", state["user_message"]),
        ]
    )
    return {
        "needs_query": decision.needs_query,
        "query_description": decision.query_description,
    }


# ---------------------------------------------------------------------------
# NODE 2: generate_sql_node
#   Equivalent to: "SQL-query-Generator" (chainLlm + Anthropic Chat Model)
# ---------------------------------------------------------------------------
def generate_sql_node(state: GraphState) -> dict:
    model = _sql_model()

    result = model.invoke(
        [
            ("system", SQL_GENERATOR_SYSTEM_PROMPT),
            ("human", f"Natural Language Query:\n{state['query_description']}\n\nSQL Query:"),
        ]
    )
    return {"sql": result.content.strip()}


# ---------------------------------------------------------------------------
# NODE 3: validate_node
#   Equivalent to: "Query Validation" code node
# ---------------------------------------------------------------------------
def validate_node(state: GraphState) -> dict:
    result = validate_sql(state["sql"])
    return {
        "valid": result.valid,
        "sql": result.sql,
        "validation_error": result.error,
    }


# ---------------------------------------------------------------------------
# NODE 4: execute_node
#   Equivalent to: "Execute SQL query" (Postgres node) + "Format Result"
# ---------------------------------------------------------------------------
def execute_node(state: GraphState) -> dict:
    try:
        headers, rows = db.run_query(state["sql"])
        return {"query_headers": headers, "query_rows": rows, "execution_error": None}
    except Exception as exc:  # noqa: BLE001 - deliberately broad: any DB error becomes a user-facing message
        return {"query_headers": None, "query_rows": None, "execution_error": str(exc)}


# ---------------------------------------------------------------------------
# NODE 5a: respond_node
#   Equivalent to: the agent's final structured-output response, AFTER a
#   query ran (successfully or not).
# ---------------------------------------------------------------------------
def respond_node(state: GraphState) -> dict:
    model = _main_model().with_structured_output(AgentResponse)

    if state.get("validation_error"):
        context = f"The query was rejected for safety reasons: {state['validation_error']}"
    elif state.get("execution_error"):
        context = f"The query failed to execute: {state['execution_error']}"
    else:
        context = (
            f"SQL executed: {state['sql']}\n"
            f"Headers: {state['query_headers']}\n"
            f"Rows: {state['query_rows']}"
        )

    response: AgentResponse = model.invoke(
        [
            ("system", MAIN_AGENT_SYSTEM_PROMPT),
            ("human", f"User asked: {state['user_message']}\n\n{context}\n\n"
                      "Write the final response. Include `data` and, if "
                      "appropriate, `visualization`, following the response "
                      "guidelines exactly."),
        ]
    )

    # attach the sql for transparency, matching the n8n Format Response node
    if state.get("sql") and not state.get("validation_error"):
        response.sql = state["sql"]
    if state.get("query_headers") is not None:
        response.data = TableData(headers=state["query_headers"], rows=state["query_rows"])

    return {"final_response": response}


# ---------------------------------------------------------------------------
# NODE 5b: direct_respond_node
#   Equivalent to: the agent answering directly, no tool call - the
#   "Example 2: Greeting" case from the prompt.
# ---------------------------------------------------------------------------
def direct_respond_node(state: GraphState) -> dict:
    model = _main_model().with_structured_output(AgentResponse)

    response: AgentResponse = model.invoke(
        [
            ("system", MAIN_AGENT_SYSTEM_PROMPT),
            ("human", state["user_message"]),
        ]
    )
    return {"final_response": response}

def log_node(state: GraphState) -> dict:
    db.log_query(
        session_id=state["session_id"],
        user_message=state["user_message"],
        sql=state.get("sql"),
        success=not (state.get("validation_error") or state.get("execution_error")),
        error=state.get("validation_error") or state.get("execution_error"),
    )
    return {"logged": True}

# ---------------------------------------------------------------------------
# EDGES
#
# The "Valid?" IF node and the arrows of the n8n canvas, as code.
# ---------------------------------------------------------------------------
def _route_after_decide(state: GraphState) -> str:
    return "generate_sql" if state["needs_query"] else "direct_respond"


def _route_after_validate(state: GraphState) -> str:
    return "execute" if state["valid"] else "respond"


def build_graph():
    graph = StateGraph(GraphState)

    graph.add_node("decide", decide_node)
    graph.add_node("generate_sql", generate_sql_node)
    graph.add_node("validate", validate_node)
    graph.add_node("execute", execute_node)
    graph.add_node("respond", respond_node)
    graph.add_node("direct_respond", direct_respond_node)
    graph.add_node("log", log_node) 

    graph.set_entry_point("decide")

    # decide -> generate_sql OR direct_respond   (mirrors: does this need the tool?)
    graph.add_conditional_edges("decide", _route_after_decide, {
        "generate_sql": "generate_sql",
        "direct_respond": "direct_respond",
    })

    graph.add_edge("generate_sql", "validate")

    # validate -> execute OR respond   (the n8n "Valid?" branch)
    graph.add_conditional_edges("validate", _route_after_validate, {
        "execute": "execute",
        "respond": "respond",
    })

    graph.add_edge("execute", "respond")


    graph.add_edge("respond", "log")
    graph.add_edge("direct_respond", "log")
    graph.add_edge("log", END)


    return graph.compile()


# Compiled once, reused across requests - compiling is relatively expensive,
# running the compiled graph is cheap.
compiled_graph = build_graph()
