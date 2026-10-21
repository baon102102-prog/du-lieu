import secrets
from pathlib import Path
from typing import Optional

from fastapi import Cookie, Depends, FastAPI, HTTPException, Request
from fastapi.responses import FileResponse, JSONResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel

from .domain import AS_OF, COSTS, INVENTORY, WARNINGS, summary, transactions

app = FastAPI(title="BAOQ Internal — synthetic local review", docs_url="/api/docs")
# Demo personas are intentionally available only in this synthetic, loopback-only app.
# No production authentication or live source configuration is implemented.
GRANTS = {
    "ceo": {"overview", "transactions", "inventory", "errors", "costs"},
    "cofounder": set(),
    "inventory": {"inventory"},
    "sales": {"transactions"},
}
SESSIONS: dict[str, str] = {}


@app.middleware("http")
async def local_only(request: Request, call_next):
    host = request.headers.get("host", "").split(":")[0]
    if host not in {"127.0.0.1", "localhost", "testserver"}:
        return JSONResponse({"detail": "Local synthetic review only"}, 403)
    if request.method != "GET" and request.headers.get("origin") not in {
        None,
        "http://" + request.headers.get("host", ""),
    }:
        return JSONResponse({"detail": "Origin rejected"}, 403)
    response = await call_next(request)
    response.headers["Cache-Control"] = "no-store"
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["Content-Security-Policy"] = (
        "default-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; connect-src 'self'"
    )
    return response


class Persona(BaseModel):
    role: str


@app.post("/api/demo/session")
def session(body: Persona):
    if body.role not in GRANTS:
        raise HTTPException(400, "Unknown demo persona")
    token = secrets.token_urlsafe(32)
    SESSIONS[token] = body.role
    response = JSONResponse({"role": body.role, "grants": sorted(GRANTS[body.role])})
    response.set_cookie("baoq_demo", token, httponly=True, samesite="strict", max_age=3600)
    return response


def identity(baoq_demo: Optional[str] = Cookie(default=None)):
    if not baoq_demo or baoq_demo not in SESSIONS:
        raise HTTPException(401, "Select a synthetic demo persona")
    return SESSIONS[baoq_demo]


def require(section):
    def check(role=Depends(identity)):
        if section not in GRANTS[role]:
            raise HTTPException(403, "Section permission required")
        return role

    return check


@app.get("/api/me")
def me(role=Depends(identity)):
    return {"role": role, "grants": sorted(GRANTS[role]), "synthetic": True, "snapshot_at": AS_OF}


def validate_period(period):
    if period not in {"", "2026-10"}:
        raise HTTPException(422, "Only the October 2026 synthetic fixture is available")


@app.get("/api/overview")
def overview(period: str = "", role=Depends(require("overview"))):
    validate_period(period)
    return summary(period)


@app.get("/api/records/{section}")
def records(
    section: str, period: str = "", field: str = "", value: str = "", role=Depends(identity)
):
    if section not in GRANTS[role]:
        raise HTTPException(403, "Section permission required")
    validate_period(period)
    sources = {
        "transactions": transactions(period),
        "inventory": INVENTORY if period else [],
        "errors": WARNINGS if period else [],
        "costs": COSTS if period else [],
    }
    if section not in sources:
        raise HTTPException(404, "Unknown section")
    rows = sources[section]
    if field:
        if field not in {"channel", "sale", "id", "sku", "age_days"}:
            raise HTTPException(422, "Unsupported filter")
        rows = [
            r
            for r in rows
            if (
                r.get("age_days", 0) >= int(value)
                if field == "age_days" and value.isdigit()
                else str(r.get(field, "")) == value
            )
        ]
    return {
        "rows": rows,
        "synthetic": True,
        "snapshot_at": AS_OF,
        "summary": summary(period) if section == "costs" else None,
    }


@app.get("/api/record/{section}/{record_id}")
def detail(section: str, record_id: str, role=Depends(identity)):
    rows = records(section, "2026-10", role=role)["rows"]
    found = next((r for r in rows if r["id"] == record_id), None)
    if not found:
        raise HTTPException(404, "Record not found")
    return {"record": found, "synthetic": True, "snapshot_at": AS_OF}


DIST = Path(__file__).resolve().parents[1] / "frontend" / "dist"
if DIST.exists():
    app.mount("/assets", StaticFiles(directory=DIST / "assets"), name="assets")

    @app.get("/")
    def index():
        return FileResponse(DIST / "index.html")
