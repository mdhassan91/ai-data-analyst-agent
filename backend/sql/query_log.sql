-- Audit log written by app/db.py:log_query (docs/build-report.md, challenge 14).
-- Every question, the SQL it produced, and whether it succeeded.
CREATE TABLE IF NOT EXISTS query_log (
    id            BIGSERIAL PRIMARY KEY,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
    session_id    TEXT NOT NULL,
    user_message  TEXT NOT NULL,
    sql_generated TEXT,
    success       BOOLEAN NOT NULL,
    error_message TEXT
);
