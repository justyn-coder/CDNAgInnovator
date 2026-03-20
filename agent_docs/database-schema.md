# Database Schema

Supabase Postgres — project `slttpknnuthbttjuzrnz` (ca-central-1).

## Tables

### programs (410 rows as of March 18, 2026)

Core directory of Canadian agtech support programs.

| Column | Type | Notes |
|--------|------|-------|
| id | serial PK | Auto-increment |
| name | text NOT NULL | Program name |
| category | text NOT NULL | One of: `Fund`, `Accel`, `Pilot`, `Event`, `Org`, `Train` |
| description | text | Program description |
| use_case | text[] | Array of use case tags, e.g. `["advisor-channel", "field-testing"]` |
| province | text[] | Array of province codes: `BC, AB, SK, MB, ON, QC, NB, NS, PE, NL`. National programs use `["National"]` |
| website | text | Program URL (95%+ coverage) |
| national | boolean | Redundant with `'National' = ANY(province)` but still present |
| ag_food_primary | boolean | Whether program is ag/food focused (vs general tech) |
| stage | text[] | Array: `Idea, MVP, Pilot, Comm, Scale`. Null = all stages |
| production_systems | text[] | Crop types / production systems the program focuses on |
| tech_domains | text[] | Technology domains (e.g. precision ag, biologicals, robotics) |
| cohort_based | boolean | Whether program runs in cohorts |
| intake_frequency | text | How often intake opens (e.g. "annual", "rolling") |
| funding_type | text | Grant, equity, loan, etc. |
| funding_stage_label | text | Human-readable funding stage |
| funding_max_cad | integer | Maximum funding amount in CAD |
| mandate_stage | text[] | Stages the program is mandated to serve |
| mentorship | boolean | Whether program includes mentorship |
| capacity_notes | text | Notes on program capacity or waitlist |
| deadline_notes | text | Intake deadlines, application windows, or timing notes |
| status | text | Default "unverified". Values: unverified, verified, closed |
| verified_at | date | When last verified |
| verified_by | text | Who verified |
| claimed | boolean | Whether a program operator has claimed this listing |
| source | text | Where the data came from |
| notes | text | Internal notes |
| confidence | text | Data confidence level |

**Category values:** `Fund` (funding), `Accel` (accelerator/incubator), `Pilot` (pilot site/field trial), `Event` (conference/event), `Org` (industry organization), `Train` (training/education).

**Stage values:** `Idea`, `MVP`, `Pilot`, `Comm` (first customers / commercialization), `Scale`.

**Province codes:** `BC`, `AB`, `SK`, `MB`, `ON`, `QC`, `NB`, `NS`, `PE`, `NL`, `National`.

---

### knowledge (127 rows as of March 13, 2026)

Curated ecosystem intelligence entries. Injected into chat context via tag matching.

| Column | Type | Notes |
|--------|------|-------|
| id | serial PK | Auto-increment |
| title | text | Descriptive title (used for display and search context) |
| body | text | 1-3 paragraphs of insight. This is the moat — contains insight from conference conversations, ecosystem analysis, and domain expertise that can't be found via web search |
| tags | text[] | Semantic tags for matching against user queries. e.g. `["agronomist", "adoption", "Alberta", "vetting-process"]` |
| province | text[] | Province relevance. e.g. `["AB"]` or `["National"]` |
| category | text | Optional category alignment |
| source | text | Where the knowledge came from. e.g. `"calgary-agtech-conference-2026"`, `"bioenterprise-roundtable-2024"`, `"basf-grower-journey-analysis"` |
| confidence | text | `high`, `medium`, or `low` |
| created_at | timestamptz | Auto-set |
| updated_at | timestamptz | Auto-set |

**Key sources in the knowledge base:**
- `bioenterprise-roundtable-2024` — All 9 provincial reports from Bioenterprise's National Roundtable Series
- `calgary-agtech-conference-2026` — Insights from Matt Gosling, Chris Patterson, Garth Donald, Mark Redmond, Virginia Mulligan, Lewis Baarda presentations
- `basf-grower-journey-analysis` — Grower decision cycle, intermediary layer, post-harvest evaluation insights
- `cfin-programs-2024`, `capi-emili-report` — Federal/national program intelligence

---

### submissions (10 rows as of March 13, 2026)

Stores both user feedback and program submissions.

