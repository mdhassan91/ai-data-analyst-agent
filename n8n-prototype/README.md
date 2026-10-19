# Phase 1 — the n8n prototype

The first version of the agent, built in [n8n](https://n8n.io) to prove the idea end to end before
writing any backend code. These are the two workflows, exported from n8n (credentials removed).

| Workflow | What it does |
|---|---|
| [`data-analyst-agent.json`](data-analyst-agent.json) | Webhook with header auth → **AI agent** (GPT-5.1) with Postgres chat memory per session → calls the `database_query` tool when a question needs data → structured output parser → formats and returns the response. |
| [`sql-query-tool.json`](sql-query-tool.json) | The tool, as its own workflow: **Claude Opus 4.5** writes SQL from a description → **Query Validation** code node (read-only blocklist) → `Valid?` → executes on Supabase Postgres → formats the result → appends the query to a Google Sheet as an audit log. |

To try them: import both into n8n, create the credentials (OpenAI, Anthropic, Postgres, Header
Auth, Google Sheets), point the agent's `database_query` tool at the imported tool workflow and
set your own sheet URL in *Append row in sheet*.

## From n8n nodes to Python

The Python backend ([`../backend`](../backend)) keeps the same architecture and prompts; each
node became a function in [`graph.py`](../backend/app/graph.py):

| n8n node | Python |
|---|---|
| Webhook + Header Auth | `POST /chat` with an `X-API-Key` check ([`main.py`](../backend/app/main.py)) |
| Data Analyst AI Agent (tool decision) | `decide_node` |
| SQL-query-Generator (Claude) | `generate_sql_node` |
| Query Validation (code node) | `validate_sql` ([`validator.py`](../backend/app/validator.py)) — same regex patterns |
| Valid? | conditional edge `_route_after_validate` |
| Execute SQL query + Format Result | `execute_node` + `db.run_query` ([`db.py`](../backend/app/db.py)) |
| Structured Output Parser + Format Response | `respond_node` with a Pydantic `AgentResponse` ([`models.py`](../backend/app/models.py)) |
| Append row in sheet (Google Sheets) | `log_node` → `query_log` table in Postgres |
| Supabase Chat Memory | not ported yet (see the main README) |

## Why I rewrote it in Python

- **To own the mechanics, not just configure them.** In n8n the agent loop, tool calling and
  output parsing are built-in nodes. Rewriting them as a LangGraph state machine meant
  understanding and controlling every step.
- **To run it on a small server.** Self-hosted n8n ran out of memory on free-tier hardware;
  the FastAPI service fits in a Docker container on a GCP e2-micro VM.
- **To drop a fragile dependency.** Logging to Google Sheets meant an extra API, OAuth setup
  and rate limits. The rewrite logs to a table in the database it already uses.
- **To make it testable and reviewable.** Code can be unit-tested and diffed: the validator,
  the connection pool and the API contract now have tests ([`../backend/tests`](../backend/tests)).

The rewrite also exposed problems the prototype never did: a schema typo in the prompt and
silent partial imports in 5 of the 9 tables (see [the build report](../docs/build-report.md),
challenges 9 and 10).

The frontend ([`../frontend`](../frontend)) worked with both versions unchanged, because both
honour the same JSON contract.
