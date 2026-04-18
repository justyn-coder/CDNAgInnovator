// Main ingest orchestration. Takes a capture row and drives it through
// classification + target-table routing. Updates captures.decision, target_table,
// target_id, canonical_data, and errors as it goes.
//
// Concurrency: uses optimistic lock via UPDATE ... WHERE decision IN ('queued','error')
// before classifying, so parallel retry runs don't double-process.

import type { Sql } from "postgres";
import { classifyCapture, type ClassifyResult } from "./classifier.js";
import { scrapeUrl } from "./firecrawl.js";
import {
  authorToUpsertInput,
  mentionedToUpsertInput,
  upsertPerson,
} from "./people-upsert.js";
import { dedupProgram, hasRequiredProgramFields } from "./dedup.js";
import type { CanonicalData, ClassifierOutput } from "./types.js";

export interface ProcessResult {
  capture_id: number;
  classification: string;
  confidence: string | null;
  decision: string;
  target_table: string | null;
  target_id: number | null;
  error?: string;
}

// Optimistic lock: flip decision 'queued' → 'classifying' atomically.
// Returns true if we acquired the lock (this process should proceed).
async function acquireLock(sql: Sql, capture_id: number): Promise<boolean> {
  const rows = await sql`
    UPDATE captures
    SET decision = 'classifying', updated_at = now()
    WHERE id = ${capture_id} AND decision IN ('queued','error')
    RETURNING id
  `;
  return rows.length > 0;
}

async function markError(sql: Sql, capture_id: number, err: string) {
  await sql`
    UPDATE captures SET
      classification = 'error',
      decision = 'error',
      last_error = ${err.slice(0, 500)},
      retry_count = retry_count + 1,
      updated_at = now()
    WHERE id = ${capture_id}
  `;
}

export interface ProcessOptions {
  // Transient image data for vision-based classification. Not persisted.
  image_base64?: string;
}

