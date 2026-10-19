"""HTTP layer: header-token auth and the JSON contract the frontend relies on.
The graph and the database are replaced, so no API keys or database are needed."""

import pytest
from fastapi.testclient import TestClient

from app import db, main
from app.models import AgentResponse, TableData


@pytest.fixture
def client(monkeypatch):
    monkeypatch.setenv("API_AUTH_TOKEN", "test-token")
    monkeypatch.setattr(db, "init_pool", lambda: None)
    monkeypatch.setattr(db, "close_pool", lambda: None)

    class FakeGraph:
        def invoke(self, state):
            return {"final_response": AgentResponse(
                response=f"You asked: {state['user_message']}",
                data=TableData(headers=["count"], rows=[["99441"]]),
                sql="SELECT COUNT(*) FROM orders",
            )}

    monkeypatch.setattr(main, "compiled_graph", FakeGraph())
    with TestClient(main.app) as test_client:
        yield test_client


def test_health(client):
    assert client.get("/health").json() == {"status": "ok"}


def test_chat_requires_the_api_key(client):
    body = {"message": "How many orders?", "session_id": "s1"}
    assert client.post("/chat", json=body).status_code == 401
    assert client.post("/chat", json=body, headers={"X-API-Key": "wrong"}).status_code == 401


def test_chat_returns_the_frontend_contract(client):
    response = client.post(
        "/chat",
        json={"message": "How many orders?", "session_id": "s1"},
        headers={"X-API-Key": "test-token"},
    )
    assert response.status_code == 200
    assert response.json() == {
        "response": "You asked: How many orders?",
        "data": {"headers": ["count"], "rows": [["99441"]]},
        "visualization": None,
        "sql": "SELECT COUNT(*) FROM orders",
    }


def test_chat_rejects_a_malformed_request(client):
    response = client.post("/chat", json={"message": "hi"}, headers={"X-API-Key": "test-token"})
    assert response.status_code == 422
