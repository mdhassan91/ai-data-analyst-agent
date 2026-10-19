"""
Ports the validation logic from the n8n 'Query Validation' code node. This is the real security layer - a deterministic, code-level gate
that doesn't care what the LLM intended, only what the query actually says.

The regex patterns are the same as in the n8n prototype, translated to
Python's `re` module.
"""

import re

from app.models import QueryValidationResult

# Same blocklist as n8n's Query Validation node
DESTRUCTIVE_PATTERNS = [
    re.compile(r"\bDROP\b", re.IGNORECASE),
    re.compile(r"\bDELETE\b", re.IGNORECASE),
    re.compile(r"\bTRUNCATE\b", re.IGNORECASE),
    re.compile(r"\bALTER\b", re.IGNORECASE),
    re.compile(r"\bUPDATE\b", re.IGNORECASE),
    re.compile(r"\bINSERT\b", re.IGNORECASE),
    re.compile(r"\bCREATE\b", re.IGNORECASE),
    re.compile(r"\bGRANT\b", re.IGNORECASE),
    re.compile(r"\bREVOKE\b", re.IGNORECASE),
    re.compile(r";.*SELECT", re.IGNORECASE),  # stacked statements
    re.compile(r"--"),  # SQL line comments
    re.compile(r"/\*"),  # SQL block comments
]


def validate_sql(raw_sql: str) -> QueryValidationResult:
    """
    Same three checks as the n8n node, in the same order:
    1. Reject anything matching the destructive-keyword blocklist
    2. Reject anything not starting with SELECT or WITH
    3. Otherwise, it's valid - return the trimmed SQL
    """
    sql = raw_sql.strip()

    for pattern in DESTRUCTIVE_PATTERNS:
        if pattern.search(sql):
            return QueryValidationResult(
                valid=False,
                sql=sql,
                error="Query contains unauthorized operations. Only SELECT queries are allowed.",
            )

    if not (sql.upper().startswith("SELECT") or sql.upper().startswith("WITH")):
        return QueryValidationResult(
            valid=False,
            sql=sql,
            error="Query must be a SELECT statement.",
        )

    return QueryValidationResult(valid=True, sql=sql)
