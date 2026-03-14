# Architecture

## File Tree

```
CDNAgInnovator/
├── CLAUDE.md                          # Project overview + pointers
├── agent_docs/
│   ├── architecture.md                # ← you are here
│   ├── api-patterns.md
│   ├── database-schema.md
│   └── requirements.md
├── api/                               # Vercel serverless functions
│   ├── schema.ts                      # Drizzle ORM table definitions
│   ├── pathway/index.ts               # POST — AI pathway generation
│   ├── chat/index.ts                  # POST — Chat (founder + operator modes)
│   ├── gaps/index.ts                  # GET  — Gap matrix data
│   ├── gaps/explain/index.ts          # POST — AI gap narrative per cell
│   ├── programs/index.ts              # GET  — List/filter programs
│   ├── submissions/index.ts           # POST — Feedback + program submissions
│   └── admin/feedback/index.ts        # GET  — Admin feedback viewer (auth required)
├── client/
│   ├── public/                        # Static assets (favicon, fonts)
│   └── src/
│       ├── main.tsx                   # React entry point
│       ├── App.tsx                    # Router (wouter), mode switching
│       ├── index.css                  # Tailwind v4 setup, @theme tokens, keyframes, base styles
│       ├── lib/
│       │   └── cn.ts                  # clsx wrapper for conditional class composition
│       ├── pages/
│       │   ├── Home.tsx               # Landing page — beta modal, founder/operator CTA
│       │   └── Navigator.tsx          # Main app page (god component — see below)
│       └── components/
│           ├── Wizard.tsx             # 4-step founder onboarding wizard
│           ├── PathwayCard.tsx        # AI pathway display with phased loading
│           └── GapMatrix.tsx          # Province × Category gap heatmap
├── index.html                         # Vite HTML entry
├── package.json
├── tsconfig.json
├── vercel.json                        # Rewrites: SPA fallback for non-API routes
└── vite.config.ts
```

## Component Responsibilities

### Navigator.tsx (Main App Page)

This is the god component. It manages both user modes, all state, chat, browse, and gap map overlays. Key concerns:

- **Mode state:** `mode` is `"f"` (founder) or `"ec"` (ecosystem operator). Set on Home.tsx, passed via URL query param.
- **Wizard flow:** `showWizard` → `Wizard` component → `handleWizardComplete()` captures snapshot (description, stage, provinces, need) → triggers PathwayCard.
- **PathwayCard integration:** After wizard completes, renders `PathwayCard` with wizard snapshot. PathwayCard has `onChatFollowUp` callback that feeds questions into the chat.
- **Chat:** Shared `messages` state, `send()` function. Chat API receives `mode` to switch system prompts. History is last 8 messages.
- **Overlay panels:** `BrowsePanel` (card-list of all programs, filterable by province), `GapMatrix` (gap heatmap). Rendered as full-screen overlays when toggled.
- **Feedback modal:** Amber "💬 Feedback" button, always visible. Modal with email persistence via sessionStorage. Submissions go to `/api/submissions` with page context auto-tagged.
- **Eco operator engagement CTA:** Floating amber CTA appears after 20s or 2+ messages in operator mode.
- **WizardSummary strip:** Shows above chat messages after wizard completes — displays stage, provinces. (Known issue: need pill not yet displayed.)

### Wizard.tsx (Founder Onboarding)

4-step wizard:
1. **What are you building?** — Free text textarea
2. **Stage** — Single select: Idea / MVP / Pilot / First Customers / Scale
3. **Province** — Multi-select: 2-column grid of provinces + "Atlantic" shortcut + National
4. **Need** — Multi-select with "Generate my pathway →" button. Options: non-dilutive capital, validate with farmers, structured program, pilot site/field validation, credibility/validation, first customers, channel/distribution, go-to-market, growth capital, industry connections

Design: DM Serif Display headers, card-style option buttons, gradient Next button. Uses `cn()` for conditional Tailwind classes (e.g., active/inactive option buttons).

### PathwayCard.tsx (AI Pathway Display)

Renders the JSON pathway from `/api/pathway`. Key elements:
- **Phased loading messages** while API call runs
- **Stage journey bar** — visual progression showing current → next stage (pulsing indicator on next stage)
- **Section headers** — "Your next moves" (timing: now/next_month) vs "Looking ahead" (next_quarter/horizon)
- **Step cards** — program name, category tag, action text, rationale, confidence badge (high/medium/exploratory), prepare note
- **Drill-in button** on first step → sends follow-up question to chat
- **Gap warning** — if pathway detects missing advisor-channel coverage, displays amber warning
- **Copy button** on chat responses

