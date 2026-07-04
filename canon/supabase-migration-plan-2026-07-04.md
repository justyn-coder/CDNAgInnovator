---
title: Trellis Supabase migration plan (shared → standalone)
status: DRAFT
last_updated: 2026-07-04 10:49 EST
version: v1
---

# Trellis → standalone Supabase project: migration plan

**Author:** Claude
**Date:** 2026-07-04
**Trigger:** Trellis currently shares Supabase project `slttpknnuthbttjuzrnz` with Tally HQ, BIS/ShowRev v2, Inorsa pilot, CoS routing, Nightingale, ABC, portal, and ~10 other subsystems. ~185 total tables. Only ~19 belong to Trellis. Operator asked to move Trellis to its own project so the shared DB stops being the Trellis dumping ground.

**Key finding:** No edge functions belong to Trellis. All 10 deployed edge functions serve other projects. Trellis is pure Vercel serverless (`api/`) — nothing to migrate on the functions side.

---

## Table 1 — What actually belongs to Trellis (code-confirmed)

Confirmed by grepping `api/`, `client/`, `scripts/` for `FROM <table>` / `.from('<table>')` patterns, cross-referenced against [api/schema.ts](../api/schema.ts) and [agent_docs/database-schema.md](../agent_docs/database-schema.md).

**19 tables, ~3 MB total, ~985 rows of real data.**

| Group | Table | Rows | Size | Notes |
|---|---|---|---|---|
| Core | `programs` | 504 | 1864 kB | Program directory (agent_docs schema doc lags — actually 50 cols, not the ~30 documented) |
| Core | `knowledge` | 171 | 472 kB | Ecosystem intelligence entries |
| Core | `submissions` | 108 | 80 kB | Feedback + program submissions |
| CRM | `contacts` | 92 | 304 kB | Mini-CRM |
| CRM | `interactions` | 50 | 104 kB | Touch log FK contacts |
| Journey | `saved_journeys` | ~0 | 112 kB | UUID PK, defaults from `uuid_generate_v4()` |
| Journey | `journey_interests` | ~0 | 80 kB | |
| Journey | `trellis_personas` | ~0 | 80 kB | |
| Journey | `gap_explanations` | ~0 | 16 kB | Chat gap-explain cache |
| Analytics | `page_views` | ~0 | 32 kB | Lightweight traffic |
| Ancillary | `agtech_companies` | ~0 | 32 kB | |
| Ancillary | `rate_limits` | 1 | 80 kB | API rate-limit state |
| Portal | `portal_orgs` | ~0 | 32 kB | Per-org config |
| Portal | `portal_people` | 12 | 64 kB | |
| Portal | `portal_access_log` | 48 | 104 kB | |
| Portal | `portal_feedback` | ~0 | 48 kB | |
| Portal | `portal_feedback_replies` | ~0 | 24 kB | |
| Portal | `portal_feature_requests` | ~0 | 160 kB | |
| Portal | `portal_priority_votes` | ~0 | 16 kB | |

**Sign-off needed on this list before Phase 1.**

**Notable non-Trellis tables that also share the shared project (do NOT move):**
- `hq_*`, `task_log`, `task_executions`, `wiki_docs`, `dispatch_queue`, `deploy_events`, `deliverables`, `wellness_breaks`, `morning_briefs`, `preflight_checklist`, `operating_procedure`, `tool_capabilities`, `session_rollups` — Tally HQ / CoS
- `sr_*` (28 tables), `bis_*`, `showrev_playbook_tactics`, `fiber_operator_directory`, `fcc_bdc_*` — BIS / ShowRev v2
- `pilot_*`, `m_inorsa_*`, `orchestrator_*`, `chassis_*`, `pipeline_states`, `research_runs` — Inorsa pilot
- `abc_*` — AI Brunch Club
- `abm_*`, `angle_selections`, `email_reviews`, `publish_queue`, `variant_test_*` — ABM vetting
- `companies`, `attendees`, `entity_aliases`, `enrichment_events`, `companies_audit_log` — companies dual-write
- `nightingale_*`, `governance_*`, `capabilities`, `patterns`, `capability_*`, `cos_*`, `estimate_log`, `neural_patterns`, `memory_integrity_log` — governance infra

---

## Table 2 — DB objects that move with the tables

- Function `update_contacts_updated_at()` — trigger for `contacts.updated_at`
- Any trigger on `contacts` referencing that function
- `moddatetime` triggers if present on other tables
- Sequences behind `serial` PKs on `programs`, `submissions`, `knowledge`, `contacts`, `interactions`, `page_views` (auto-included in `pg_dump`)
- UUID defaults on `saved_journeys.id` and `saved_journeys.token` (need `uuid-ossp` on target)

## Table 3 — Extensions needed on new project

Currently installed on shared project (all schemas). New project needs only:

