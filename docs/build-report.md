# Building an AI Data Analyst Agent

_From a no-code prototype to a self-built, self-hosted AI agent — n8n, then a ground-up Python/LangGraph rewrite, deployed on Google Cloud_

_Complete technical build report · Personal project_

## Executive Summary

This project is an AI-powered data analyst that answers plain-English questions about an e-commerce database with real SQL queries against a live Postgres database. It was built twice, deliberately: first as a no-code automation workflow (n8n), to prove the concept and surface real integration challenges; then rebuilt entirely from scratch in hand-written Python — a LangGraph-orchestrated agent behind a FastAPI service — to gain genuine command of the underlying mechanics and to demonstrate the ability to build the thing itself, not just configure an existing tool.

Across both phases, fourteen distinct, real engineering problems were diagnosed and resolved: cloud networking and IPv6 routing, OAuth and API key scoping across two different LLM providers, SQL-injection-class security validation, a months-old silent data corruption bug affecting five database tables, a multi-layer environment-variable leak spanning shell configuration and an IDE, a production connection-pool failure, and a from-scratch cloud deployment on a memory- and CPU-constrained free-tier VM. Every one of these was resolved through direct investigation — reading logs, testing components in isolation, checking raw data against documented ground truth — rather than guessing or accepting a superficial fix.

## System Architecture

### Phase 1 — the n8n prototype

A webhook-triggered n8n workflow used GPT-5.1 as a conversational agent with tool-calling access to a second, independent n8n workflow, which used Claude Opus 4.5 to generate SQL from a natural-language description, validated it against a regex-based safety blocklist, executed it against a Supabase Postgres database containing the full Olist Brazilian e-commerce dataset (~100,000 orders), and logged every query and result to Google Sheets for auditability.

### Phase 2 — the Python / LangGraph rewrite

The same architecture was rebuilt as original code. A LangGraph state machine replaces the n8n canvas: explicit Python functions for deciding whether a query is needed, generating SQL, validating it, executing it, formatting the final response, and logging it, wired together with real conditional edges instead of a visual canvas. A FastAPI service exposes this graph over HTTP, authenticated with a header token, and the existing Next.js frontend was repointed at it unchanged, since both backends honor the same JSON contract. The system was deployed as a Docker container on a Google Cloud Compute Engine e2-micro instance, chosen specifically for its lighter memory footprint compared to n8n — a direct architectural response to real memory-exhaustion failures encountered while trying to run the no-code version on equivalent free-tier hardware.

## Technology Stack

| Layer | Phase 1 (n8n) | Phase 2 (Python rewrite) |
|---|---|---|
| Orchestration | n8n workflow canvas | LangGraph state graph (Python) |
| Conversational agent | GPT-5.1 via n8n LangChain node | GPT-4o via LangChain |
| SQL generation | Claude Opus 4.5 via n8n | Claude Opus 4.5 via LangChain |
| Validation | n8n Code node (regex blocklist) | Plain Python function, same logic |
| Database | Supabase (managed Postgres) | Same Supabase database |
| Audit logging | Google Sheets API | Dedicated Postgres table in the same database |
| Web / API layer | n8n Webhook + Header Auth | FastAPI + Uvicorn, header-token auth |
| Deployment | Self-hosted n8n (Docker) | Docker container on GCP Compute Engine |
| Frontend | Next.js, TypeScript, Tailwind | Same frontend, unchanged |

## The Build & Debug Journey

What follows are the real problems hit across both phases of this project, in the order they occurred. Each is presented as problem → diagnosis → resolution, because that loop — not the final working code — is the actual evidence of engineering skill, and because a hiring manager's most common interview question, “how do you debug something you've never seen before,” is best answered with real examples rather than a general claim.

### Phase 1 — Building the n8n prototype

#### Challenge 1 · Supabase connection failed with an IPv6 error

**What happened**

The first connection attempt from n8n to Supabase failed instantly with “ENETUNREACH” against an IPv6-looking address, despite correct credentials.

**How it was diagnosed**

The error's exact shape — a raw IPv6 address, and a network-unreachable failure rather than an authentication failure — pointed to a network path problem, not a credentials problem. Supabase's default “direct connection” hostname only resolves over IPv6, which most self-hosted environments have no route to.

