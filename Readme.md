# Autonomous Content-To-Action Agent

Agentic AI that turns unstructured content into insight, impact, ranked actions, simulated execution, and auditable outcomes — with **Google Antigravity–style orchestration in the runtime**, not only during development.

## What runs end-to-end

1. **Ingestion** — `text` (paste), `url` (server fetch + Cheerio HTML to text), or `pdf_base64` (`pdf-parse`).
2. **Antigravity Manager** — Gemini emits a structured **work plan** (mission, reasoning chain, six planned tasks with `manager_surface`, dependencies, expected artifacts) via `AntigravityWorkPlanSchema`.
3. **Six specialists** — understanding → insight → impact → actions → simulation narrative → outcome report (`generateObject` + Zod).
4. **Tool bridge** — TypeScript mock handlers run **after** the simulation agent and emit one auditable record per step (latency, digests, audit lines).

Evidence for judges: [ANTIGRAVITY.md](./ANTIGRAVITY.md). Official Antigravity product framing: [Google Developers Blog — Antigravity](https://developers.googleblog.com/build-with-google-antigravity-our-new-agentic-development-platform/).

## API

- `POST /api/pipeline` — JSON `{ "content": string, "source": "text" | "url" | "pdf_base64" }`, Firebase `Authorization: Bearer <idToken>`, response **SSE** (`ingestion_complete`, `workplan_start`, `workplan_complete`, `tool_invocation`, agent events, `pipeline_complete`).
- `GET /api/reports`, `GET /api/samples` — as before.

## Repo map

- `backend/src/lib/antigravity/` — work plan schema, prompts, **tool-bridge** (executed mocks).
- `backend/src/lib/ingest/resolve-content.ts` — URL/PDF/text normalization.
- `backend/src/lib/agents/pipeline.ts` — wires Manager → specialists → tool bridge → reporter.
- `mobile/app/(tabs)/index.tsx` — Text / URL / PDF picker; stages payload in AsyncStorage.
- `mobile/app/pipeline.tsx` — SSE UI for Manager + tool audit + six agents.

## Setup

**Backend:** `cd backend && npm install && cp .env.local.example .env.local` — set `GOOGLE_GENERATIVE_AI_API_KEY` and Firebase Admin keys — `npm run dev`.

**Mobile:** `cd mobile && npm install` — set `mobile/lib/firebase.ts` and `mobile/lib/api.ts` `API_BASE_URL` — `npx expo start`.

## Assumptions

Public URLs only for fetch; text-based PDFs work best; mock tools do not hit real CRM/email.

## License

MIT
