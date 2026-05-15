# Autonomous Content-To-Action Agent (AISeekho / Antigravity)

Agentic pipeline: **ingest → Antigravity Manager (work plan) → 6 specialists → mock tool bridge → deterministic outcome evidence** — built for **Challenge 1: Insight → Action**.

## Judge scorecard (how this maps to the brief)

| Brief pillar | How we demonstrate it |
|--------------|------------------------|
| **1–4 Content → insight → impact → actions** | Six Gemini `generateObject` steps with Zod; prompts block generic summarization. |
| **5 Simulation (critical)** | `ExecutionSimulatorAgent` + **automatic retry** if before/after tables do not differ or steps &lt; 5; **mock tool handlers** per `tool_used` with latency + audit lines. |
| **6 Outcome visualization** | Mobile (and optional web) report: **before/after tables**, execution steps, notification draft, **`outcome_evidence`** (KPI snapshots + **field-level `→` diffs** + QA badges). |
| **7 Agentic workflow** | SSE trace; Manager **reasoning_chain** + **planned_tasks**; `agent_trace` timings. |
| **Antigravity (25%)** | **Development** in Antigravity (see [ANTIGRAVITY.md](./ANTIGRAVITY.md)). **Runtime** mirrors Manager/plan/tools pattern per [Google’s Antigravity announcement](https://developers.googleblog.com/build-with-google-antigravity-our-new-agentic-development-platform/). |
| **Optional web app** | **`/demo`** on the Next.js server — Firebase login + SSE log + final JSON (set `NEXT_PUBLIC_FIREBASE_*`). |

## Architecture (short)

```
Mobile (Expo) or Web /demo  →  POST /api/pipeline { content, source }
       → resolve URL/PDF/text  →  Antigravity work plan (LLM)
       → 6 agents (LLM)  →  mock tool bridge (TS)  →  outcome_evidence (TS diff/KPI)
       →  Firestore report  +  SSE to client
```

## API

- `POST /api/pipeline` — `Authorization: Bearer <Firebase idToken>`, body `{ "content": string, "source": "text" | "url" | "pdf_base64" }`, response **SSE**.
- Response JSON (`pipeline_complete`) includes **`outcome_evidence`**: `diff_highlights`, `dashboard_kpis`, `simulation_validation` (warnings if QA fails).

## Setup

**Backend:** `cd backend && npm install && cp .env.local.example .env.local` — set `GOOGLE_GENERATIVE_AI_API_KEY`, Firebase Admin, and optionally `NEXT_PUBLIC_FIREBASE_*` for `/demo`. `npm run dev`.

**Mobile:** `cd mobile && npm install` — configure `lib/firebase.ts` and `lib/api.ts` (`API_BASE_URL`).

**Web demo:** open `http://localhost:3000/demo` after env vars are set.

## 3-minute demo script (for your video)

1. **Say in one sentence:** “Sandbox only — no real CRM or customer email.”  
2. **Input:** URL or PDF **or** paste the fuel / sales sample.  
3. **Pipeline screen:** Manager planning → six agents → tool audit lines.  
4. **Report:** open **Simulated ops dashboard** — point at **STATE CHANGED ✓** and **one `→` diff line**; scroll **before/after** tables and **notification** body.  
5. **ANTIGRAVITY.md / IDE:** 10s cut of Antigravity Manager/tasks next to the running app.

## Assumptions

Public URLs only; text-based PDFs; mock tools; fictional data only.

## License

MIT
