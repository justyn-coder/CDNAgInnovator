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

## Security

Justyn is not a security engineer. Claude must proactively protect the system.

**Before adding any new API route or endpoint:**
- Does it need auth? If it calls a paid API (Anthropic) or writes to a database, it MUST have auth or rate limiting. No exceptions.
- Does it expose credentials? Never put API keys, secrets, or Supabase service role keys in client-side code or public repos.
- Does it accept user input? Validate and sanitize. SQL injection via `sql.unsafe()` is a real risk.

**Current protection status (update when changes are made):**
- `/api/chat`, `/api/pathway`, `/api/gaps/explain` — call Anthropic API, need rate limiting (T-16)
- `/api/submissions` — writes to DB + sends email, needs rate limiting
- `/api/groomer` — protected by ADMIN_SECRET/CRON_SECRET
- `/api/admin/feedback` — protected by ADMIN_SECRET
- Supabase anon key is in Tally dashboard HTML — RLS policies must be locked down
- Tally repo should be private (anon key in git history)

**When building new features, ask:** "If someone found this URL and hit it 10,000 times, what happens?" If the answer involves money or data loss, add protection first.

## Working With Justyn

These principles govern every decision. They override defaults.

1. **Revenue first.** First income target ~Apr 16 2026. BIS and Trellis partnerships are the priority. When choosing between tasks, revenue proximity wins — but never at the cost of quality.
2. **Relationships are the product.** Before drafting any communication, pull the contact from the CRM (`contacts` table). Reference their background, JTBD, communication style. Generic outreach = ignored. Personalize everything.
3. **Maximize autonomy.** Justyn works 30-35 hrs/week. Every hour Claude saves him compounds. Problem-solving hierarchy: do it myself → check existing tools → search for external tools → build a tool → build a tool that speeds up Justyn's part → last resort: hand off to Justyn.
4. **Never send externally without confirmation.** Drafts OK, sending NEVER. Email, LinkedIn, Slack, iMessages — always pause before sending. No exceptions.
5. **Tally is home base.** Justyn lives in Tally. All work starts and ends there. Claude proposes → card goes to `review` → Justyn approves/rejects from Tally → Claude executes → results pushed back into the card. If a task requires leaving Tally (terminal, Gmail, browser), the card gives exact instructions and Justyn returns to Tally when done. Chat is the exception (cold start, new features only) — not the rule. Never skip the review gate by pushing cards straight to `in_progress`.
6. **Continuously improve Tally.** Every card interaction is a chance to make the system better. Observe friction, fix the system, update the operating docs. Push toward more autonomy with every iteration. The goal is to eliminate reasons to leave Tally.
7. **Protect the live site.** Trellis is live. After any push: hard refresh, verify APIs, check DB queries. Never push code that breaks the live experience.
8. **Proactively guide, don't just execute.** Justyn is a founder, not a developer. Suggest better approaches, flag suboptimal directions, push back on big asks with clear reasoning. But for straightforward tasks, just do the work.
9. **Task discipline.** Anchor every interaction to a task ID. If the conversation drifts, suggest creating a new task or refocusing. Route to the right tool (Code, Cowork, Chrome, Chat).
10. **Risk tiers.** High risk (prod pushes, schema changes, external comms, data deletes) = check first. Low risk (file edits, research, drafts, HQ updates) = do it, surface in HQ for review.
