// GET/POST /api/admin/captures/retry-queued
// Cron: every 15 minutes. Picks up captures stuck in 'queued' or 'classifying'
// for >2 minutes and re-runs them. retry_count capped at 3 — after that the
// row is marked 'error' permanently (surfaces in digest).
//
// Auth: Bearer CRON_SECRET or ADMIN_SECRET.

import type { VercelRequest, VercelResponse } from "@vercel/node";
import postgres from "postgres";
import { processCapture } from "../../_lib/ingest/pipeline.js";

const conn = process.env.POSTGRES_URL || process.env.DATABASE_URL || "";
const sql = postgres(conn, { ssl: "require", max: 2 });

export const config = { maxDuration: 300 };

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "GET" && req.method !== "POST") {
    return res.status(405).end();
  }

  const auth = req.headers.authorization || "";
  const validCron = auth === `Bearer ${process.env.CRON_SECRET}`;
  const validAdmin = auth === `Bearer ${process.env.ADMIN_SECRET}`;
  if (!validCron && !validAdmin) return res.status(401).json({ error: "unauthorized" });

  try {
    // Captures stuck in queued/classifying for >2 minutes OR in error state with retry_count < 3.
    const stuck = await sql`
      SELECT id, retry_count, decision
      FROM captures
      WHERE (
        (decision IN ('queued','classifying') AND updated_at < now() - interval '2 minutes')
        OR (decision = 'error' AND retry_count < 3 AND updated_at < now() - interval '15 minutes')
      )
      ORDER BY captured_at ASC
      LIMIT 20
    `;

    const results: any[] = [];
    for (const row of stuck) {
      const id = row.id as number;
      const rc = row.retry_count as number;

      // Cap retries at 3: mark permanent error and skip.
      if (rc >= 3) {
        await sql`
          UPDATE captures SET decision = 'error', updated_at = now()
          WHERE id = ${id}
        `;
        results.push({ id, action: "capped_error", retry_count: rc });
        continue;
      }

      try {
        // Reset decision to 'queued' so acquireLock() can flip it to 'classifying'.
        await sql`
          UPDATE captures SET decision = 'queued', updated_at = now()
          WHERE id = ${id} AND decision IN ('queued','classifying','error')
        `;
        const result = await processCapture(sql, id);
        results.push({
          id,
          action: "reprocessed",
          decision: result.decision,
          classification: result.classification,
          error: result.error,
        });
      } catch (e: any) {
        await sql`
          UPDATE captures SET
            decision = 'error',
            last_error = ${String(e).slice(0, 500)},
            retry_count = retry_count + 1,
            updated_at = now()
          WHERE id = ${id}
        `;
        results.push({ id, action: "error", error: String(e).slice(0, 200) });
      }
    }

    return res.status(200).json({
      checked: stuck.length,
      results,
    });
  } catch (e: any) {
    console.error("retry-queued error:", e);
    return res.status(500).json({ error: String(e).slice(0, 300) });
  }
}
