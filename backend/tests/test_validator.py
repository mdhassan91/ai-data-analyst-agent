"""The validator is the security gate: whatever the model writes, only a
single read-only query may reach the database."""

import pytest

from app.validator import validate_sql


@pytest.mark.parametrize(
    "sql",
    [
        "SELECT COUNT(*) FROM orders",
        "  select order_status, count(*) from orders group by 1  ",
        "WITH t AS (SELECT * FROM orders) SELECT COUNT(*) FROM t",
    ],
)
def test_read_only_queries_pass(sql):
    result = validate_sql(sql)
    assert result.valid
    assert result.sql == sql.strip()


@pytest.mark.parametrize(
    "sql",
    [
        "DROP TABLE orders",
        "DELETE FROM customers",
        "TRUNCATE orders",
        "UPDATE orders SET order_status = 'x'",
        "INSERT INTO orders VALUES (1)",
        "ALTER TABLE orders ADD COLUMN x int",
        "CREATE TABLE x (id int)",
        "GRANT ALL ON orders TO public",
        "REVOKE ALL ON orders FROM public",
        "SELECT 1; DROP TABLE orders",
        "SELECT 1; SELECT 2",
        "SELECT * FROM orders -- hidden",
        "SELECT * FROM orders /* hidden */",
        "select * from orders; delete from orders",
    ],
)
def test_writes_stacked_statements_and_comments_are_blocked(sql):
    result = validate_sql(sql)
    assert not result.valid
    assert "Only SELECT" in result.error


@pytest.mark.parametrize("sql", ["EXPLAIN SELECT 1", "SHOW tables", "", "copy orders to stdout"])
def test_anything_that_is_not_a_select_is_rejected(sql):
    result = validate_sql(sql)
    assert not result.valid