**How it was resolved**

Switched to Supabase's IPv4-compatible “Session pooler” connection, which required a second adjustment: the pooler's username format embeds the project reference, since it is shared infrastructure serving many projects at once.

**Skill demonstrated**

Reading an error's exact shape (an IP literal, a specific errno) to narrow down which network layer is actually failing, rather than assuming every connection error means wrong credentials.

#### Challenge 2 · A password containing “@” silently broke a connection string

**What happened**

A Python script using the same database credentials failed, attempting to resolve a hostname that was actually a fragment of the password itself.

**How it was diagnosed**

Connection strings use @ as a reserved delimiter between password and host; because the real password contained @ characters, the parser split the string in the wrong place.

**How it was resolved**

URL-encoded the special characters in the password before placing it in the connection string.

**Skill demonstrated**

Recognizing that credentials embedded in a URL-formatted string must be encoded for characters with special meaning in that format — a common, easy-to-miss integration bug.

#### Challenge 3 · Google Sheets OAuth required building a full Google Cloud application from scratch

**What happened**

Connecting n8n to Google Sheets did not open a normal login popup; instead it asked for a Client ID and Client Secret with nothing to fill in.

**How it was diagnosed**

This is expected for self-hosted tools: unlike a SaaS product with a pre-registered identity, a self-hosted instance must register its own OAuth application before Google will authenticate through it.

**How it was resolved**

Registered a project in Google Cloud Console, enabled the Sheets and Drive APIs, configured the OAuth consent screen, added the account as an approved test user, and generated a Client ID/Secret pair with the exact redirect URI required — also correctly distinguishing Google's expected “unverified app” warning (safe to proceed) from a genuine “access blocked” configuration error (which needed fixing).

**Skill demonstrated**

Independently working through a multi-step cloud IAM/OAuth setup, including reading platform-specific error text closely enough to tell an expected warning apart from a real blocker.

#### Challenge 4 · An Anthropic API key was rejected with an undocumented workspace error

**What happened**

Every call to Claude failed with “anthropic-workspace-id is required when authenticating with an identity-linked API key,” and the platform's own credential-test button gave conflicting, unhelpful errors on different attempts.

**How it was diagnosed**

Rather than trust the unreliable built-in credential test, the key was verified directly against Anthropic's API using Postman — isolating the real cause: the key had been created as a personal, cross-workspace key, a type that requires explicitly declaring which workspace it acts in on every request.

**How it was resolved**

Created a new API key explicitly scoped to a single workspace at creation time, removing the need for the extra header entirely; two further issues (a URL typo, a missing required header) were caught the same way, via direct Postman testing.

**Skill demonstrated**

Not trusting a single tool's error reporting when integrating third-party APIs; building an independent test to get ground truth before interpreting a genuinely new, undocumented platform behavior.

#### Challenge 5 · A sub-workflow tool call failed until explicitly published

**What happened**

Wiring the agent's database tool to call a second workflow worked in the editor but failed for real requests, reporting the workflow “must be published before using.”

**How it was diagnosed**

n8n distinguishes between a saved draft and a published, callable version of a workflow used as a tool — saving edits does not automatically update what is actually live.

**How it was resolved**

Published the sub-workflow explicitly, and adopted the habit of re-publishing after every future edit.

**Skill demonstrated**

Recognizing platform-specific lifecycle concepts that don't match assumptions carried over from other tools.

#### Challenge 6 · A schema mismatch between the AI's prompt and the actual database

**What happened**

A machine-generated schema dump of the live database showed a table named customer (singular), while the AI's prompt — and every other table — used customers (plural).

**How it was diagnosed**

Compared the schema dump against the prompt's hardcoded description, table by table, rather than assuming they matched because the data looked right.

**How it was resolved**

Renamed the table to match the prompt, since every other table and every query example already used the plural convention.

**Skill demonstrated**

Systematically cross-checking two independently maintained sources of truth instead of assuming they agree.

#### Challenge 7 · A Google Sheets logging step broke after a routine edit

**What happened**

After a small change, the logging step began failing with a missing-sheet-ID error, then, after that was fixed, a second issue where column mappings had silently swapped.

**How it was diagnosed**

