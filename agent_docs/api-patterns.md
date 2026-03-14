# API Patterns

All API routes are Vercel serverless functions in the `api/` directory. Each exports a default `handler(req, res)` function. All use the `postgres` client directly (not Drizzle query builder) for database access.

Common connection pattern:
```typescript
const conn = process.env.POSTGRES_URL || process.env.DATABASE_URL || "";
const client = postgres(conn, { ssl: "require", max: 1 });
```

---

## POST /api/pathway

**Purpose:** Generate an AI-powered innovation pathway for a founder based on wizard inputs.

**Input body:**
```json
{
  "description": "I'm building a drone-based crop scouting platform",
  "stage": "MVP",           // Idea | MVP | Pilot | Comm | Scale
  "provinces": ["AB", "SK"], // array of province codes
  "need": "validate-with-farmers"  // see NEED_TO_CATEGORIES mapping below
}
```

**Processing pipeline:**
1. Map `need` → relevant categories via `NEED_TO_CATEGORIES` (e.g., `"validate-with-farmers"` → `["Pilot", "Accel", "Org"]`)
2. Get `STAGE_PRIORITIES` for the stage (e.g., MVP → `["Fund", "Accel", "Pilot", "Event"]`)
3. Merge category sets, query DB for matching programs (province match OR National, stage match OR null stage)
4. Run gap detection: count programs per category for the province/stage combo
5. Identify advisor-channel programs in result set (use_case includes "advisor-channel")
6. Build LLM prompt with: founder profile, stage-specific framing guidance, program list with descriptions/use_cases/URLs, gap summary, advisor-channel programs
7. Call Claude Sonnet (`claude-sonnet-4-20250514`, max_tokens: 2000)
8. Parse JSON response, return pathway + meta

**Atlantic province expansion:** If provinces include "Atlantic", it expands to `["NB", "NS", "PE", "NL"]` before querying. (Known issue: this mapping may not be fully wired — see requirements.md.)

**Output:**
```json
{
  "pathway": {
    "pathway_title": "Your MVP → Pilot Pathway",
    "summary": "One sentence strategy summary",
    "steps": [
      {
        "order": 1,
        "program_name": "Exact program name from DB",
        "program_website": "URL or null",
        "category": "Fund|Accel|Pilot|Event|Org|Train",
        "action": "Imperative action sentence",
        "rationale": "Why this matters for THEIR specific product",
        "timing": "now|next_month|next_quarter|horizon",
        "fit_confidence": "high|medium|exploratory",
        "prepare": "What to have ready + best way in"
      }
    ],
    "gap_warning": "Advisor channel warning if applicable, or null",
    "next_stage_note": "What to think about for next stage"
  },
  "meta": {
    "stage": "MVP",
    "nextStage": "Pilot",
    "provinces": ["AB", "SK"],
    "need": "validate-with-farmers",
    "programsConsidered": 42,
    "gapInfo": { "Fund": 12, "Accel": 3, "Pilot": 2, "Event": 8, "Org": 5, "Train": 1 }
  }
}
```

**Key system prompt features:**
- Date-aware: won't recommend past events/deadlines as current actions
- Product-type awareness: different advice for hardware vs SaaS vs biologicals vs services
- Advisor channel check: flags if pathway lacks CCA/agronomist engagement for MVP+ founders
- Confidence honesty: explicitly told not to mark everything as "high"
- URL discipline: only includes URLs present in program data, never invents them

**Need → Category mapping:**
```
non-dilutive-capital     → Fund, Accel
validate-with-farmers    → Pilot, Accel, Org
structured-program       → Accel, Fund, Train
pilot-site-field-validation → Pilot, Accel, Org
credibility-validation   → Org, Pilot, Event, Accel
first-customers          → Org, Event, Accel, Fund
channel-distribution     → Org, Event, Train
go-to-market             → Org, Event, Fund, Train
growth-capital           → Fund, Accel, Org
industry-connections     → Org, Event, Train, Fund
```

---

## POST /api/chat

