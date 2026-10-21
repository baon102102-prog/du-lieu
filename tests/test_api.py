from datetime import datetime, timezone

from fastapi.testclient import TestClient

from backend.adapters import DemoImportLedger, SourceRecord
from backend.domain import summary, transactions
from backend.main import app


def client(role=None):
    c = TestClient(app)
    if role:
        assert c.post("/api/demo/session", json={"role": role}).status_code == 200
    return c


def test_no_session_and_forged_role():
    c = client()
    assert c.get("/api/overview", headers={"X-Role": "ceo"}).status_code == 401
    c.cookies.set("baoq_demo", "ceo")
    assert c.get("/api/overview").status_code == 401


def test_ceo_and_explicit_permissions():
    for role in ("cofounder", "inventory", "sales"):
        c = client(role)
        assert c.get("/api/overview?period=2026-10").status_code == 403
        assert c.get("/api/records/costs?period=2026-10").status_code == 403
        assert c.get("/api/record/costs/DEMO-C01").status_code == 403
    assert client("cofounder").get("/api/records/transactions?period=2026-10").status_code == 403
    assert client("inventory").get("/api/records/inventory?period=2026-10").status_code == 200
    assert client("sales").get("/api/records/transactions?period=2026-10").status_code == 200
    assert client("ceo").get("/api/overview?period=2026-10").status_code == 200


def test_reconciliation_and_drilldown():
    s = summary("2026-10")
    assert s["revenue"] == 190000000
    assert s["cogs"] == 130500000
    assert s["operating"] == 32000000
    assert s["result"] == 27500000
    assert s["total_cost"] == 162500000
    for dim in ("channel", "sale"):
        assert sum(r["amount"] for r in s["groups"][dim]) == s["revenue"]
        for g in s["groups"][dim]:
            result = (
                client("ceo")
                .get(
                    "/api/records/transactions",
                    params={"period": "2026-10", "field": dim, "value": g["label"]},
                )
                .json()["rows"]
            )
            assert sum(r["amount"] for r in result) == g["amount"]
    assert sum(r["cost"] for r in transactions("2026-10")) == s["cogs"]


def test_blank_invalid_and_details():
    c = client("ceo")
    assert c.get("/api/overview").json()["revenue"] == 0
    assert c.get("/api/records/inventory").json()["rows"] == []
    assert c.get("/api/overview?period=2025-10").status_code == 422
    assert c.get("/api/records/transactions?field=unknown").status_code == 422
    assert c.get("/api/record/transactions/missing").status_code == 404
    assert c.get("/api/record/errors/DEMO-E01").json()["record"]["completion"]
    rows = c.get("/api/records/inventory?period=2026-10&field=age_days&value=90").json()["rows"]
    assert len(rows) == 2 and sum(r["value"] for r in rows) == 42000000


def test_local_and_origin_guards():
    c = client()
    assert c.get("/api/me", headers={"host": "evil.example"}).status_code == 403
    assert (
        c.post(
            "/api/demo/session", json={"role": "ceo"}, headers={"origin": "https://evil.example"}
        ).status_code
        == 403
    )


def test_import_idempotency_closed_history():
    ledger = DemoImportLedger()
    now = datetime.now(timezone.utc)
    r = SourceRecord("demo:sapo", "order#line", now, now, {"amount": 10})
    assert ledger.import_record(r) == "inserted"
    assert ledger.import_record(r) == "unchanged"
    ledger.closed.add(("demo:sapo", "order#line"))
    assert (
        ledger.import_record(SourceRecord(r.source, r.original_id, now, now, {"amount": 11}))
        == "blocked_closed_history"
    )
    assert not ledger.can_close()
    assert ledger.rows[(r.source, r.original_id)].payload == {"amount": 10}


def test_postgres_insert_preserves_existing_source():
    from sqlalchemy.dialects import postgresql

    from backend.storage import insert_new_statement

    now = datetime.now(timezone.utc)
    sql = str(
        insert_new_statement("demo:sapo", "O1#L1", now, now, {"amount": 1}, "hash").compile(
            dialect=postgresql.dialect()
        )
    )
    assert "ON CONFLICT (source, original_id) DO NOTHING" in sql
    assert "DO UPDATE" not in sql
