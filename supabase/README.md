---
title: Trellis Supabase migrations
status: ACTIVE
last_updated: 2026-07-04 11:15 EST
version: v1
---

# Trellis Supabase migrations

Migrations for the Trellis-standalone Supabase project `xzglgidmmuepaakmlpqd` (ca-central-1). Applied via the Supabase MCP `apply_migration` tool on 2026-07-04. Timestamps in filenames match the recorded `version` values in the project's `supabase_migrations.schema_migrations` table.

## History

| File | Purpose |
|---|---|
| `20260704150916_install_pg_trgm.sql` | Install `pg_trgm` in `extensions` schema for `programs_name_trgm_idx` |
| `20260704150931_trellis_trigger_functions.sql` | `cleanup_rate_limits()` + `update_contacts_updated_at()` |
| `20260704151115_trellis_baseline_schema.sql` | 19 tables + sequences + PKs + FKs + indexes + triggers + RLS (as `pg_dump --schema-only` from source project on migration day) |

## Background

Trellis originally shared Supabase project `slttpknnuthbttjuzrnz` with Tally HQ, BIS/ShowRev, Inorsa, and other subsystems (~185 tables, 190 migrations, none checked in). On 2026-07-04 Trellis moved to its own project. This directory is the fresh baseline — no history from the shared project follows.

For the full migration record see [`canon/supabase-migration-plan-2026-07-04.md`](../canon/supabase-migration-plan-2026-07-04.md).

## Adding future migrations

Two options.

**Manual via MCP** (what we've done so far): apply via `mcp__supabase__apply_migration`, then hand-write a matching `.sql` file here with the same version-timestamp used by Supabase. Version-timestamp format is `YYYYMMDDHHMMSS`.

**Supabase CLI** (recommended once the CLI is wired): `supabase migration new <name>` generates a timestamped file, then `supabase db push` applies. Requires `supabase link --project-ref xzglgidmmuepaakmlpqd` first.

## Do not edit historical files

Once a migration is applied, don't edit its file. Add a new migration to change schema.

## Version history

| Version | Date (EST) | Author | Change |
|---|---|---|---|
| v1 | 2026-07-04 11:15 | Claude | Initial. Three migrations mirroring the standalone-project bootstrap. |