**Purpose:** Chat completions for both founder and operator modes.

**Input body:**
```json
{
  "message": "What programs help with field trials in Alberta?",
  "mode": "f",              // "f" (founder) or "ec" (ecosystem operator)
  "history": [              // last 8 messages
    { "role": "user", "content": "..." },
    { "role": "assistant", "content": "..." }
  ]
}
```

**Processing pipeline:**
1. Detect province mentions in message text (maps common names/abbreviations to codes)
2. Query matching programs from DB (province-filtered if detected, otherwise top 50)
3. Extract search terms from message (stopword-filtered)
4. Query `knowledge` table: match on tags overlap with search terms, ordered by match count + confidence, LIMIT 8
5. Build context block: program list + knowledge entries
6. Select system prompt based on mode (`SYSTEM_E` for founder, `SYSTEM_EC` for operator)
7. Call Claude Sonnet with message history + context

**Founder system prompt (`SYSTEM_E`):** Direct, specific. Recommends 3-5 programs with formatted output (### headers, **Category**, **Why**, **Do first**). Includes advisor channel insight for Pilot+ founders.

**Operator system prompt (`SYSTEM_EC`):** Analytical. Surfaces gaps, overlaps, strategic insights. Uses data when available.

**Knowledge retrieval:** Tag-based matching. The `knowledge` table has a `tags` text array. Search terms from the user's message are matched against tags using array overlap (`&&`). Results ordered by match count descending, then confidence, limited to 8.

**Output:**
```json
{
  "reply": "Markdown-formatted response text"
}
```

---

## GET /api/gaps

**Purpose:** Return program counts per Province × Category cell for the gap matrix.

**Query params:**
- `stage` (optional): Filter by stage. "All" or omitted = no stage filter.

**Processing:** Counts programs per province/category combination. Province is unnested from the array column. National programs are counted under "National" row. Stage filter uses array containment.

**Output:**
```json
{
  "matrix": {
    "AB": { "Fund": 12, "Accel": 3, "Pilot": 2, "Event": 8, "Org": 5, "Train": 1 },
    "SK": { ... },
    ...
  }
}
```

---

## POST /api/gaps/explain

**Purpose:** AI-generated narrative explaining why a specific gap exists.

**Input body:**
```json
{
  "province": "SK",
  "category": "Accel",
  "stage": "MVP",
  "count": 0,
  "programs": [],
  "neighboringSummary": "AB has 3 accelerators, MB has 1"
}
```

**Processing:** Builds a context-rich prompt with province name, category label, gap type (complete gap vs weak coverage), neighboring province data. System prompt positions Claude as a Canadian agtech ecosystem analyst who knows the Bioenterprise roundtable findings and provincial ag economies.

**Output:**
```json
{
  "explanation": "3-4 sentence plain English gap narrative"
}
```

---

## GET /api/programs

**Purpose:** List all programs, optionally filtered.

**Query params:**
- `province` (optional): Filter by province code
- `category` (optional): Filter by category
- `stage` (optional): Filter by stage

**Output:** Array of program objects with all columns.

---

## POST /api/submissions

**Purpose:** Store feedback and program submissions.

**Input body:**
```json
{
  "programName": "FEEDBACK: [pathway results]",
  "bestFor": "The actual feedback text",
  "submitterName": "Name",
  "submitterEmail": "email@example.com"
}
```

Feedback entries use `programName` starting with "FEEDBACK" to distinguish from program submissions. Page context is auto-tagged in brackets.

---

## GET /api/admin/feedback

**Purpose:** View all feedback submissions. Authenticated.

**Auth:** Bearer token in `Authorization` header. Token must match `ADMIN_SECRET` env var.

**Response formats:**
- `Accept: text/html` → Rendered HTML table (for browser viewing)
- Otherwise → JSON `{ count, submissions[] }`

**Email notifications:** On new feedback submission, sends email via Gmail SMTP (nodemailer) to `NOTIFY_EMAIL` using `GMAIL_USER` / `GMAIL_APP_PASSWORD` credentials.
