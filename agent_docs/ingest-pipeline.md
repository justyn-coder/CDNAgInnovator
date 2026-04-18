# LinkedIn Capture Pipeline — Implementation Notes

**Spec:** `trellis/specs/linkedin-capture-pipeline-v1.0` (Supabase `wiki_docs`)
**Status:** Phase 1 build complete. Deploys behind `INGEST_ENABLED=false` flag.

## What's live in code

| Path | Purpose |
|---|---|
| `api/_lib/ingest/types.ts` | Shared types + canonical-data schema |
| `api/_lib/ingest/linkedin-normalize.ts` | URL/handle normalization + idempotency key |
| `api/_lib/ingest/firecrawl.ts` | Scrape + search wrapper (graceful degrade without API key) |
| `api/_lib/ingest/classifier.ts` | Four-way Claude classifier with 20 few-shot examples |
| `api/_lib/ingest/dedup.ts` | Program dedup cascade (exact → domain → normalized → trigram) |
| `api/_lib/ingest/people-upsert.ts` | Author/mentioned-person upsert with history tracking |
| `api/_lib/ingest/pipeline.ts` | Orchestration: classify → upsert people → route to target table |
| `api/ingest/linkedin.ts` | POST endpoint with auth, idempotency, rate limits |
| `api/admin/captures/retry-queued.ts` | 15-min cron; reprocesses stuck captures, caps retries at 3 |
| `api/admin/captures/digest.ts` | Daily 7am ET digest email |
| `api/admin/captures/weekly-metrics.ts` | Monday 8am ET weekly metrics + drift sampling |
| `scripts/ingest-tests/*` | Golden set + runners (classifier / E2E / endpoint / crons) |

## Test results (this build)

- **Classifier on golden set:** 20/20 (100%)
- **E2E pipeline (insert → classify → route → side-effects):** 20/20 (100%)
- **Dedup (seeded + captured):** correct merge
- **Endpoint (auth, body, idempotency):** 5/5
- **Cron smoke tests:** 6/6

Runners:

```bash
source .env.local
npx tsx scripts/ingest-tests/run-classifier.ts   # classifier accuracy
npx tsx scripts/ingest-tests/run-e2e.ts          # full pipeline + dedup
INGEST_SECRET=... INGEST_ENABLED=true npx tsx scripts/ingest-tests/run-endpoint.ts
npx tsx scripts/ingest-tests/run-crons.ts        # cron smoke
```

## Deployment (required before this goes live)

### 1. Environment variables (Vercel, prod)

```
INGEST_SECRET             # min 32 bytes random. Used by iOS Shortcut + endpoint auth.
INGEST_CLASSIFIER_MODEL   # default "claude-sonnet-4-6" — pin here for rotation control
INGEST_ENABLED            # "false" to start; flip to "true" after iOS Shortcut is ready
FIRECRAWL_API_KEY         # enables richer post content extraction; pipeline degrades without it
PEOPLE_EXCLUSION_HANDLES  # optional; comma-separated LinkedIn handles to skip (e.g. own handle)
```

Already configured in the project: `POSTGRES_URL`, `ANTHROPIC_API_KEY`, `CRON_SECRET`, `ADMIN_SECRET`, `GMAIL_USER`, `GMAIL_APP_PASSWORD`, `NOTIFY_EMAIL`.

### 2. Database migration

Already applied to Supabase project `slttpknnuthbttjuzrnz` (2026-04-18):

- New tables: `captures`, `people` (both RLS-enabled, service-role only)
- New function: `set_updated_at()` + triggers on both tables
- New indexes: 15 across both tables, including trigram GIN on `people.name`, `people.organization`, `programs.name`

Verify:

```sql
SELECT COUNT(*) FROM captures; -- should be 0 or low
SELECT COUNT(*) FROM people;   -- should be 0 or low
```

### 3. iOS Shortcut ("Send to Trellis")

Steps for Justyn to build (5 minutes):

