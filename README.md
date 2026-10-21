# BAOQ Internal — clickable UI scaffold

**Current scope: design review and developer handoff only.** The user clarified that their developer will build the application; this scaffold lets them review, add/remove screens and describe behavior.

## Open locally

```sh
cd /Users/baoqluxury/Documents/Codex/2026-10-19/task/baoq-internal
./scripts/run-local.sh
```

Open http://127.0.0.1:8787 . Choose a **simulated UI role**, open Điều hành, and select October 2026 demo data. Initial period is blank. The server only serves static files; no application backend/database is started.

## Reviewable screens

- Outer portal: Điều hành, Price System, Studio, Marketing, Chính sách/quy định/quy trình. Unbuilt apps marked clearly.
- CEO dashboard: KPI cards, channel/sale revenue donuts, cost categories/ratios, inventory aging, warnings.
- Drilldown tables and record dialogs; URL filters survive reload/back; repeated open/close and Escape work.
- Workbook-aligned accounting navigation; unimplemented pages marked pending.
- Role switcher **only simulates UI states**. It is NOT authentication or secure permission enforcement. All fixtures ship to the browser. No real business data belongs here.
- Commission/score unavailable until approved policy.

See [developer handoff](docs/developer-handoff.md), [source contract](docs/source-contract.md), and [verification](docs/verification.md).

## Files for dev

`frontend/src/main.tsx` and `style.css`: screens and styles.
`frontend/src/demo-data.json`: clearly synthetic fixture data.
`frontend/src/simulated-api.ts`: in-browser fixture router, no fetch/network/source integration.
`frontend/qa.spec.ts`: UI interaction checks.
`frontend/src/luxury.css`: Luxury Workspace token/motion layer (see developer handoff).
`frontend/visual-capture.spec.ts` + `playwright.capture.config.ts`: before/after screenshot capture into `docs/qa/`.

Build with existing local tools:

```sh
PATH="$PWD/.node/bin:$PATH" .node/bin/npm --prefix frontend run build
```

No further runtime installation is needed for review. `.node`, `.venv` and `.browsers` were created in this isolated folder before the scope clarification and preserved.

## Work preserved but halted

Earlier in the same task, FastAPI routes, demo session/API permission checks, PostgreSQL schema/storage seam, adapters and Python tests were created under the initial application request. They remain in `backend/` and `tests/` **unused by this UI scaffold**, for transparency and preservation only. Development of those features has stopped. No PostgreSQL server, account, migration, live integration, persistent security configuration, deployment, GitHub push or source write was performed. Existing Price System and developer projects were not modified.

The official FastAPI template was an architectural reference, not a completed cloned/configured foundation. Backend test results are historical evidence only, not a claim that the current UI has security.