### GapMatrix.tsx (Gap Analysis)

Province × Category heatmap for ecosystem operators.
- **Rows:** BC, AB, SK, MB, ON, QC, NB, NS, PE, NL, National (11 rows)
- **Columns:** Fund, Accel, Pilot, Event, Org, Train (6 columns)
- **Stage filter dropdown** — filters the matrix by stage (All, Idea, MVP, Pilot, Comm, Scale)
- **Color scale:** 0 = Gap (red), 1 = Weak (yellow), 2 = Fair (light green), 3+ = Strong (green)
- **Cell click** → drill-down panel showing programs in that cell
- **"✦ Explain this gap" button** on Gap/Weak cells → calls `/api/gaps/explain` → AI-generated 3-4 sentence narrative
- **Inline onboarding guide** for first-time users

### Home.tsx (Landing Page)

- Beta welcome modal (triggers on first visit or `?beta=1` URL param) with stats strip
- Two CTAs: "I'm building something" (founder) → `/navigate?mode=f`, "I run a program" (operator) → `/navigate?mode=ec`

### App.tsx (Router)

Simple wouter routes: `/` → Home, `/navigate` → Navigator. Mode passed via query param.

## Data Flow

### Founder Path
```
Home (CTA) → Navigator (mode=f)
  → Wizard (4 steps)
    → handleWizardComplete(snapshot)
      → PathwayCard renders
        → POST /api/pathway (description, stage, provinces, need)
          → DB query: programs matching province + stage + need-mapped categories
          → Claude Sonnet generates structured JSON pathway
          → Response: { pathway: { steps[], gap_warning, ... }, meta: { gapInfo, ... } }
        → PathwayCard displays steps with phased loading
      → User clicks drill-in or types follow-up
        → Chat (POST /api/chat with mode="f", history)
          → DB query: matching programs + tag-matched knowledge entries
          → Claude Sonnet generates response
```

### Operator Path
```
Home (CTA) → Navigator (mode=ec)
  → Ecosystem welcome card with suggestion chips
  → Chat (POST /api/chat with mode="ec", history)
  → Gap Map button → GapMatrix overlay
    → GET /api/gaps?stage=All
      → DB: COUNT programs per province×category, filtered by stage
    → Click cell → drill-down shows programs
    → "Explain this gap" → POST /api/gaps/explain
      → Claude Sonnet generates gap narrative
  → Browse All → BrowsePanel overlay
    → GET /api/programs → card-list with province filter
```

## Routing & Vercel Config

`vercel.json` has a single rewrite rule: all non-API, non-static paths fall through to `index.html` (SPA routing). API routes are auto-detected from the `api/` directory structure by Vercel.

```json
{
  "rewrites": [
    { "source": "/((?!api/|@|client/|node_modules/).*)", "destination": "/index.html" }
  ]
}
```

## Styling Architecture

**Tailwind CSS v4** with CSS-first configuration (no `tailwind.config.js`).

- **`index.css`** — Tailwind v4 entry point with `@import "tailwindcss"`, `@theme` block defining custom design tokens, `@keyframes` for animations, `@layer base` for resets, plus `.md-body` markdown styles and scrollbar styling.
- **`@theme` tokens** — Custom colors (`bg`, `bg-secondary`, `text`, `green-mid`, `green-light`, `gold`, `amber`, `border`, etc.), shadows (`sm`, `md`, `lg`, `glow`, `green`), border radius (`sm`=8px, default=14px, `lg`=20px), fonts (`display`=DM Serif Display, `sans`=DM Sans), and animations (`fade-in-up`, `fade-in`, `pulse-dot`, `shimmer`, `slide-up`, `stage-pulse`).
- **Utility classes** — All components use Tailwind utility classes via `className`. Conditional classes use `cn()` helper (thin `clsx` wrapper from `client/src/lib/cn.ts`).
- **Hover/focus** — Pure CSS via Tailwind pseudo-class utilities (`hover:`, `focus:`). No DOM style mutations.
- **Dynamic values** — Arbitrary value syntax (`bg-[#hex]`, `text-[clamp(...)]`) for values not in the theme. Inline `style={{}}` only for truly dynamic runtime values (computed animation delays, data-driven progress bar widths).
- **Vite plugin** — `@tailwindcss/vite` configured in `vite.config.ts`.