export async function processCapture(
  sql: Sql,
  capture_id: number,
  opts: ProcessOptions = {}
): Promise<ProcessResult> {
  // Acquire lock
  const gotLock = await acquireLock(sql, capture_id);
  if (!gotLock) {
    return {
      capture_id,
      classification: "skipped_locked",
      confidence: null,
      decision: "skipped_locked",
      target_table: null,
      target_id: null,
      error: "another process owns this capture",
    };
  }

  const rows = await sql`SELECT * FROM captures WHERE id = ${capture_id}`;
  if (rows.length === 0) {
    return {
      capture_id,
      classification: "missing",
      confidence: null,
      decision: "error",
      target_table: null,
      target_id: null,
      error: "capture row not found",
    };
  }
  const cap = rows[0] as any;
  const captureTime = new Date(cap.captured_at);

  // Fetch post content if we only have a URL. Graceful fallback chain.
  let post_markdown = "";
  let firecrawl_err: string | undefined;
  if (cap.source_url && !cap.raw_text) {
    const fc = await scrapeUrl(cap.source_url, { timeoutMs: 12000 });
    if (fc.ok && fc.markdown) {
      post_markdown = fc.markdown.slice(0, 8000);
    } else {
      firecrawl_err = fc.error;
    }
  } else if (cap.source_url && cap.raw_text) {
    // We have both — try to enrich with Firecrawl but tolerate failure.
    const fc = await scrapeUrl(cap.source_url, { timeoutMs: 8000 });
    if (fc.ok && fc.markdown && fc.markdown.length > (cap.raw_text?.length || 0)) {
      post_markdown = fc.markdown.slice(0, 8000);
    }
  }

  // Call classifier
  let cls: ClassifyResult;
  try {
    cls = await classifyCapture({
      source_url: cap.source_url,
      author_name: cap.author_name,
      author_url: cap.author_url,
      raw_text: cap.raw_text,
      post_markdown,
      image_base64: opts.image_base64, // transient: passed through from the endpoint at capture time
    });
  } catch (e: any) {
    await markError(sql, capture_id, `classifier threw: ${String(e).slice(0, 300)}`);
    return {
      capture_id,
      classification: "error",
      confidence: null,
      decision: "error",
      target_table: null,
      target_id: null,
      error: String(e),
    };
  }

  if (!cls.ok || !cls.output) {
    const err = [cls.error, firecrawl_err ? `(firecrawl: ${firecrawl_err})` : ""].filter(Boolean).join(" ");
    await markError(sql, capture_id, err || "classifier returned no output");
    return {
      capture_id,
      classification: "error",
      confidence: null,
      decision: "error",
      target_table: null,
      target_id: null,
      error: err,
    };
  }

  const output: ClassifierOutput = cls.output;
  const canonical: CanonicalData = { ...output.canonical_data, schema_version: 1 };

  // Always upsert author into people (regardless of classification)
  let author_person_id: number | null = null;
  try {
    const authorInput = authorToUpsertInput(
      canonical.author,
      captureTime,
      cap.author_name,
      cap.author_url
    );
    if (authorInput) {
      const res = await upsertPerson(sql, authorInput);
      if (res) author_person_id = res.person_id;
    }
    for (const m of canonical.mentioned_people || []) {
      const mi = mentionedToUpsertInput(m, captureTime);
      if (mi) await upsertPerson(sql, mi);
    }
  } catch (e: any) {
    // Author upsert failures shouldn't kill the whole capture — log and continue.
    console.error(`[capture ${capture_id}] people upsert failed:`, e);
  }

  // Route on classification
  const finalResult: ProcessResult = {
    capture_id,
    classification: output.classification,
    confidence: output.confidence,
    decision: "pending_review",
    target_table: null,
    target_id: null,
  };

  try {
    if (output.classification === "noise") {
      finalResult.decision = "noise";
    } else if (output.classification === "program") {
      const p = canonical.program;
      if (!p) {
        finalResult.decision = "pending_review";
      } else {
        const dedup = await dedupProgram(sql, p);

        if (dedup.tier === "exact_name" || dedup.tier === "website_domain") {
          // Safe auto-merge — update notes, don't overwrite fields
          const noteSuffix = `\n[linkedin_capture:${capture_id} @ ${new Date().toISOString().slice(0, 10)}]`;
          await sql`
            UPDATE programs SET
              notes = COALESCE(notes, '') || ${noteSuffix}
            WHERE id = ${dedup.program_id ?? 0}
          `;
          finalResult.decision = "duplicate_merged";
          finalResult.target_table = "programs";
          finalResult.target_id = dedup.program_id ?? null;
        } else if (dedup.tier === "trigram" || dedup.tier === "normalized_name_province") {
          finalResult.decision = "pending_review";
          finalResult.target_table = "programs";
          finalResult.target_id = dedup.program_id ?? null;
        } else {
          // No match. Auto-insert only if: high confidence + all required fields + URL-based capture (not OCR-only).
          const hasUrl = !!cap.source_url;
          const canAutoInsert =
            output.confidence === "high" && hasRequiredProgramFields(p) && hasUrl;
          if (canAutoInsert) {
            const sourceTag = `linkedin_capture:${capture_id}`;
            const ins = await sql`
              INSERT INTO programs (
                name, category, description, province, website,
                stage, funding_type, funding_max_cad, intake_frequency,
                deadline_notes, status, source, tech_domains, production_systems,
                use_case, mentorship, cohort_based
              ) VALUES (
                ${p.name ?? null},
                ${p.category ?? null},
                ${p.description ?? null},
                ${(p.province ?? []) as string[]}::text[],
                ${p.candidate_website ?? null},
                ${(p.stage ?? null) as string[] | null}::text[],
                ${p.funding_type ?? null},
                ${p.funding_max_cad ?? null},
                ${p.intake_frequency ?? null},
                ${p.deadline_notes ?? null},
                'unverified',
                ${sourceTag},
                ${(p.tech_domains ?? null) as string[] | null}::text[],
                ${(p.production_systems ?? null) as string[] | null}::text[],
                ${(p.use_case ?? null) as string[] | null}::text[],
                ${p.mentorship ?? null},
                ${p.cohort_based ?? null}
              )
              RETURNING id
            `;
            finalResult.decision = "auto_added";
            finalResult.target_table = "programs";
            finalResult.target_id = ins[0].id as number;
          } else {
            finalResult.decision = "pending_review";
            finalResult.target_table = "programs";
          }
        }
      }
    } else if (output.classification === "knowledge") {
      // Knowledge never auto-inserts. Always pending_review; draft lives in canonical_data.
      finalResult.decision = "pending_review";
      finalResult.target_table = "knowledge";
    } else if (output.classification === "contact_signal") {
      // If the author matches a known contact, log an interaction row.
      if (author_person_id) {
        const contactRows = await sql`
          SELECT contact_id FROM people WHERE id = ${author_person_id}
        `;
        const contactId = contactRows[0]?.contact_id as number | null;
        if (contactId) {
          const summary = (cap.raw_text || post_markdown || "").slice(0, 500);
          const ins = await sql`
            INSERT INTO interactions (contact_id, interaction_type, summary, date)
            VALUES (${contactId}, 'linkedin_post', ${summary}, CURRENT_DATE)
            RETURNING id
          `;
          finalResult.decision = "auto_added";
          finalResult.target_table = "interactions";
          finalResult.target_id = ins[0].id as number;
        } else {
          // No known contact — people upsert already happened; just mark processed.
          finalResult.decision = "auto_added";
          finalResult.target_table = "people";
          finalResult.target_id = author_person_id;
        }
      } else {
        finalResult.decision = "pending_review";
      }
    }
  } catch (e: any) {
    await markError(sql, capture_id, `routing failed: ${String(e).slice(0, 300)}`);
    return {
      capture_id,
      classification: output.classification,
      confidence: output.confidence,
      decision: "error",
      target_table: null,
      target_id: null,
      error: String(e),
    };
  }

  // Persist everything back to captures. Pass canonical as a raw object so
  // postgres.js JSONB-encodes it natively (passing JSON.stringify + ::jsonb
  // ends up double-encoding to a JSON string).
  await sql`
    UPDATE captures SET
      classification = ${output.classification},
      classification_confidence = ${output.confidence},
      classification_reasoning = ${output.reasoning || null},
      classifier_model = ${cls.model || null},
      classified_at = now(),
      canonical_data = ${sql.json(canonical as any)},
      resolved_website = ${canonical.program?.candidate_website || null},
      decision = ${finalResult.decision},
      target_table = ${finalResult.target_table},
      target_id = ${finalResult.target_id},
      updated_at = now()
    WHERE id = ${capture_id}
  `;

  return finalResult;
}
