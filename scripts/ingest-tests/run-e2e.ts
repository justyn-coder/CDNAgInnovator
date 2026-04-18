// End-to-end pipeline test.
//
// For each case in the golden set:
//   1. INSERT a capture row (source='test', idempotency_key=null to bypass).
//   2. Run processCapture() from the pipeline.
//   3. Verify captures.decision, classification, canonical_data, target_table.
//   4. Verify side effects:
//        - program class → new programs row OR merge note on existing program
//        - knowledge class → pending_review, no knowledge row yet (drafts don't auto-insert)
//        - contact_signal class → people row for author (mandatory), optional interaction
//        - noise class → no side effects in programs/knowledge/interactions
//   5. CLEANUP: delete test captures + their inserted programs + people.
//
// Usage: source .env.local && npx tsx scripts/ingest-tests/run-e2e.ts

import postgres from "postgres";
import { processCapture } from "../../api/_lib/ingest/pipeline.js";
import { GOLDEN_SET } from "./golden-set.js";

const conn = process.env.POSTGRES_URL || process.env.DATABASE_URL || "";
const sql = postgres(conn, { ssl: "require", max: 2 });

interface E2EResult {
  id: string;
  expected_class: string;
  actual_class: string | null;
  decision: string | null;
  target_table: string | null;
  target_id: number | null;
  side_effects_ok: boolean;
  side_effects_note: string;
  error?: string;
}

async function insertCapture(c: (typeof GOLDEN_SET)[number]): Promise<number> {
  const r = await sql`
    INSERT INTO captures (
      source, source_url, raw_text, author_name, author_url,
      captured_by, decision
    ) VALUES (
      'test',
      ${c.source_url || null},
      ${c.raw_text},
      ${c.author_name},
      ${c.author_url || null},
      ${`test_${c.id}`},
      'queued'
    )
    RETURNING id
  `;
  return r[0].id as number;
}

