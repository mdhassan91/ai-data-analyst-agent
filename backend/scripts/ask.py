"""
Ask the agent a few sample questions in-process - no server, no HTTP.
Needs a real database and API keys in .env:

    python -m scripts.ask

The fastest feedback loop while changing prompts or graph logic.
"""

from dotenv import load_dotenv

load_dotenv()

from app import db
from app.graph import compiled_graph

db.init_pool()

test_questions = [
    "How many orders do we have in total?",
    "Hello, what can you help me with?",
    "What's the total revenue from delivered orders?",
    "Top 5 product categories by order count",
]

for question in test_questions:
    print(f"\n{'=' * 60}")
    print(f"Q: {question}")
    print("=" * 60)

    result = compiled_graph.invoke({"user_message": question, "session_id": "test-local"})
    response = result["final_response"]

    print(f"Response: {response.response}")
    if response.sql:
        print(f"SQL: {response.sql}")
    if response.data:
        print(f"Data: {response.data.headers} -> {response.data.rows[:3]}")

db.close_pool()