Used n8n's Execution log to trace the failure to one specific node, confirming the core SQL generation and execution had actually succeeded and only the non-critical logging step was broken.

**How it was resolved**

Rebuilt the Google Sheets node from scratch rather than continuing to patch a node with a stale internal cache of the spreadsheet's structure.

**Skill demonstrated**

Reading execution traces in a multi-node pipeline to isolate a failure to one specific component, and recognizing when a clean rebuild beats continued patching.

### Phase 2 — The Python / LangGraph Rewrite

#### Challenge 8 · A stale, unrelated API key silently overrode every .env file

**What happened**

Every call to Claude returned a 404, even though the same key succeeded seconds earlier via direct curl and Postman tests.

**How it was diagnosed**

The key actually being sent was inspected directly with echo $ANTHROPIC_API_KEY, revealing a completely different key in OpenRouter's format. A grep across shell configuration files traced it to a leftover block in .bashrc from an earlier project; a second grep, run directly against the IDE's own configuration folders, revealed the IDE itself was independently re-injecting the same stale value into every new terminal.

**How it was resolved**

Renamed the application's environment variable to something used nowhere else on the machine, and made the code itself defensive — explicitly stripping any stray base-URL override and force-setting the variable name the underlying SDK actually falls back to reading.

**Skill demonstrated**

Root-causing a bug across multiple independent layers (shell config, IDE-injected environment, library-internal fallback behavior) rather than accepting a superficial fix.

#### Challenge 9 · A schema typo carried over from the original prompt went undetected until a new question exposed it

**What happened**

A question about top product categories returned a polite explanation that a required table was missing, instead of an answer.

**How it was diagnosed**

The generated SQL was inspected directly and found syntactically correct; the prompt's schema description referred to a table name that didn't match the database's real, column-verified name — a typo that had existed since the original prompt and had simply never been exercised before.

**How it was resolved**

Confirmed the real table name against a fresh schema dump and corrected every reference across the system prompt.

**Skill demonstrated**

Treating a model's honest, non-crashing explanation of an error as a signal to fix the prompt, not evidence the model itself is broken; trusting a fresh introspection of the database over a prompt written weeks earlier.

#### Challenge 10 · A statistically implausible answer revealed silently corrupted data across five tables

**What happened**

A “top 5 categories” query returned counts in the tens, when a ~100,000-order dataset should realistically show counts in the thousands.

**How it was diagnosed**

Rather than accept a fluent answer, the table's actual row count was checked against the dataset's documented true size, revealing only about one-fifth of the expected rows. A single UNION query across all nine tables found the same partial-import problem in five of them, with no consistent cutoff — pointing to inconsistent, silent failures in the original browser-based CSV import tool rather than a fixed limit.

**How it was resolved**

Every affected table was truncated and re-imported using psql's \copy command, connecting directly to the production database over its pooled connection string — a robust, non-browser-dependent bulk-load method — and every table's row count was verified against documented real-world totals afterward.

**Skill demonstrated**

Refusing to accept a fluent, non-crashing answer as evidence of correctness; using independent domain knowledge as a check on the system's own output; auditing every related table rather than stopping at the first one found broken.

#### Challenge 11 · A new orchestration framework rejected a node for a subtle, undocumented reason

**What happened**

Adding an audit-logging step to the LangGraph state graph caused every request to fail with an internal error stating a node had not updated any state.

**How it was diagnosed**

The framework's error was read precisely rather than treated as opaque: it specifically required every node to return a state update. The new node's return value was an empty object — valid Python, but invalid under this framework's contract.

**How it was resolved**

Extended the state schema with one new field and had the logging node return a meaningful value against it.

**Skill demonstrated**

Reading framework-level error messages precisely rather than assuming a new tool is simply broken.

#### Challenge 12 · Replacing Google Sheets logging with a more production-appropriate design

**What happened**

The inherited design logged every query to Google Sheets, introducing an external API dependency, OAuth complexity, and rate limits for a system that otherwise had none.

**How it was diagnosed**

Evaluated the inherited design against the project's own already-connected, already-authenticated database, making an external logging service an unnecessary point of failure.

**How it was resolved**

Added a dedicated audit-log table directly in Postgres, written to via a fire-and-forget function that deliberately swallows its own errors so a logging failure can never break a user-facing response.

