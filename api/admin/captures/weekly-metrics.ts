// GET/POST /api/admin/captures/weekly-metrics
// Cron: Mondays 8am ET. Rolls up last 7 days of pipeline health and pulls a
// drift sample (5 random noise + 5 random pending_review from the prior week)
// so Justyn can spot-check classifier accuracy without digging through captures.
//
// Auth: Bearer CRON_SECRET or ADMIN_SECRET.

import type { VercelRequest, VercelResponse } from "@vercel/node";
import postgres from "postgres";
import { sendEmail } from "../../_lib/email.js";

const conn = process.env.POSTGRES_URL || process.env.DATABASE_URL || "";
const sql = postgres(conn, { ssl: "require", max: 2 });

export const config = { maxDuration: 60 };

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "GET" && req.method !== "POST") return res.status(405).end();

  const auth = req.headers.authorization || "";
  const validCron = auth === `Bearer ${process.env.CRON_SECRET}`;
  const validAdmin = auth === `Bearer ${process.env.ADMIN_SECRET}`;
  if (!validCron && !validAdmin) return res.status(401).json({ error: "unauthorized" });

  try {
    const weekAgo = await sql`SELECT (now() - interval '7 days') AS d`;
    const since = weekAgo[0].d;

    const totals = await sql`
      SELECT
        COUNT(*) FILTER (WHERE captured_at >= ${since as any}) AS captures,
        COUNT(*) FILTER (WHERE captured_at >= ${since as any} AND decision = 'auto_added') AS auto_added,
        COUNT(*) FILTER (WHERE captured_at >= ${since as any} AND decision = 'pending_review') AS pending,
        COUNT(*) FILTER (WHERE captured_at >= ${since as any} AND decision = 'duplicate_merged') AS merged,
        COUNT(*) FILTER (WHERE captured_at >= ${since as any} AND decision = 'noise') AS noise,
        COUNT(*) FILTER (WHERE captured_at >= ${since as any} AND decision = 'error') AS errors,
        COUNT(*) FILTER (WHERE captured_at >= ${since as any} AND decision = 'rejected') AS rejected
      FROM captures
    `;

    const byClass = await sql`
      SELECT classification, COUNT(*) AS n
      FROM captures
      WHERE captured_at >= ${since as any} AND classification IS NOT NULL
      GROUP BY classification
      ORDER BY n DESC
    `;

    const peopleTotals = await sql`
      SELECT
        COUNT(*) AS total,
        COUNT(*) FILTER (WHERE first_seen_at >= ${since as any}) AS new_this_week,
        COUNT(*) FILTER (WHERE status = 'relevant') AS relevant
      FROM people
    `;

    // Drift sample: 5 random noise + 5 random pending_review from last week
    const noiseSample = await sql`
      SELECT id, source_url, classification_reasoning, author_name, canonical_data
      FROM captures
      WHERE captured_at >= ${since as any} AND decision = 'noise'
      ORDER BY random()
      LIMIT 5
    `;
    const pendingSample = await sql`
      SELECT id, source_url, classification, classification_reasoning, canonical_data
      FROM captures
      WHERE captured_at >= ${since as any} AND decision = 'pending_review'
      ORDER BY random()
      LIMIT 5
    `;

    // Digest health check: captures included in a digest in the last 7 days?
    const digestHealth = await sql`
      SELECT
        COUNT(*) FILTER (WHERE captured_at >= ${since as any}) AS total,
        COUNT(*) FILTER (WHERE captured_at >= ${since as any} AND digest_sent_at IS NOT NULL) AS digested
      FROM captures
    `;

    const t = totals[0] as any;
    const p = peopleTotals[0] as any;
    const d = digestHealth[0] as any;

    const lines: string[] = [];
    lines.push(`Trellis pipeline — weekly metrics (last 7 days)`);
    lines.push("");
    lines.push(`CAPTURES: ${t.captures}`);
    lines.push(`  auto-added: ${t.auto_added}`);
    lines.push(`  merged into existing: ${t.merged}`);
    lines.push(`  pending review: ${t.pending}`);
    lines.push(`  rejected: ${t.rejected}`);
    lines.push(`  noise: ${t.noise}`);
    lines.push(`  errors: ${t.errors}`);
    lines.push("");
    lines.push(`CLASSIFICATION MIX:`);
    for (const r of byClass) {
      lines.push(`  ${r.classification}: ${r.n}`);
    }
    lines.push("");
    lines.push(`PEOPLE DB: ${p.total} total, ${p.new_this_week} new this week, ${p.relevant} marked relevant`);
    lines.push("");
    lines.push(`DIGEST HEALTH: ${d.digested}/${d.total} captures included in a digest (target: ≥95%)`);
    lines.push("");

    if (noiseSample.length > 0 || pendingSample.length > 0) {
      lines.push(`DRIFT SAMPLE (spot-check these in Claude Code — "review capture <id>"):`);
      lines.push("");
      if (noiseSample.length > 0) {
        lines.push(`  NOISE sample (confirm these were really noise):`);
        for (const s of noiseSample) {
          lines.push(`    #${s.id}: ${(s as any).author_name || "?"} — ${(s as any).classification_reasoning || ""}`);
          if (s.source_url) lines.push(`      ${s.source_url}`);
        }
        lines.push("");
      }
      if (pendingSample.length > 0) {
        lines.push(`  PENDING sample (review & decide):`);
        for (const s of pendingSample) {
          const cd = (s as any).canonical_data as any;
          const name = cd?.program?.name || cd?.knowledge?.title || "(no title)";
          lines.push(`    #${s.id}: ${s.classification} — "${name}"`);
        }
      }
    }

    const body = lines.join("\n");

    await sendEmail({
      subject: `Trellis weekly metrics — ${t.captures} captures, ${t.pending} pending review`,
      text: body,
    });

    return res.status(200).json({ ok: true, body_preview: body.slice(0, 800) });
  } catch (e: any) {
    console.error("weekly-metrics error:", e);
    return res.status(500).json({ error: String(e).slice(0, 300) });
  }
}
