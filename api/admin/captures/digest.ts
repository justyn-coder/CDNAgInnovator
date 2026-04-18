// GET/POST /api/admin/captures/digest
// Cron: daily 7am ET. Summarizes captures from the previous ET day and emails
// Justyn. Also backstops delivery health by stamping captures.digest_sent_at.
//
// Auth: Bearer CRON_SECRET or ADMIN_SECRET.

import type { VercelRequest, VercelResponse } from "@vercel/node";
import postgres from "postgres";
import { sendEmail } from "../../_lib/email.js";

const conn = process.env.POSTGRES_URL || process.env.DATABASE_URL || "";
const sql = postgres(conn, { ssl: "require", max: 2 });

export const config = { maxDuration: 60 };

function ptr(n: number): string {
  return String(n);
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "GET" && req.method !== "POST") return res.status(405).end();

  const auth = req.headers.authorization || "";
  const validCron = auth === `Bearer ${process.env.CRON_SECRET}`;
  const validAdmin = auth === `Bearer ${process.env.ADMIN_SECRET}`;
  if (!validCron && !validAdmin) return res.status(401).json({ error: "unauthorized" });

  try {
    // "Yesterday" in America/Toronto
    const range = await sql`
      SELECT
        (date_trunc('day', now() AT TIME ZONE 'America/Toronto') - interval '1 day') AS day_start_et,
        date_trunc('day', now() AT TIME ZONE 'America/Toronto') AS day_end_et
    `;
    const day_start_et = range[0].day_start_et;
    const day_end_et = range[0].day_end_et;

    const captures = await sql`
      SELECT
        id, classification, classification_confidence, classification_reasoning,
        decision, target_table, target_id, canonical_data, source_url, author_name
      FROM captures
      WHERE captured_at >= ${day_start_et}::timestamp AT TIME ZONE 'America/Toronto'
        AND captured_at <  ${day_end_et}::timestamp AT TIME ZONE 'America/Toronto'
      ORDER BY captured_at ASC
    `;

    const auto_added = captures.filter((c: any) => c.decision === "auto_added");
    const pending = captures.filter((c: any) => c.decision === "pending_review");
    const merged = captures.filter((c: any) => c.decision === "duplicate_merged");
    const noise = captures.filter((c: any) => c.decision === "noise");
    const errors = captures.filter((c: any) => c.decision === "error");

    // People signals: today's upserts (approximated as updated_at in the window)
    const people_new = await sql`
      SELECT COUNT(*) AS n FROM people
      WHERE first_seen_at >= ${day_start_et}::timestamp AT TIME ZONE 'America/Toronto'
        AND first_seen_at <  ${day_end_et}::timestamp AT TIME ZONE 'America/Toronto'
    `;
    const people_updated = await sql`
      SELECT COUNT(*) AS n FROM people
      WHERE updated_at >= ${day_start_et}::timestamp AT TIME ZONE 'America/Toronto'
        AND updated_at <  ${day_end_et}::timestamp AT TIME ZONE 'America/Toronto'
        AND first_seen_at <  ${day_start_et}::timestamp AT TIME ZONE 'America/Toronto'
    `;

    const lines: string[] = [];
    const date_label = new Date(day_start_et as any).toISOString().slice(0, 10);
    lines.push(`Trellis capture digest — ${date_label}`);
    lines.push("");
    lines.push(`Yesterday: ${captures.length} captures.`);
    lines.push("");

    if (auto_added.length > 0) {
      lines.push(`AUTO-ADDED (${auto_added.length})`);
      for (const c of auto_added) {
        const p = (c.canonical_data as any)?.program;
        const label =
          c.target_table === "programs"
            ? `program: ${p?.name || "(unnamed)"} [${c.target_table}#${c.target_id}]`
            : c.target_table === "interactions"
            ? `contact signal: interaction logged for contact [${c.target_table}#${c.target_id}]`
            : `${c.classification}: [${c.target_table}#${c.target_id}]`;
        lines.push(`  - ${label}`);
      }
      lines.push("");
    }

    if (merged.length > 0) {
      lines.push(`UPDATED / MERGED (${merged.length})`);
      for (const c of merged) {
        lines.push(`  - programs#${c.target_id}: existing row refreshed from capture #${c.id}`);
      }
      lines.push("");
    }

    if (pending.length > 0) {
      lines.push(`PENDING REVIEW (${pending.length})`);
      for (const c of pending) {
        const cd = c.canonical_data as any;
        const name = cd?.program?.name || cd?.knowledge?.title || "(no title)";
        const url = c.source_url || "";
        lines.push(`  - ${c.classification}: "${name}" [capture #${c.id}] ${url}`);
        if (c.classification_reasoning) {
          lines.push(`      why: ${c.classification_reasoning}`);
        }
      }
      lines.push(`  To review: open Claude Code and say "review Trellis captures"`);
      lines.push("");
    }

    lines.push(
      `PEOPLE: ${ptr((people_new[0].n as any) as number)} new, ${ptr((people_updated[0].n as any) as number)} updated`
    );
    lines.push(`NOISE: ${noise.length} filtered`);

    if (errors.length > 0) {
      lines.push(`ERRORS (${errors.length})`);
      for (const c of errors) {
        lines.push(`  - capture #${c.id}: ${(c as any).classification_reasoning || "(no reason)"}`);
      }
    }
    lines.push("");
    lines.push("---");
    lines.push(`Full spec: tally-wiki → trellis/specs/linkedin-capture-pipeline-v1.0`);

    const body = lines.join("\n");

    // Stamp digest_sent_at on all captures included so we can detect silent failures.
    if (captures.length > 0) {
      const ids = captures.map((c: any) => c.id as number);
      await sql`
        UPDATE captures SET digest_sent_at = now()
        WHERE id = ANY(${ids}::int[])
      `;
    }

    if (captures.length > 0) {
      await sendEmail({
        subject: `Trellis capture digest — ${date_label} (${captures.length} captures)`,
        text: body,
      });
    }

    return res.status(200).json({
      captures: captures.length,
      auto_added: auto_added.length,
      merged: merged.length,
      pending_review: pending.length,
      noise: noise.length,
      errors: errors.length,
      emailed: captures.length > 0,
      body_preview: body.slice(0, 500),
    });
  } catch (e: any) {
    console.error("digest error:", e);
    return res.status(500).json({ error: String(e).slice(0, 300) });
  }
}