| Extension | Reason | Priority |
|---|---|---|
| `plpgsql` | Default, always present | auto |
| `uuid-ossp` | `saved_journeys.id`, `saved_journeys.token` defaults | required |
| `pgcrypto` | Belt-and-suspenders for UUID / crypto | required |
| `unaccent` | Text search on programs (if used — verify in code) | verify |
| `pg_trgm` | Fuzzy match on program names | verify |

**Not needed on new project:** `pgvector`, `pg_cron`, `pg_net`, `supabase_vault`, `pgmq`, `postgis*` — those serve ShowRev / HQ / governance. Fewer extensions = smaller attack surface + cleaner project.

## Table 4 — Edge functions inventory (none migrate)

All 10 deployed edge functions on the shared project serve non-Trellis projects. Confirmed 2026-07-04:

| Function slug | Owner | Migrates? |
|---|---|---|
| `quick-intake` | Tally HQ | no |
| `share` | Tally HQ | no |
| `upload-deliverable` | Tally HQ | no |
| `cos-revert` | CoS routing | no |
| `cos-human-action` | CoS routing | no |
| `nightingale-insert` | Governance | no |
| `embed-substrate` | ShowRev v2 | no |
| `search-substrate` | ShowRev v2 | no |
| `sr-hubspot-webhook-handler` | ShowRev v2 | no |
| `sr-hubspot-polling-worker` | ShowRev v2 | no |

Trellis runs entirely on Vercel serverless functions under [`api/`](../api/). No Supabase edge function work needed.

---

## Migration plan — 7 phases with gates

### Phase 0 — Pre-flight (30 min, no changes)

