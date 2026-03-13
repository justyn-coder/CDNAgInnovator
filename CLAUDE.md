# CLAUDE.md

This file provides guidance to Claude Code when working with code in this repository.

## Project Overview

**CDNAgInnovator** — AI-powered Canadian agtech ecosystem navigator that matches founders to relevant programs (accelerators, funding, pilot sites, industry orgs) based on stage, province, and need. Also serves ecosystem operators analyzing coverage gaps. 283+ programs across 10 provinces.

- **Live URL:** https://cdn-ag-innovator.vercel.app
- **Repo:** justyn-coder/CDNAgInnovator
- **Sole builder/founder:** Justyn

## Tech Stack

- **Frontend:** React + TypeScript + Vite (SPA)
- **Backend:** Vercel serverless API functions (api/ directory)
- **Database:** Supabase Postgres — project ID `slttpknnuthbttjuzrnz` (ca-central-1)
- **AI:** Anthropic Claude API (Sonnet model for all endpoints)
- **Styling:** CSS with warm palette, DM Serif Display typography, Apple-esque polish
- **Deploy:** Vercel auto-deploy on git push to `main`

## Dev Commands

```bash
npm run dev          # Vite dev server (frontend only)
npm run build:client # Production build
vercel dev           # Full local dev with API functions
```

## Architecture

### Frontend (src/)
- `src/App.tsx` — Main router, mode switching (founder/operator)
- `src/components/Wizard/` — 4-step founder wizard (what building → stage → province → need)
- `src/components/PathwayCard/` — AI-generated pathway display with phased loading
- `src/components/GapMatrix/` — Operator gap analysis with AI explain button
- `src/components/Chat/` — Chat interface, mode-aware (green "Founder" / blue "Partner" badge)
- `src/components/BrowseAll/` — "Explore All Programs" card-list layout (founder mode)

### API Routes (api/)
- `POST /api/pathway` — AI pathway generation from wizard inputs
- `POST /api/chat` — Chat completions (founder + operator modes)
- `POST /api/gaps/explain` — AI gap explanation for GapMatrix
- `GET /api/programs` — List/filter programs
- `GET /api/gaps` — Gap matrix data
- `POST /api/submissions` — Feedback storage

### Database (Supabase)
- **programs** table: 283 rows, columns include name, category, province (array), stage (array), url, description
- **knowledge** table: 65 entries — title, body, tags (array), province (array), confidence, source
- **submissions** table: feedback storage (programName LIKE 'FEEDBACK%' for feedback entries)
- Province columns use arrays: `ARRAY['AB', 'SK']` syntax for INSERT
- Province coverage query: `SELECT province, category, COUNT(*) FROM programs, unnest(province) AS province GROUP BY province, category ORDER BY province, category`

### Environment Variables
- `SUPABASE_URL` — Supabase project URL
- `SUPABASE_SERVICE_ROLE_KEY` — Supabase service role key
- `ANTHROPIC_API_KEY` — Claude API key

## Design Language

- **Typography:** DM Serif Display for headings, system sans-serif for body
- **Palette:** Warm amber/gold accents, earth tones
- **Style:** Apple-esque polish, generous whitespace, card-based layouts
- **Wizard:** Card-style option buttons, 2-column province grid, gradient Next button
- **Feedback button:** Amber "💬 Feedback" floating button with modal overlay

## Dual User Modes

1. **Founder mode:** Wizard → PathwayCard → Chat follow-up. Nav shows "Explore All Programs"
2. **Operator mode:** GapMatrix with AI explain, Chat with "Partner" badge. For ecosystem operators (accelerator managers, program officers, investors)

## Known Issues & Fix Queue (priority order)

1. **Atlantic province expansion bug:** Wizard sends "Atlantic" but DB uses NB/NS/PE/NL individually. Pathway API needs mapping logic to expand "Atlantic" → ['NB', 'NS', 'PE', 'NL']
2. **Pathway quality:** Flagged during Vivid Machines usability test — review and improve prompt/filtering
3. **Feedback admin:** Need authenticated `/api/admin/feedback` endpoint + email notifications before sharing tool with key contacts
4. **WizardSummary:** Needs "need" pill display
5. **Program cards in chat:** Chat responses should render program mentions as styled cards
6. **Email capture:** Soft ask after pathway generation ("Want updates when new programs match your profile?") — not gated

## Deployment

- **Auto-deploy:** Every push to `main` triggers Vercel build
- **Vercel project:** `prj_syYoTawrNveXB409UwiMoVL1kGom`, team `team_FD5taAPjMuuZW21iA0OqmoB1`
- **IGNORE** old project `ag-innovator` / `AgInnovator` (prj_1Dtt3WvFO2TR9UiOzFEjGPFg3WpG)

## Conventions

- Commit messages: imperative mood, concise (e.g., "Fix Atlantic province mapping in pathway API")
- Test changes on live URL after deploy with hard refresh (Cmd+Shift+R)
- When editing API routes, verify with `vercel dev` locally before pushing if possible
- Batch related changes into single commits/deploys rather than one-file-at-a-time
- Logic before UI before AI: define what counts as a gap/output before building UI, build UI before wiring AI calls
