"""
Connection pooling: instead of opening a brand new Postgres connection
for every single request (slow, and can exhaust Supabase's connection
limit under load), we open a small pool of connections once when the
app starts, and reuse them across requests. The pool is kept small
on purpose: the API runs on a small VM.
"""

import os
from contextlib import contextmanager

import psycopg2
from psycopg2 import pool
from psycopg2.extras import RealDictCursor

_pool: pool.SimpleConnectionPool | None = None


def init_pool():
    """Call this once, when the FastAPI app starts up."""
    global _pool
    database_url = os.environ["DATABASE_URL"]
    # minconn=1, maxconn=5 is plenty for a small app on a small VM -
    # each open connection costs memory, so we deliberately keep this low.
    _pool = pool.SimpleConnectionPool(minconn=1, maxconn=5, dsn=database_url)


def close_pool():
    """Call this once, when the FastAPI app shuts down."""
    if _pool:
        _pool.closeall()


# The managed database's pooler (Supabase) closes connections that sit idle.
# The app's pool doesn't notice, so the next request gets a dead connection
# (build report, challenge 14). These errors mean "this connection is gone",
# not "the query is wrong" - discard the connection and try once more.
DEAD_CONNECTION_ERRORS = (psycopg2.OperationalError, psycopg2.InterfaceError)


@contextmanager
def _connection():
    """Lends a pooled connection. A dead one is closed and dropped from the pool."""
    conn = _pool.getconn()
    try:
        yield conn
    except DEAD_CONNECTION_ERRORS:
        _pool.putconn(conn, close=True)
        raise
    except BaseException:
        _pool.putconn(conn)
        raise
    else:
        _pool.putconn(conn)


def _with_retry(work):
    """Runs ``work(conn)``; on a dead connection, once more with a fresh one."""
    try:
        with _connection() as conn:
            return work(conn)
    except DEAD_CONNECTION_ERRORS:
        with _connection() as conn:
            return work(conn)


def run_query(sql: str) -> tuple[list[str], list[list[str]]]:
    """
    Executes a validated, read-only SQL query and returns
    (headers, rows) - the same shape the n8n 'Format Result' node built.

    Any exception here (a genuinely malformed query, a missing table,
    etc.) is allowed to propagate up - the caller decides how to turn
    that into a user-facing error message.
    """
    if _pool is None:
        raise RuntimeError("Database pool not initialized - call init_pool() on startup")

    def fetch(conn):
        try:
            with conn.cursor(cursor_factory=RealDictCursor) as cur:
                cur.execute(sql)
                rows = cur.fetchall()
        except DEAD_CONNECTION_ERRORS:
            raise
        except Exception:
            conn.rollback()  # a failed query leaves the transaction aborted
            raise
        conn.rollback()  # read-only: never leave a transaction open in the pool
        return rows

    rows = _with_retry(fetch)

    if not rows:
        return [], []

    headers = list(rows[0].keys())
    row_values = [[str(row[h]) for h in headers] for row in rows]
    return headers, row_values


def log_query(session_id: str, user_message: str, sql: str | None, success: bool, error: str | None):
    """
    Fire-and-forget audit logging. Deliberately swallows its own errors -
    a logging failure should never break the actual user-facing response.
    """
    if _pool is None:
        return

    def insert(conn):
        with conn.cursor() as cur:
            cur.execute(
                "INSERT INTO query_log (session_id, user_message, sql_generated, success, error_message) "
                "VALUES (%s, %s, %s, %s, %s)",
                (session_id, user_message, sql, success, error),
            )
        conn.commit()

    try:
        _with_retry(insert)
    except Exception:
        pass  # logging is best-effort, never let it break the real response
