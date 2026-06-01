# Task Plan

## Objective
- Close the current frontend/backend loop breakpoints without changing the broader product flow.

## Constraints
- Keep Python `:8000` as the source of `/api/integration/*` data.
- Keep Node `:8002` responsible for chatbot support, HTTP LLM calls, and WebSocket streaming.
- Avoid rewriting the context architecture; patch only the broken integration edges.

## Steps
- [completed] Inspect current implementation and confirm failure modes.
- [completed] Add the missing HTTP chatbot endpoint and shared LLM message assembly.
- [completed] Move Node-to-Python base URL into environment-backed config.
- [completed] Remove duplicate system prompt injection in the WebSocket path.
- [completed] Update stale scale integration test base URL assumptions.
- [completed] Run build and targeted tests.

## Verification
- `npm run build`
- `npx vitest run src/context/tests/contextAssembler.test.ts`
- Type-check or smoke-load the Node server entry where feasible.

## Outcome
- Added `POST /api/chatbot/chat` for non-streaming LLM calls used by daily advice and memory extraction.
- Centralized server config for `PORT` and `REHAB_API_BASE`.
- Shared LLM message assembly now prevents duplicate system prompt injection.
- Updated scale integration test defaults from Node `:8002` to Rehab Python `:8000`.
- Verified with frontend build, context assembler tests, and standalone server TypeScript checks.

## Three-End Test Plan
- [completed] Confirm running Python, Node, and Vite processes.
- [completed] Smoke-test Python `/api/integration/*`.
- [completed] Smoke-test Node `/api/chatbot/*` including the new HTTP chat route.
- [completed] Smoke-test Vite page load and proxy paths in the browser.
- [completed] Record pass/fail outcome and residual risks.

## Three-End Test Outcome
- Replaced the old `chatbotagent` Node/Vite processes on `:8002` and `:5175` with the current `RehabGPT-feat-biz` branch.
- Verified Python `:8000`, Node `:8002`, and Vite `:5175` with test patient `CODEX_E2E_JS_20260601014416`.
- Full API chain passed: assessment push/query, plan push/query, scale push/pending/submit/results, family code login, tracking submit/history.
- Node chatbot passed: health, assessment history, assessment trend, HTTP chat, and WebSocket chat.
- Vite proxy passed: app root, `/api/integration/*`, `/api/chatbot/health`, and `/api/chatbot/chat`.
- Browser smoke test loaded `http://localhost:5175/` with no console errors and showed the family-code login screen.
- Residual note: C-end record reads should use `patient_id` returned from `family/login`; `family_code` is an access credential, not a direct record query key.
