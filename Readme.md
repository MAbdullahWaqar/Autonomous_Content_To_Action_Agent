#  Autonomous Content-To-Action Agent

> An Agentic AI system that transforms unstructured content into actionable outcomes — built with Google Antigravity.

## Overview

This system implements a **6-agent AI pipeline** that processes unstructured content (news articles, business reports, policy updates) and autonomously:

1. **Understands** the content — domain, entities, changes
2. **Extracts** non-obvious, quantified insights
3. **Analyzes** multi-order impact across stakeholders
4. **Generates** 3 ranked executable actions
5. **Simulates** execution of the top action (before/after state)
6. **Reports** a structured outcome with agent execution trace

## Architecture

```
┌─────────────────────────────────────────────────────┐
│                   Mobile App (Expo)                   │
│  Login → Input Content → Pipeline View → Report View │
│               History → Settings                      │
└──────────────────────┬──────────────────────────────┘
                       │ SSE / REST
┌──────────────────────▼──────────────────────────────┐
│                Next.js API Backend                    │
│  POST /api/pipeline  — SSE streaming agent progress  │
│  GET  /api/reports   — Saved report CRUD             │
│  GET  /api/samples   — Demo sample content           │
└──────────────────────┬──────────────────────────────┘
                       │
┌──────────────────────▼──────────────────────────────┐
│              6-Agent Pipeline Engine                  │
│  Agent 1: ContentUnderstandingAgent                  │
│  Agent 2: InsightExtractorAgent                      │
│  Agent 3: ImpactAnalyzerAgent                        │
│  Agent 4: ActionGeneratorAgent                       │
│  Agent 5: ExecutionSimulatorAgent                    │
│  Agent 6: OutcomeReporter                            │
│           (Google Gemini 1.5 Pro)                    │
└──────────────────────┬──────────────────────────────┘
                       │
┌──────────────────────▼──────────────────────────────┐
│               Firebase Services                      │
│  Authentication — Email/password login               │
│  Cloud Firestore — Report persistence                │
└─────────────────────────────────────────────────────┘
```

## Tech Stack

| Component | Technology |
|-----------|-----------|
| Mobile App | Expo (React Native) + Expo Router |
| API Backend | Next.js 15 (App Router) |
| AI Model | Google Gemini 1.5 Pro via Vercel AI SDK |
| Structured Output | Zod schemas + `generateObject()` |
| Authentication | Firebase Auth |
| Database | Cloud Firestore |
| Streaming | Server-Sent Events (SSE) |

## How Antigravity Is Used

Google Antigravity serves as the **core development platform**:
- **Orchestrates** the entire agent workflow design and implementation
- **Manages** reasoning by engineering prompts for each agent
- **Integrates** tools/APIs (Gemini, Firebase, SSE streaming)
- **Handles** execution planning with structured Zod schemas

## Setup Instructions

### Prerequisites
- Node.js 18+
- Expo CLI (`npm install -g expo-cli`)
- Firebase project (Auth + Firestore enabled)
- Google Gemini API key

### 1. Backend Setup

```bash
cd backend
npm install

# Configure environment
cp .env.local.example .env.local
# Edit .env.local with your API keys:
# - GOOGLE_GENERATIVE_AI_API_KEY
# - FIREBASE_PROJECT_ID
# - FIREBASE_CLIENT_EMAIL
# - FIREBASE_PRIVATE_KEY

npm run dev
```

### 2. Mobile App Setup

```bash
cd mobile
npm install

# Edit lib/firebase.ts with your Firebase config
# Edit lib/api.ts — set API_BASE_URL to your backend URL

npx expo start
```

### 3. Firebase Setup

1. Create a Firebase project at https://console.firebase.google.com
2. Enable **Email/Password** authentication
3. Create a **Cloud Firestore** database
4. Download service account JSON for the backend
5. Add web app config to `mobile/lib/firebase.ts`

## Project Structure

```
├── backend/                  # Next.js API Backend
│   └── src/
│       ├── app/api/
│       │   ├── pipeline/     # SSE streaming pipeline endpoint
│       │   ├── reports/      # Report CRUD
│       │   └── samples/      # Demo content
│       └── lib/
│           ├── agents/       # 6-agent pipeline engine
│           │   ├── types.ts      # TypeScript interfaces
│           │   ├── schemas.ts    # Zod validation schemas
│           │   ├── prompts.ts    # Agent system prompts
│           │   └── pipeline.ts   # Orchestrator
│           ├── auth.ts       # Firebase token verification
│           ├── firebase-admin.ts
│           ├── firestore.ts  # Report persistence
│           └── samples.ts    # Sample content data
│
├── mobile/                   # Expo React Native App
│   ├── app/
│   │   ├── _layout.tsx       # Root layout + auth routing
│   │   ├── (auth)/           # Login & Register screens
│   │   ├── (tabs)/           # Tab navigation
│   │   │   ├── index.tsx     # Home — content input
│   │   │   ├── history.tsx   # Saved reports
│   │   │   └── settings.tsx  # User settings
│   │   ├── pipeline.tsx      # Real-time agent progress
│   │   └── report/[id].tsx   # Full report view
│   └── lib/
│       ├── api.ts            # Backend API client
│       ├── auth.tsx          # Firebase auth context
│       ├── firebase.ts       # Firebase client config
│       └── theme.ts          # Design system
│
└── README.md
```

## Agent Pipeline Detail

Each agent uses `generateObject()` with Zod schema validation for type-safe structured output:

| Agent | Input | Output | Model |
|-------|-------|--------|-------|
| ContentUnderstandingAgent | Raw text | Domain, entities, changes, time sensitivity | Gemini 1.5 Pro |
| InsightExtractorAgent | Content analysis | Key facts, main insight, signals, urgency | Gemini 1.5 Pro |
| ImpactAnalyzerAgent | Insights | Implications, severity, stakeholders, impact | Gemini 1.5 Pro |
| ActionGeneratorAgent | Full context | 3 ranked actions with owners | Gemini 1.5 Pro |
| ExecutionSimulatorAgent | Top action | Before/after state, steps, notification | Gemini 1.5 Pro |
| OutcomeReporter | All results | Executive summary | Gemini 1.5 Pro |

## Assumptions

- Sample scenarios use Pakistani market context for demonstration
- Simulation uses realistic placeholder data (not connected to live systems)
- Financial estimates include stated assumptions
- Email/SMS notifications are drafted but not actually sent

## License

MIT
