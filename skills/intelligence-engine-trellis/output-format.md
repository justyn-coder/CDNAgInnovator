# Trellis Domain: Output Format

## Purpose
Defines the standard output format for Trellis intelligence research. Unlike BIS (which produces one monolithic brief per company), Trellis produces **multiple knowledge table entries** per research run. Each entry is a discrete, tagged fact or insight that feeds into the Trellis AI recommendation engine.

---

## Target Schema: Supabase `knowledge` Table

```sql
INSERT INTO knowledge (title, body, tags, province, category, source, confidence)
VALUES (
  'Title of the insight',
  'Detailed body text with context',
  ARRAY['tag1', 'tag2', 'tag3'],
  ARRAY['ON', 'AB'],  -- or '{}' for national/general
  'category_value',
  'source_description',
  'high'  -- or 'medium' or 'low'
);
```

### Field Definitions

| Field | Type | Description | Rules |
|-------|------|-------------|-------|
| `title` | text (required) | Short, scannable title. What is the insight? | Under 100 characters. Specific, not generic. |
| `body` | text (required) | Full insight with context. This is what the AI reads. | Include: what, who, when, why it matters. 2-5 sentences. Cite source inline. |
| `tags` | text[] | Semantic tags for matching to founder queries | Use existing tag vocabulary. Add new tags only when no existing tag fits. |
| `province` | text[] | Provincial relevance. Two-letter codes. | ON, AB, SK, MB, BC, QC, NB, NS, PE, NL, NT, YT, NU. Empty array = national/general. |
| `category` | text | Content category | One of: ecosystem, program, technology, market, policy, research, event, person |
| `source` | text | Where this came from | Format: "[source type]: [specific source]" e.g., "conference: Calgary AgTech 2026" or "podcast: RealAg Radio ep 142" |
| `confidence` | text | How reliable is this | `high` = primary source, confirmed. `medium` = secondary source or inferred from credible data. `low` = single source, unverified. |

### Tag Vocabulary (Current)

Check existing tags in the knowledge table before inventing new ones:
```sql
SELECT DISTINCT unnest(tags) as tag, count(*) 
FROM knowledge 
GROUP BY tag 
ORDER BY count DESC;
```

Common existing tags: precision-agriculture, funding, accelerator, grower-journey, policy, protein, sustainability, agtech-adoption, decision-cycle, intermediary, crop-protection, digital-agriculture, carbon, soil-health, genetics, grain-marketing

---

## Output Per Research Run

Each research run produces a **research packet**: a set of knowledge entries plus a quality score.

### Research Packet Structure

```markdown
# Research Packet: [Entity Name]
**Entity type:** [person/org/program/event/technology]
**Date:** [date]
**Researcher:** intelligence-engine (Trellis domain)
**Calibration run:** [yes/no, run #]

---

## Knowledge Entries

### Entry 1: [title]
**Body:** [body text]
**Tags:** [tag1, tag2, tag3]
**Province:** [ON, AB] or []
**Category:** [category]
**Source:** [source description]
**Confidence:** [high/medium/low]

### Entry 2: [title]
[repeat]

---

## SQL Inserts (Ready to Execute)

[Pre-formatted INSERT statements for all entries]

---

## Gaps Identified
- [What we couldn't find and what would fill it]

---

## Quality Score
| Dimension | Score |
|-----------|-------|
| Factual accuracy | X/5 |
| Source diversity | X/5 |
| Recency | X/5 |
| Completeness | X/5 |
| Verification depth | X/5 |
| Domain authority | X/5 |
| Actionability | X/5 |
| **Total** | **X/35** |
```

---

## Entry Quality Rules

1. **One insight per entry.** Don't bundle multiple facts into one row. If a podcast interview reveals three distinct insights, that's three entries.
2. **Body must be self-contained.** A reader (or AI) should understand the entry without needing to read other entries or external sources.
3. **Tags must be specific enough to match.** "agriculture" is too broad. "precision-agriculture" or "grower-journey" is right.
4. **Province must be accurate.** If an insight applies nationally, use empty array. Don't tag all provinces just because it might be relevant.
5. **Source must be traceable.** "web search" is not a source. "RealAgriculture article, March 2026, by [author]" is a source.
6. **Confidence follows core principles.** High = primary source (CP5 threshold). Medium = credible secondary source. Low = single source, unverified.
7. **Don't duplicate existing entries.** Before inserting, check if a similar entry already exists:
   ```sql
   SELECT title, body FROM knowledge WHERE title ILIKE '%[key term]%' OR body ILIKE '%[key term]%';
   ```

---

## Expected Output Volume

| Entity Type | Expected Entries | Rationale |
|-------------|-----------------|-----------|
| Person | 3-8 | Role, expertise, key insights from talks/interviews, connections |
| Organization | 5-12 | Mission, programs, team, partnerships, recent activity, ecosystem position |
| Program | 3-6 | Eligibility, funding, timeline, outcomes, alumni/graduates |
| Event | 5-15 | Key sessions, speakers, themes, announced partnerships, trends |
| Technology | 3-8 | What it does, adoption status, Canadian presence, integration points |
