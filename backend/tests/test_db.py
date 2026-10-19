"""The pool must survive connections the database's pooler closed while idle
(build report, challenge 14): discard the dead one, retry once with a fresh one."""

import psycopg2
import pytest

from app import db


class FakeCursor:
    def __init__(self, conn):
        self.conn = conn

    def __enter__(self):
        return self

    def __exit__(self, *exc):
        return False

    def execute(self, sql, params=None):
        if self.conn.dead:
            raise psycopg2.OperationalError("SSL connection has been closed unexpectedly")
        self.conn.executed.append((sql, params))

    def fetchall(self):
        return [{"order_status": "delivered", "count": 96478}]


class FakeConn:
    def __init__(self, dead=False):
        self.dead = dead
        self.executed = []
        self.committed = False

    def cursor(self, cursor_factory=None):
        return FakeCursor(self)

    def rollback(self):
        if self.dead:
            raise psycopg2.InterfaceError("connection already closed")

    def commit(self):
        self.committed = True


class FakePool:
    """Hands out the given connections in order, records how each came back."""

    def __init__(self, *conns):
        self.waiting = list(conns)
        self.returned = []

    def getconn(self):
        return self.waiting.pop(0)

    def putconn(self, conn, close=False):
        self.returned.append((conn, close))


@pytest.fixture
def pool(monkeypatch):
    def install(*conns):
        fake = FakePool(*conns)
        monkeypatch.setattr(db, "_pool", fake)
        return fake

    return install


def test_query_returns_headers_and_rows(pool):
    conn = FakeConn()
    fake = pool(conn)
    assert db.run_query("SELECT ...") == (["order_status", "count"], [["delivered", "96478"]])
    assert fake.returned == [(conn, False)]


def test_dead_connection_is_discarded_and_query_retried(pool):
    dead, fresh = FakeConn(dead=True), FakeConn()
    fake = pool(dead, fresh)
    headers, rows = db.run_query("SELECT ...")
    assert rows == [["delivered", "96478"]]
    assert fake.returned == [(dead, True), (fresh, False)]


def test_retries_only_once(pool):
    pool(FakeConn(dead=True), FakeConn(dead=True))
    with pytest.raises(psycopg2.OperationalError):
        db.run_query("SELECT ...")


def test_a_bad_query_is_not_retried(pool, monkeypatch):
    conn = FakeConn()
    fake = pool(conn)
    monkeypatch.setattr(FakeCursor, "execute", lambda self, sql, params=None: 1 / 0)
    with pytest.raises(ZeroDivisionError):
        db.run_query("SELECT ...")
    assert fake.returned == [(conn, False)]


def test_audit_log_survives_a_dead_connection(pool):
    dead, fresh = FakeConn(dead=True), FakeConn()
    pool(dead, fresh)
    db.log_query("s1", "How many orders?", "SELECT COUNT(*) FROM orders", True, None)
    assert fresh.committed
    assert "INSERT INTO query_log" in fresh.executed[0][0]


def test_audit_log_never_raises(pool):
    pool(FakeConn(dead=True), FakeConn(dead=True))
    db.log_query("s1", "q", None, False, "boom")  # no exception
