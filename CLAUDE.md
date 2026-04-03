# CLAUDE.md

## North Star

**Trellis** is the navigation layer for Canada's agtech ecosystem. It answers the question every founder and operator asks: "What's out there for someone like me?"

- **Live:** https://trellisag.ca
- **Repo:** `justyn-coder/CDNAgInnovator`
- **Domain:** trellisag.ca (Vercel)
- **Solo founder/builder:** Justyn

### Two personas, one platform

**Founders** (pre-revenue to early commercial) answer 4 wizard questions and get a personalized pathway of programs matched to their stage, province, and need. They can browse the full database, chat with AI, and get step-by-step guidance.

**Operators** (accelerator managers, program officers, investors) see ecosystem signals, coverage gaps, and strategic analysis. They browse programs, explore the gap matrix, and ask analytical questions about the landscape.

Every feature, every prompt, every design decision serves one of these two personas. If it doesn't clearly serve one, question whether it belongs.

## Constraints

1. **Protect the live site.** Trellis is live and being shared with real operators. After any push: hard refresh, verify APIs, check DB queries. Never push code that breaks the live experience.
2. **Data accuracy is credibility.** Program names must match the database exactly. Dollar figures must be verifiable. If the AI recommends a dissolved program or misspells a name, an operator loses trust. Accuracy is not polish, it is the product.
3. **Revenue proximity drives priority.** Operator partnerships are the path to revenue. Features that make the operator experience more compelling come before features that are technically interesting.
4. **Don't over-engineer.** This is a solo founder's product. Constants files over database tables. Inline components over abstraction layers. Ship the simplest thing that works.
5. **Proactively guide, don't just execute.** Justyn is a founder, not a developer. Suggest better approaches, flag suboptimal directions, push back on big asks with clear reasoning. But for straightforward tasks, just do the work.
6. **Never edit files that belong to a different repo.** Tally, BIS, and Trellis share patterns but have separate codebases. Reference, don't modify.

## Quick Start

```bash
npm run dev          # Vite dev server (frontend only, no API)
npm run build:client # Production build
```

Every push to `main` triggers Vercel auto-deploy.

**Vercel project:** `prj_syYoTawrNveXB409UwiMoVL1kGom`, team `team_FD5taAPjMuuZW21iA0OqmoB1`
**IGNORE** old project `ag-innovator` / `AgInnovator` (`prj_1Dtt3WvFO2TR9UiOzFEjGPFg3WpG`)

## Stack

| Layer | Tech |
|-------|------|
| Frontend | React 19 + TypeScript + Vite (SPA) |
| Backend | Vercel serverless functions (`api/` directory) |
| Database | Supabase Postgres, project `slttpknnuthbttjuzrnz` (ca-central-1) |
| AI | Anthropic Claude API (Sonnet 4, `claude-sonnet-4-20250514`) |
| Routing | wouter |
| ORM | drizzle-orm (schema definition only, most queries use raw `postgres` client) |
| Email | nodemailer (Gmail SMTP for feedback notifications) |
| Styling | Tailwind CSS v4 (`@tailwindcss/vite`), `clsx`. DM Serif Display headings, warm amber/gold palette |

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
| [`agent_docs/api-patterns.md`](agent_docs/api-patterns.md) | Every API route: inputs, outputs, system prompts, query logic |
| [`agent_docs/database-schema.md`](agent_docs/database-schema.md) | Full table schemas, current row counts, common queries |
| [`agent_docs/requirements.md`](agent_docs/requirements.md) | Known issues, fix queue, feature backlog in priority order |

## Key Conventions

- **Commit style:** Imperative, concise. `Fix Atlantic province mapping in pathway API`
- **Build order:** Logic then UI then AI. Define what counts as a gap/output before building the surface, build the surface before wiring AI calls.
- **Batch deploys:** Group related changes into single commits. Don't deploy one file at a time.
- **Test after deploy:** Hard refresh (`Cmd+Shift+R`) on trellisag.ca.
- **Design language:** Apple-esque polish, DM Serif Display headings, warm amber/gold accents, card-based layouts, generous whitespace. Tailwind utility classes throughout, use `cn()` from `client/src/lib/cn.ts` for conditional styling.

## Security

Justyn is not a security engineer. Claude must proactively protect the system.

**Before adding any new API route or endpoint:**
- Does it need auth? If it calls a paid API (Anthropic) or writes to a database, it MUST have auth or rate limiting. No exceptions.
- Does it expose credentials? Never put API keys, secrets, or Supabase service role keys in client-side code or public repos.
- Does it accept user input? Validate and sanitize. SQL injection via `sql.unsafe()` is a real risk.

**Current protection status (update when changes are made):**
- `/api/chat`, `/api/pathway`, `/api/gaps/explain` call Anthropic API. Rate limited.
- `/api/submissions` writes to DB + sends email. Needs rate limiting.
- `/api/groomer` protected by ADMIN_SECRET/CRON_SECRET.
- `/api/admin/feedback` protected by ADMIN_SECRET.
- `/api/pathway` has `maxDuration: 30` for retry logic.

**When building new features, ask:** "If someone found this URL and hit it 10,000 times, what happens?" If the answer involves money or data loss, add protection first.