1. Open the Shortcuts app. Tap `+` → new Shortcut named "Send to Trellis".
2. Settings (tap the gear): enable "Show in Share Sheet". Allow types: URLs, Text, Images.
3. Actions (in order):
   1. **Get URLs from Shortcut Input** (Receive URLs from Share Sheet)
   2. **Get Text from Shortcut Input** (Receive Text from Share Sheet)
   3. **Dictionary** — key `source_url` → magic-variable `URLs` (first item). Key `raw_text` → `Text`. Key `captured_by` → `justyn`.
   4. **Get Contents of URL**
      - URL: `https://trellisag.ca/api/ingest/linkedin`
      - Method: POST
      - Headers: `Authorization` = `Bearer <INGEST_SECRET>`, `Content-Type` = `application/json`
      - Request Body: JSON → use the Dictionary
   5. **If** result has `capture_id` → **Show Notification** "Captured ✓"; else **Show Notification** "Trellis error: [status]"

After building, test once from LinkedIn's native Share → Send to Trellis on any post.

### 4. Cron verification

`vercel.json` already registers the three cron schedules. After deploy, confirm at `vercel.com/<team>/<project>/crons`:

- `/api/admin/captures/retry-queued` every 15 min
- `/api/admin/captures/digest` at `0 11 * * *` (7am ET = 11am UTC)
- `/api/admin/captures/weekly-metrics` Mondays at `0 12 * * 1` (8am ET = 12pm UTC)

### 5. Go-live sequence

1. Deploy with `INGEST_ENABLED=false` (current default). Crons will run against an empty dataset — no-op.
2. Build iOS Shortcut. Test with a single LinkedIn post via curl first:
   ```bash
   curl -X POST https://trellisag.ca/api/ingest/linkedin \
     -H "Authorization: Bearer $INGEST_SECRET" \
     -H "Content-Type: application/json" \
     -d '{"source_url":"https://www.linkedin.com/posts/test","author_name":"Test","raw_text":"FCC AgriSpirit Fund announcement","captured_by":"justyn"}'
   ```
   Should return 503 (`INGEST_ENABLED off`) — good.
3. Flip `INGEST_ENABLED=true`. Re-run the curl. Should return 202.
4. Review the capture: Claude Code → "review Trellis captures".
5. Test the iOS Shortcut on a real LinkedIn post.
6. Monitor: first-day digest at 7am ET will summarize.

## Review flow (Claude Code, Phase 1)

At any time Justyn can say "review Trellis captures" and Claude should:

```sql
SELECT id, classification, classification_confidence, classification_reasoning,
       source_url, canonical_data, target_table, target_id
FROM captures
WHERE decision = 'pending_review'
ORDER BY captured_at DESC
LIMIT 20;
```

Then per row, show canonical_data and offer approve / edit / reject / merge. Actions:

- **Approve program** → promote `canonical_data.program` to a `programs` row. Update capture: `decision='auto_added'`, `target_table='programs'`, `target_id=<new>`, `reviewed_by='justyn'`, `reviewed_at=now()`.
- **Approve knowledge** → INSERT INTO knowledge from `canonical_data.knowledge`. Same capture update pattern.
- **Merge** → set decision='duplicate_merged', target points to the chosen existing row.
- **Reject** → decision='rejected', review_notes required.

## Known limitations (Phase 1)

1. **Image/screenshot ingestion:** endpoint accepts `image_base64` and passes to the classifier, but the capture row doesn't store the image. Vision classification happens inline; if it times out and the retry cron picks up the row, the image is gone. Phase 1.5 fix: Supabase Storage bucket for images.
2. **No web review UI.** Justyn reviews via Claude Code. Digest email is plain text, approval requires opening a Code session.
3. **No Chrome Extension button.** Desktop capture is manual (curl or copy URL, use iOS Shortcut via Mac share if enabled).
4. **No signed digest links.** Review is Code-only for now.
5. **LinkedIn scraping is not attempted.** We only process posts Justyn explicitly captures.

## Phase 2 pointers

- `captures` and `people` remain internal-only. **Never** add a public route that reads from them without an explicit consent-wrap first.
- `saved_journeys.email` is the seed for returning-founder personalization. The existing wizard copy ("Your information stays with you. We never share your data with programs or third parties.") covers the internal-use case but not public-directory exposure.
- `people.contact_id` links to the existing `contacts` CRM. When Justyn promotes someone via manual review, set both `people.status='promoted_to_contact'` and `contacts.*` fields.
