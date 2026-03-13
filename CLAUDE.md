# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**moosepath** — an AI-powered tool that helps Canadian agtech founders navigate 283+ agricultural innovation support programs across 10 provinces. Built as a React SPA with Vercel serverless API functions, powered by Claude for personalized pathway generation and gap analysis.

Brand tagline: "Better agtech, guided to farm."

## Development Commands

```bash
npm run dev            # Start Vite dev server (frontend only; API routes deploy via Vercel)
npm run build:client   # Production build → dist/
npm run preview        # Preview production build locally
```

There are no lint, test, or format scripts configured.

To test API routes locally, use `vercel dev` (requires Vercel CLI and `.env` with `POSTGRES_URL` and `ANTHROPIC_API_KEY`).

## Architecture

### Frontend (client/src/)

React 19 + TypeScript SPA using Vite. Routing via Wouter (lightweight).

- **App.tsx** — Router: `/` (Home) and `/navigator` (Navigator)
- **pages/Home.tsx** — Landing page with beta modal, program count badge
- **pages/Navigator.tsx** — Main app orchestrating Wizard, GapMatrix, PathwayCard, and Chat
- **components/Wizard.tsx** — 4-step intake form (description → stage → provinces → need)
- **components/GapMatrix.tsx** — Province × Category grid with color-coded gap analysis
- **components/PathwayCard.tsx** — Displays AI-generated personalized pathway steps

Styling uses inline styles + CSS custom properties defined in `client/src/index.css`. Fonts: DM Sans (body), DM Serif Display (headings) via Google Fonts.

Two user modes: **founder** (default "e") and **ecosystem operator** ("ec"), which changes system prompts and UI behavior.

### Backend (api/)

Vercel serverless functions (Node.js). Each file under `api/` maps to an endpoint:

| Route | Method | Purpose |
|-------|--------|---------|
| `/api/programs` | GET | List all programs |
| `/api/pathway` | POST | Generate personalized founder pathway (Claude) |
| `/api/gaps` | GET | Province × Category matrix with counts |
| `/api/gaps/explain` | POST | AI-powered gap classification and explanation |
| `/api/chat` | POST | Conversational recommendations (Claude) |
| `/api/submissions` | POST | Save user feedback on programs |

### Database

PostgreSQL via Supabase (SSL required). ORM: Drizzle (`api/schema.ts`).

Two tables:
- **programs** — name, category (Fund/Accel/Pilot/Event/Org/Train), province[], stage[], use_case[], description, website, fundingType, fundingMaxCad, national, status
- **submissions** — user feedback (programName, bestFor, submitterName, submitterEmail)

### AI Integration

Claude Sonnet (`claude-sonnet-4-20250514`) via direct Anthropic API calls (no SDK wrapper). Used in three endpoints: pathway, gaps/explain, and chat. System prompts contain extensive domain knowledge about Canadian ag ecosystem, stage-specific framing, and product-type awareness.

### Key Domain Mappings (api/pathway/index.ts)

- **NEED_TO_CATEGORIES** — Maps user need → priority categories
- **STAGE_PRIORITIES** — Recommended categories per stage
- **STAGE_FRAMING** — LLM guidance per stage (e.g., flag CCA advisor channel at MVP)
- **Gap classification** — Deterministic logic (structural, market_failure, coverage_gap, stage_mismatch, data_gap) with province context (AG_HEAVY, AG_LIGHT, NEIGHBORS)

## Environment Variables

| Variable | Description |
|----------|-------------|
| `POSTGRES_URL` | Supabase PostgreSQL connection string (SSL required) |
| `ANTHROPIC_API_KEY` | Anthropic API key for Claude |

Fallback: `DATABASE_URL` is checked if `POSTGRES_URL` is not set.

## Deployment

Vercel serverless deployment. `vercel.json` configures SPA rewrites (non-API routes → index.html). API functions auto-deploy from `/api`. Database connections use max 1 connection per handler (serverless optimization).