1. Ratify this doc; move `status: DRAFT` → `status: ACTIVE`, bump to v2.
2. Grep the whole repo for hard-coded project ref `slttpknnuthbttjuzrnz` — replace-in-config candidates. Any `.env*` file, any script.
3. Snapshot current Vercel env vars: `vercel env pull .env.vercel-backup-2026-07-04`.
4. Confirm no external consumers (webhooks, cron jobs outside this repo, other repos' scripts, extensions installed elsewhere) hit the 19 Trellis tables.

**Gate:** operator sign-off on the 19-table list in Table 1.

### Phase 1 — Provision new Supabase project

1. Create new project via MCP `create_project`. Suggested name: `trellis`. Region: `ca-central-1` (matches current, matches trellisag.ca traffic).
2. Save new project ID, connection string, and service role key to a scratchpad note (not committed).
3. Install extensions on new project: `uuid-ossp`, `pgcrypto`. Verify `unaccent` and `pg_trgm` need by grepping code first (if grep hits `similarity(`, `unaccent(`, `%` operators on text, install them).
4. Confirm new project is reachable via `psql <new-conn> -c 'SELECT 1'`.

**Gate:** new project reachable and empty.

### Phase 2 — Schema-only replication (dry run, no data)

1. Schema-only dump from shared project, restricted to the 19 tables:

```bash
pg_dump --schema-only --no-owner --no-acl --schema=public \
  --table=public.programs --table=public.saved_journeys \
  --table=public.submissions --table=public.knowledge \
  --table=public.contacts --table=public.interactions \
  --table=public.trellis_personas --table=public.journey_interests \
  --table=public.gap_explanations --table=public.agtech_companies \
  --table=public.rate_limits --table=public.page_views \
  --table=public.portal_orgs --table=public.portal_people \
  --table=public.portal_access_log --table=public.portal_feedback \
  --table=public.portal_feedback_replies --table=public.portal_feature_requests \
  --table=public.portal_priority_votes \
  <shared-conn-string> > trellis-schema.sql
```

2. Manually dump the `update_contacts_updated_at()` function definition (pg_dump with `--table` skips functions):

```sql
SELECT pg_get_functiondef(oid) FROM pg_proc
WHERE proname = 'update_contacts_updated_at';
```

Append the returned CREATE FUNCTION + associated CREATE TRIGGER lines to `trellis-schema.sql`.

3. Inspect `trellis-schema.sql` for:
   - Foreign keys pointing at non-Trellis tables (would break the dump — need to drop or scope-in the referenced table).
   - Sequences named for the tables (auto-included, verify).
   - Indexes (auto-included).
   - RLS policies referencing users/roles that don't exist yet on the new project (may need to drop policies here and re-add via Supabase Studio, or scope them out and re-create later).

4. Apply `trellis-schema.sql` to new project: `psql <new-conn> < trellis-schema.sql`.

5. Verify all 19 tables + fn + triggers landed via `\dt` and `\df` in psql.

**Gate:** `pg_dump --schema-only` diff between shared and new projects for these 19 tables should be zero (except FK/RLS resolutions from step 3).

### Phase 3 — Data copy (dry run first, on empty target)

1. Data-only dump per table:

```bash
for t in programs saved_journeys submissions knowledge contacts interactions \
         trellis_personas journey_interests gap_explanations agtech_companies \
         rate_limits page_views portal_orgs portal_people portal_access_log \
         portal_feedback portal_feedback_replies portal_feature_requests portal_priority_votes; do
  pg_dump --data-only --table=public.$t --column-inserts <shared-conn> > data-$t.sql
done
```

`--column-inserts` protects against column-order drift.

2. Apply to new project in FK-safe order: parents first.
   - Group A (no FKs): `programs`, `knowledge`, `submissions`, `agtech_companies`, `rate_limits`, `page_views`, `gap_explanations`, `saved_journeys`, `journey_interests`, `trellis_personas`, `portal_orgs`
   - Group B (FK on Group A): `contacts` (if references anything), `portal_people` (FK to `portal_orgs`)
   - Group C: `interactions` (FK to `contacts`), `portal_access_log`, `portal_feedback`, `portal_feature_requests`, `portal_priority_votes` (FK to `portal_people`/`portal_orgs`)
   - Group D: `portal_feedback_replies` (FK to `portal_feedback`)

3. Reset sequences for `serial` PKs:

```sql
SELECT setval(pg_get_serial_sequence('public.programs', 'id'), (SELECT MAX(id) FROM public.programs));
SELECT setval(pg_get_serial_sequence('public.submissions', 'id'), (SELECT MAX(id) FROM public.submissions));
SELECT setval(pg_get_serial_sequence('public.knowledge', 'id'), (SELECT MAX(id) FROM public.knowledge));
SELECT setval(pg_get_serial_sequence('public.contacts', 'id'), (SELECT MAX(id) FROM public.contacts));
SELECT setval(pg_get_serial_sequence('public.interactions', 'id'), (SELECT MAX(id) FROM public.interactions));
SELECT setval(pg_get_serial_sequence('public.page_views', 'id'), (SELECT MAX(id) FROM public.page_views));
-- Add for any other serial PKs discovered in Phase 2 inspection
```

4. Verify:
   - Row counts match old for each table.
   - 10-row spot check per critical table (`programs`, `knowledge`, `contacts`).
   - `SELECT nextval(...)` on each sequence returns MAX(id)+1.

**Gate:** row-count parity per table + spot-check pass.

### Phase 4 — Staging deploy (no prod cutover yet)

1. Vercel preview environment: set env vars pointing at new project.
   - `POSTGRES_URL`, `DATABASE_URL` → new pooler URL
   - `SUPABASE_URL` → new project URL
   - `SUPABASE_SERVICE_ROLE_KEY` → new service key
2. Deploy current branch to preview (`vercel --no-prod`).
3. Test the 8 critical flows against preview URL:
   1. Home page loads, programs render.
   2. Navigator wizard runs end-to-end, generates a pathway (`/api/pathway`).
   3. Chat works, calls Anthropic + queries `knowledge` (`/api/chat`).
   4. Gap explain works (`/api/gaps/explain`).
   5. Feedback submission writes to `submissions` and sends email (`/api/submissions`).
   6. Portal `/for/:slug/:person` loads (`portal_orgs`, `portal_people`, `portal_access_log`).
   7. Admin feedback endpoint returns (`/api/admin/feedback` with `ADMIN_SECRET`).
   8. Rate limits fire under load (`rate_limits` writes).

**Gate:** all 8 flows pass on preview. Any bugs get fixed against new project only.

### Phase 5 — Prod cutover

1. Announce brief writable-freeze (~15 min). Solo site, low traffic — likely no user-facing impact.
2. Re-run data-only dump on shared project to capture deltas since Phase 3:

```bash
# Only tables that could have received writes: submissions, saved_journeys, portal_access_log,
# portal_feedback, portal_feature_requests, portal_priority_votes, interactions, contacts, page_views
```

3. Apply deltas to new project. Consider `INSERT ... ON CONFLICT DO NOTHING` if IDs collide (rare with `--column-inserts`, but possible).
4. Reset sequences again.
5. Swap Vercel prod env vars → new project.
6. Trigger prod redeploy: `vercel deploy --prod` or push a trivial commit.
7. Hard-refresh trellisag.ca. Walk the 8 flows on live within 15 min.
8. Watch Vercel logs and Supabase logs for 2 hours post-cutover.

**Gate:** live site healthy for 24 h before Phase 6.

### Phase 6 — Retire from shared project (destructive, gated)

1. **Wait 7 days** with shared-project tables still present but no longer receiving writes.
2. Verify old tables received no writes in the 7-day window:

```sql
SELECT MAX(created_at) FROM public.programs;
SELECT MAX(created_at) FROM public.submissions;
-- etc, per table with a created_at/updated_at column
```

Any table with writes in the window means Trellis still reads/writes it → cutover incomplete → halt and diagnose.

3. Final `pg_dump` snapshot of the 19 tables from the shared project, archive to `canon/_archive/trellis-tables-pre-drop-YYYY-MM-DD.sql.gz`.
4. Drop the 19 tables from the shared project in reverse-dependency order:

```sql
BEGIN;
DROP TABLE public.portal_feedback_replies CASCADE;
DROP TABLE public.portal_priority_votes CASCADE;
DROP TABLE public.portal_feature_requests CASCADE;
DROP TABLE public.portal_feedback CASCADE;
DROP TABLE public.portal_access_log CASCADE;
DROP TABLE public.portal_people CASCADE;
DROP TABLE public.portal_orgs CASCADE;
DROP TABLE public.interactions CASCADE;
DROP TABLE public.contacts CASCADE;
DROP TABLE public.rate_limits CASCADE;
DROP TABLE public.page_views CASCADE;
DROP TABLE public.agtech_companies CASCADE;
DROP TABLE public.gap_explanations CASCADE;
DROP TABLE public.trellis_personas CASCADE;
DROP TABLE public.journey_interests CASCADE;
DROP TABLE public.saved_journeys CASCADE;
DROP TABLE public.submissions CASCADE;
DROP TABLE public.knowledge CASCADE;
DROP TABLE public.programs CASCADE;
DROP FUNCTION IF EXISTS public.update_contacts_updated_at();
COMMIT;
```

Review `CASCADE` output carefully — any unexpected cascade means a non-Trellis object depended on a Trellis table (unexpected), halt and diagnose.

**Gate:** operator confirms drop. No auto-drop, no MCP-executed drop without explicit yes-in-chat.

### Phase 7 — Update repo, docs, and end the migration-drift risk

1. Update [CLAUDE.md](../CLAUDE.md) Trellis-scoped section: new project ID replaces `slttpknnuthbttjuzrnz`. **Keep** the old ID in the global CLAUDE.md — it's still the `operating_procedure` project.
2. Update [agent_docs/database-schema.md](../agent_docs/database-schema.md) with new project ID.
3. **Check in migration SQL to this repo.** No more "190 migrations lost in Supabase, none in git." Create `supabase/migrations/` and check in the Phase 2 schema dump as `0001_baseline.sql`. From now on, every schema change goes through `supabase migration new <name>` → `supabase db push` → commit. Ends the drift risk permanently.
4. Add `supabase/config.toml`. Wire `supabase link --project-ref <new-id>` for local dev.
5. Update `agent_docs/api-patterns.md` if any API doc references the old project ID.
6. File a `canon/decisions.log` entry: `SUPABASE-STANDALONE-MIGRATION-2026-07-XX`.

---

## Risks + mitigations

| Risk | Mitigation |
|---|---|
| Prod site breaks on cutover | Phase 4 staging catches this before Phase 5 |
| Data loss in delta window | Phase 5 delta dump + writable-freeze |
| Missed table dependency (FK to non-Trellis table) | Phase 2 schema-only dry-run catches broken FKs before data phase |
| Old shared project still gets writes after cutover | 7-day dark period + write-log check in Phase 6 |
| Sequences out of sync (dup PK on next insert) | Explicit `setval` in Phases 3 and 5 |
| No rollback if cutover fails | Old tables preserved for 7 days; revert Vercel env vars = instant rollback |
| Hard-coded project ID in code | Phase 0 grep sweep |
| RLS policies reference roles not on new project | Phase 2 step 3 catches; drop or recreate in Studio |
| Extension needed but not installed | Phase 1 step 3 verifies against grep of code |

---

## Rollback procedure (if Phase 5 goes wrong)

1. Revert Vercel prod env vars to shared-project values (kept in `.env.vercel-backup-2026-07-04`).
2. Trigger prod redeploy (or Vercel auto-detects env change).
3. Live site now hitting shared project again. Data written to new project during broken window is a delta — dump it and merge into shared project.
4. Diagnose failure. Do not retry Phase 5 until root cause found and Phase 4 re-run.

---

## Open questions for operator

1. **Sign-off on the 19-table list** in Table 1 — any tables you disagree with?
2. **New project name** — `trellis` fine, or something else?
3. **Approval to create the new Supabase project** via MCP when ready (free tier, no cost).
4. **Portal ownership check:** are `portal_*` tables truly Trellis-only, or does BIS partner-portal use them too? If BIS uses them, they stay in the shared project.
5. **Cutover window preference:** low-traffic hours (Sun morning EDT?) or fire-when-ready?

---

## Version history

| Version | Date (EST) | Author | Change |
|---|---|---|---|
| v1 | 2026-07-04 10:49 | Claude | Initial draft. Trellis-owned table list, edge-function inventory, 7-phase plan with gates and rollback. |