| Column | Type | Notes |
|--------|------|-------|
| id | serial PK | Auto-increment |
| program_name | text NOT NULL | For feedback: `"FEEDBACK: [page context]"`. For program submissions: program name |
| best_for | text NOT NULL | For feedback: the actual feedback text. For submissions: what the program is best for |
| submitter_name | text NOT NULL | User name |
| submitter_email | text NOT NULL | User email (persisted in sessionStorage after first submission) |
| created_at | timestamp | Auto-set |

**Feedback vs submissions:** Differentiated by `program_name LIKE 'FEEDBACK%'`. Page context is auto-tagged in brackets, e.g. `"FEEDBACK: [pathway results]"`, `"FEEDBACK: [ecosystem chat]"`.

---

### contacts (60 rows as of March 19, 2026)

Mini CRM for Justyn's professional network. Used to personalize communications and spot relationship patterns.

| Column | Type | Notes |
|--------|------|-------|
| id | serial PK | Auto-increment |
| name | text NOT NULL | Contact name |
| organization | text | Company / org |
| role_title | text | Their title |
| track | text[] | Which business tracks: `Trellis`, `BIS`, `Winery`, `Kulture`, `General` |
| relationship_depth | text | `Hot`, `Warm`, `Lukewarm`, `Cold` |
| email | text | Email address |
| phone | text | Phone number |
| linkedin | text | LinkedIn URL |
| location | text | City/province |
| professional_background | text | Who they are, what they do |
| communication_style | text | How they prefer to communicate |
| how_we_met | text | Context of first meeting |
| priority | text | `A`, `B`, `C` |
| status | text | `active`, `parked`, `nurture`, `closed` |
| jtbd | text | Jobs To Be Done — what they're trying to accomplish |
| what_they_offer | text | Intros, funding, validation, expertise they can provide |
| what_they_need | text | What value Justyn can provide to them |
| mutual_value | text | The win-win thesis |
| intro_path | text | Who can make the intro |
| follow_up_cadence | text | `weekly`, `biweekly`, `monthly`, `quarterly`, `as-needed` |
| next_action | text | What to do next |
| next_action_date | date | When follow-up is due |
| tags | text[] | Flexible tags |
| notes | text | Free-form notes |
| created_at | timestamptz | Auto-set |
| updated_at | timestamptz | Auto-set (trigger) |

---

### interactions (0 rows as of March 19, 2026)

Touch log for contacts. Each meaningful interaction gets a row.

| Column | Type | Notes |
|--------|------|-------|
| id | serial PK | Auto-increment |
| contact_id | integer FK → contacts | |
| interaction_type | text NOT NULL | `email_sent`, `email_received`, `call`, `meeting`, `linkedin_dm`, `text`, `conference`, `intro_made` |
| summary | text | What happened |
| date | date NOT NULL | When |
| next_step | text | What should follow |
| created_at | timestamptz | Auto-set |

---

## Common Queries

**Province coverage by category:**
```sql
SELECT province, category, COUNT(*)
FROM programs, unnest(province) AS province
GROUP BY province, category
ORDER BY province, category;
```

**Duplicate check before inserting:**
```sql
SELECT name FROM programs WHERE name ILIKE '%search term%';
```

**Programs for a province + stage:**
```sql
SELECT * FROM programs
WHERE (province && ARRAY['AB'] OR 'National' = ANY(province))
  AND ('MVP' = ANY(stage) OR stage IS NULL OR array_length(stage, 1) IS NULL)
ORDER BY category, name;
```

**Knowledge entries matching tags:**
```sql
SELECT *, array_length(
  ARRAY(SELECT unnest(tags) INTERSECT SELECT unnest(ARRAY['term1','term2','term3'])), 1
) AS match_count
FROM knowledge
WHERE tags && ARRAY['term1','term2','term3']
ORDER BY match_count DESC, confidence DESC
LIMIT 8;
```

**Insert program with array columns:**
```sql
INSERT INTO programs (name, category, province, stage, website, description)
VALUES ('Program Name', 'Fund', ARRAY['AB', 'SK'], ARRAY['MVP', 'Pilot'],
        'https://example.com', 'Description text');
```

**Insert knowledge entry:**
```sql
INSERT INTO knowledge (title, body, tags, province, confidence, source)
VALUES (
  'Entry title',
  'Body text — 1-3 paragraphs of insight',
  ARRAY['tag1', 'tag2', 'tag3'],
  ARRAY['AB'],
  'high',
  'source-identifier'
);
```
