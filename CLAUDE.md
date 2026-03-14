# CLAUDE.md

## What This Is

**CDNAgInnovator** — AI-powered Canadian agtech ecosystem navigator. Matches founders to programs (accelerators, funding, pilot sites, events, industry orgs) based on stage, province, and need. Also serves ecosystem operators (accelerator managers, program officers, investors) analyzing coverage gaps.

- **Live:** https://cdn-ag-innovator.vercel.app
- **Repo:** `justyn-coder/CDNAgInnovator`
- **Local:** `~/Documents/GitHub/CDNAgInnovator`
- **Solo founder/builder:** Justyn

## Quick Start

```bash
npm run dev          # Vite dev server (frontend only, no API)
npm run build:client # Production build
vercel dev           # Full local dev with API functions
```

## Stack

| Layer | Tech |
|-------|------|
| Frontend | React 19 + TypeScript + Vite (SPA) |
| Backend | Vercel serverless functions (`api/` directory) |
| Database | Supabase Postgres — project `slttpknnuthbttjuzrnz` (ca-central-1) |
| AI | Anthropic Claude API (Sonnet 4 — `claude-sonnet-4-20250514`) |
| Routing | wouter |
| ORM | drizzle-orm (schema definition only — most queries use raw `postgres` client) |
| Email | nodemailer (Gmail SMTP for feedback notifications) |
| Styling | Tailwind CSS v4 (`@tailwindcss/vite`), `clsx` for conditional classes. DM Serif Display headings, warm amber/gold palette |

## Deploy Workflow

**Claude cannot push to GitHub from the container** (no credentials). Instead:
1. Create a `git format-patch` file, OR create files in `~/Downloads/fixes/` with a `deploy.sh` script
2. Present the patch/files to the user
3. User applies with `git apply` + `git push` from VS Code terminal, OR runs `bash ~/Downloads/fixes/deploy.sh`

Every push to `main` triggers Vercel auto-deploy.

**Vercel project:** `prj_syYoTawrNveXB409UwiMoVL1kGom`, team `team_FD5taAPjMuuZW21iA0OqmoB1`
**IGNORE** old project `ag-innovator` / `AgInnovator` (`prj_1Dtt3WvFO2TR9UiOzFEjGPFg3WpG`)

## Environment Variables

```
POSTGRES_URL / DATABASE_URL   # Direct Postgres connection (used by all API routes)
SUPABASE_URL                  # Supabase project URL
SUPABASE_SERVICE_ROLE_KEY     # Supabase service role key (not anon)
ANTHROPIC_API_KEY             # Claude API key
ADMIN_SECRET                  # Bearer token for /api/admin/feedback
GMAIL_USER                    # Gmail address for feedback email notifications
GMAIL_APP_PASSWORD            # Gmail app password for SMTP
NOTIFY_EMAIL                  # Recipient for feedback notifications
```

## Deeper Docs

| Doc | Contents |
|-----|----------|
| [`agent_docs/architecture.md`](agent_docs/architecture.md) | File tree, component map, dual-mode UI, data flow diagrams |
| [`agent_docs/api-patterns.md`](agent_docs/api-patterns.md) | Every API route — inputs, outputs, system prompts, query logic |
| [`agent_docs/database-schema.md`](agent_docs/database-schema.md) | Full table schemas, current row counts, common queries |
| [`agent_docs/requirements.md`](agent_docs/requirements.md) | Known issues, fix queue, feature backlog in priority order |

## Key Conventions

- **Commit style:** Imperative, concise. `Fix Atlantic province mapping in pathway API`
- **Build order:** Logic → UI → AI. Define what counts as a gap/output before building the surface, build the surface before wiring AI calls.
- **Batch deploys:** Group related changes into single commits. Don't deploy one file at a time.
- **Test after deploy:** Hard refresh (`Cmd+Shift+R`) on live URL.
- **Design language:** Apple-esque polish, DM Serif Display headings, warm amber/gold accents, card-based layouts, generous whitespace. Tailwind utility classes throughout — use `cn()` from `client/src/lib/cn.ts` for conditional styling.