**Skill demonstrated**

Recognizing when an inherited design decision should be re-evaluated rather than carried forward automatically.

#### Challenge 13 · A brand-new default Python version broke package installation on a fresh cloud VM

**What happened**

Installing dependencies on a freshly created GCP VM failed compiling NumPy from source, first for a missing C compiler, then for missing Python development headers.

**How it was diagnosed**

Each missing tool was installed in turn rather than reaching for a workaround immediately, revealing the true root cause: the VM's very new default Python version had no pre-built installer yet for an older, exactly-pinned dependency.

**How it was resolved**

Relaxed the dependency version pins to allow newer, pre-built-compatible versions, and — more durably — moved the whole deployment into a Docker container pinned to a known-stable Python version, sidestepping the host VM's own Python version entirely.

**Skill demonstrated**

Diagnosing a build-tooling problem by reading compiler and build-system output directly; recognizing containerization as the correct structural fix rather than continuing to patch the host machine.

#### Challenge 14 · A production-realistic connection pool failure appeared hours after a clean deployment

**What happened**

After a successful deployment, the live API began returning a database-connection error, even though a brand-new, separately created connection to the same database succeeded immediately.

**How it was diagnosed**

The project's own audit log (built in Challenge 12) showed no record of the failing request, pointing to the logging path failing for the same reason as the main query path. An isolated test run directly inside the already-running container confirmed a fresh connection worked, proving the issue was specific to the application's long-lived connection pool, not the network or credentials.

**How it was resolved**

Diagnosed the pool as holding a connection the managed database's own pooler had silently closed after inactivity — a well-known behavior of production connection poolers. Rewrote the database access layer to detect exactly this class of error, discard the dead connection instead of reusing it, and automatically retry once with a fresh one, making the pool self-healing rather than requiring a manual restart.

**Skill demonstrated**

Distinguishing a fresh, unrelated success from a genuine fix for a live system's actual failing state; engineering resilience against a known production database behavior rather than treating a restart as a real solution.

## Outcome

The system was built twice by design: once to prove the concept end-to-end with no-code tooling, and once more as independently authored Python, deployed to a self-managed cloud VM as a Docker container. The rewrite surfaced and fixed a genuine, months-old data integrity defect that the original version never exposed, replaced a fragile external logging dependency with a simpler design native to the system's own database, and added real resilience against a production database failure mode most first implementations miss entirely.

## Result

A working AI data analyst, built first as a no-code prototype and then rebuilt from scratch as original, hand-written code — including its own orchestration logic, its own security validation, and its own connection resilience — with fourteen real integration and production problems independently diagnosed and resolved across both phases.

## Skills Demonstrated

- **Multi-service integration:** authenticating and connecting a workflow engine or custom backend, a managed database, two different LLM providers, and (in Phase 1) a spreadsheet API into one working pipeline.
- **Systematic debugging:** isolating which layer of a distributed system is actually at fault using independent tools (Postman, curl, execution logs, direct database queries) rather than trusting a single source's error message.
- **Cloud infrastructure literacy:** Postgres connection pooling and IPv4/IPv6 networking, OAuth application setup, API key scoping, and diagnosing build-tooling incompatibilities on a constrained cloud VM.
- **Framework fluency under real constraints:** learning LangGraph, LangChain, FastAPI, and Pydantic from first principles while faithfully porting an existing system's logic and prompts into them.
- **Data integrity auditing:** treating a fluent, non-crashing answer as insufficient evidence of correctness, and catching a real, previously undetected data corruption issue using independent, documented ground truth.
- **Production database resilience:** recognizing and engineering around a well-known connection-pooler behavior (idle connection reclamation) that most first implementations miss.
- **Prompt and context engineering:** schema grounding, few-shot examples, and explicit business rules to reduce hallucination, paired with code-level validation to make correctness failures safe rather than merely less likely.
- **Architectural judgment:** recognizing when an inherited design decision should be replaced with a simpler, more robust alternative, and choosing containerization as a durable fix for an environment mismatch rather than continuing to patch a host machine.
- **Full-stack delivery:** a typed, accessible Next.js frontend consuming a JSON contract that was implemented twice, on two different backends, without the frontend needing to change.