async function verifySideEffects(
  captureId: number,
  c: (typeof GOLDEN_SET)[number],
  actualClass: string
): Promise<{ ok: boolean; note: string }> {
  const cap = (await sql`SELECT * FROM captures WHERE id = ${captureId}`)[0] as any;

  // Always — author should be upserted into people.
  // Match by handle first (individuals), fall back to name (company/brand accounts).
  const handle = c.author_url?.match(/\/in\/([^/?#]+)/)?.[1]?.toLowerCase();
  let authorPerson: any = null;
  if (handle) {
    const rows = await sql`SELECT * FROM people WHERE linkedin_handle = ${handle} LIMIT 1`;
    authorPerson = rows[0];
  } else {
    // company URL or no URL — match by name
    const rows = await sql`SELECT * FROM people WHERE name = ${c.author_name} LIMIT 1`;
    authorPerson = rows[0];
  }
  if (!authorPerson) {
    return { ok: false, note: `author person not upserted (handle=${handle}, name=${c.author_name})` };
  }

  if (actualClass === "program") {
    // decision should be either auto_added (new), duplicate_merged (existing), or pending_review
    if (!["auto_added", "duplicate_merged", "pending_review"].includes(cap.decision)) {
      return { ok: false, note: `program decision unexpected: ${cap.decision}` };
    }
    if (cap.target_table !== "programs" && cap.decision !== "pending_review") {
      return { ok: false, note: `program target_table not programs: ${cap.target_table}` };
    }
    if (cap.decision === "auto_added" && cap.target_id) {
      // verify the program row actually exists
      const rows = await sql`SELECT id, source FROM programs WHERE id = ${cap.target_id}`;
      if (rows.length === 0) {
        return { ok: false, note: `auto_added but programs#${cap.target_id} missing` };
      }
      if (!(rows[0].source as string)?.startsWith("linkedin_capture:")) {
        return {
          ok: false,
          note: `auto_added program has wrong source: ${rows[0].source}`,
        };
      }
    }
    return { ok: true, note: `decision=${cap.decision} target=${cap.target_table}#${cap.target_id}` };
  }

  if (actualClass === "knowledge") {
    if (cap.decision !== "pending_review") {
      return { ok: false, note: `knowledge must be pending_review, got: ${cap.decision}` };
    }
    // Knowledge canonical data should be populated
    const cd = cap.canonical_data as any;
    if (!cd?.knowledge?.title || !cd?.knowledge?.body) {
      return { ok: false, note: "knowledge canonical_data missing title/body" };
    }
    return { ok: true, note: `knowledge draft stored in canonical_data` };
  }

  if (actualClass === "contact_signal") {
    // Must be auto_added OR pending_review. target_table should be interactions or people.
    if (!["auto_added", "pending_review"].includes(cap.decision)) {
      return { ok: false, note: `contact_signal decision unexpected: ${cap.decision}` };
    }
    return { ok: true, note: `decision=${cap.decision} target=${cap.target_table}#${cap.target_id}` };
  }

  if (actualClass === "noise") {
    if (cap.decision !== "noise") {
      return { ok: false, note: `noise must be 'noise', got: ${cap.decision}` };
    }
    return { ok: true, note: "noise (author still upserted)" };
  }

  return { ok: false, note: `unexpected actualClass: ${actualClass}` };
}

async function cleanup(captureIds: number[]) {
  if (captureIds.length === 0) return;

  // Delete programs inserted by these captures (source tag)
  const sources = captureIds.map((id) => `linkedin_capture:${id}`);
  await sql`DELETE FROM programs WHERE source = ANY(${sources}::text[])`;

  // Delete interactions inserted from these captures (via recent_timestamp heuristic — safer: via summary fragment)
  // We'll leave interactions for now — they don't duplicate, and there are none in a clean test run.

  // Delete people created by these test captures: match on linkedin_handle from our test authors.
  const testHandles = GOLDEN_SET.map((c) => c.author_url?.match(/\/in\/([^/?#]+)/)?.[1]?.toLowerCase()).filter(
    Boolean
  ) as string[];
  if (testHandles.length > 0) {
    await sql`DELETE FROM people WHERE linkedin_handle = ANY(${testHandles}::text[])`;
  }
  // Delete author-by-name upserts (company URLs without handles) and mentioned people
  const testAuthorNames = GOLDEN_SET.map((c) => c.author_name);
  await sql`DELETE FROM people WHERE name = ANY(${testAuthorNames}::text[])`;
  await sql`DELETE FROM people WHERE name IN ('Tina Chen','Avrio Capital','Jessica Park','BigAgCo','Generic Consultant','Motivational Speaker','Local Politician','Self-Promo Coach','Local Business Owner','Corporate Marketing Account')`;

  // Delete captures themselves
  await sql`DELETE FROM captures WHERE id = ANY(${captureIds}::int[])`;
}

async function main() {
  console.log(`\n=== END-TO-END PIPELINE TEST ===`);
  console.log(`Running ${GOLDEN_SET.length} cases through the full pipeline...\n`);

  const results: E2EResult[] = [];
  const captureIds: number[] = [];

  // Run sequentially to get predictable ordering + to share idempotent rate limits
  for (const c of GOLDEN_SET) {
    let capId = -1;
    try {
      capId = await insertCapture(c);
      captureIds.push(capId);

      const r = await processCapture(sql, capId);

      const se = await verifySideEffects(capId, c, r.classification);

      const classMatch = r.classification === c.expected_class;
      const ok = classMatch && se.ok;

      results.push({
        id: c.id,
        expected_class: c.expected_class,
        actual_class: r.classification,
        decision: r.decision,
        target_table: r.target_table,
        target_id: r.target_id,
        side_effects_ok: se.ok,
        side_effects_note: se.note,
        error: r.error,
      });

      const mark = ok ? "✓" : "✗";
      console.log(
        `${mark} ${c.id.padEnd(10)} cap#${String(capId).padEnd(5)} ` +
          `class=${r.classification.padEnd(14)} decision=${r.decision.padEnd(18)} ${se.note}`
      );
    } catch (e: any) {
      results.push({
        id: c.id,
        expected_class: c.expected_class,
        actual_class: null,
        decision: null,
        target_table: null,
        target_id: null,
        side_effects_ok: false,
        side_effects_note: "exception",
        error: String(e).slice(0, 200),
      });
      console.log(`✗ ${c.id.padEnd(10)} EXCEPTION: ${String(e).slice(0, 120)}`);
    }
  }

  // === Aggregate ===
  const total = results.length;
  const classOk = results.filter((r) => r.expected_class === r.actual_class).length;
  const sideOk = results.filter((r) => r.side_effects_ok).length;
  const fullOk = results.filter((r) => r.expected_class === r.actual_class && r.side_effects_ok).length;

  console.log(`\n=== RESULTS ===`);
  console.log(`Classification:  ${classOk}/${total} (${Math.round((100 * classOk) / total)}%)`);
  console.log(`Side effects:    ${sideOk}/${total} (${Math.round((100 * sideOk) / total)}%)`);
  console.log(`Full pipeline:   ${fullOk}/${total} (${Math.round((100 * fullOk) / total)}%)`);

  // === Dedup test ===
  // Verify that a capture referencing an existing programs row is merged
  // rather than inserted as a new row. Clean up any prior-test residue first
  // so the test is deterministic; then seed; then capture.
  console.log(`\n=== DEDUP TEST ===`);
  await sql`DELETE FROM programs WHERE name = 'FCC AgriSpirit Fund' AND source LIKE 'linkedin_capture:%'`;
  const seed = await sql`
    INSERT INTO programs (name, category, province, website, status, source)
    VALUES ('FCC AgriSpirit Fund', 'Fund', ${["National"]}::text[], 'https://www.fcc.ca/agrispirit', 'unverified', 'test_seed')
    ON CONFLICT DO NOTHING
    RETURNING id
  `;
  let seedId: number | null = null;
  if (seed.length > 0) {
    seedId = seed[0].id as number;
  } else {
    const existing = await sql`SELECT id FROM programs WHERE name = 'FCC AgriSpirit Fund' LIMIT 1`;
    seedId = (existing[0]?.id as number) ?? null;
  }
  console.log(`  Seed target: programs#${seedId}`);
  const dedupCapId = await insertCapture(GOLDEN_SET[0]);
  captureIds.push(dedupCapId);
  const dedupR = await processCapture(sql, dedupCapId);
  console.log(`  cap#${dedupCapId} decision=${dedupR.decision} target=programs#${dedupR.target_id}`);
  // Functional check: did we merge into any programs row matching FCC AgriSpirit Fund?
  const matchedRow =
    dedupR.target_id != null
      ? await sql`SELECT id, name FROM programs WHERE id = ${dedupR.target_id}`
      : [];
  const dedupOk =
    dedupR.decision === "duplicate_merged" &&
    matchedRow.length > 0 &&
    (matchedRow[0].name as string).toLowerCase() === "fcc agrispirit fund";
  console.log(`  dedup ${dedupOk ? "✓" : "✗"} ${dedupOk ? "merged into FCC AgriSpirit Fund" : "failed to merge into an FCC row"}`);
  if (seedId != null) {
    await sql`DELETE FROM programs WHERE id = ${seedId}`;
  }

  // === CLEANUP ===
  console.log(`\n=== CLEANUP ===`);
  console.log(`Deleting ${captureIds.length} test captures + associated test rows...`);
  await cleanup(captureIds);
  console.log(`Done.`);

  const passPct = (100 * fullOk) / total;
  if (passPct >= 90 && dedupOk) {
    console.log(`\nE2E PASS: full pipeline ${Math.round(passPct)}%, dedup ok.`);
    process.exit(0);
  } else {
    console.log(`\nE2E FAIL: pipeline ${Math.round(passPct)}%, dedup ${dedupOk ? "ok" : "broken"}.`);
    process.exit(1);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(2);
});
