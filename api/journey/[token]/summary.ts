import type { VercelRequest, VercelResponse } from "@vercel/node";
import postgres from "postgres";
import { checkRateLimit, setCors } from "../../_lib/rate-limit.js";

const conn = process.env.POSTGRES_URL || process.env.DATABASE_URL || "";
const sql = postgres(conn, { ssl: "require", max: 1 });

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (!setCors(req, res)) return;
  if (req.method !== "POST" && req.method !== "PATCH") return res.status(405).end();

  const allowed = await checkRateLimit(req, res, {
    maxRequests: 10, windowSeconds: 60, endpoint: "journey-summary-update",
  });
  if (!allowed) return;

  try {
    const token = req.query.token as string;
    if (!token || !UUID_RE.test(token)) {
      return res.status(400).json({ error: "Invalid token" });
    }

    const { summary } = req.body || {};
    if (typeof summary !== "string" || summary.trim().length < 10) {
      return res.status(400).json({ error: "summary (string, min 10 chars) required" });
    }

    const cleaned = summary.trim().slice(0, 2000);

    const result = await sql`
      UPDATE saved_journeys
      SET last_summary_text = ${cleaned},
          last_summary_at = NOW(),
          updated_at = NOW()
      WHERE token = ${token} AND status = 'active'
      RETURNING id
    `;

    if (result.length === 0) {
      return res.status(404).json({ error: "Journey not found" });
    }

    return res.status(200).json({ ok: true });
  } catch (e: any) {
    console.error("Journey summary update error:", e?.message || e);
    return res.status(500).json({ error: "Failed to save summary." });
  }
}
