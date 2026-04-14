import type { VercelRequest, VercelResponse } from "@vercel/node";
import postgres from "postgres";
import { checkRateLimit, setCors } from "../../_lib/rate-limit.js";

const conn = process.env.POSTGRES_URL || process.env.DATABASE_URL || "";
const sql = postgres(conn, { ssl: "require", max: 1 });

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (!setCors(req, res)) return;
  if (req.method !== "GET") return res.status(405).end();

  const allowed = await checkRateLimit(req, res, {
    maxRequests: 30, windowSeconds: 60, endpoint: "journey-interests",
  });
  if (!allowed) return;

  try {
    const token = req.query.token as string;
    if (!token || !UUID_RE.test(token)) {
      return res.status(400).json({ error: "Invalid token" });
    }

    // Validate token -> get journey_id
    const journeys = await sql`
      SELECT id FROM saved_journeys WHERE token = ${token} AND status = 'active' LIMIT 1
    `;
    if (journeys.length === 0) {
      return res.status(404).json({ error: "Journey not found" });
    }
    const journeyId = journeys[0].id;

    const rows = await sql`
      SELECT program_id, program_name, status, updated_at
      FROM journey_interests
      WHERE journey_id = ${journeyId}
      ORDER BY updated_at DESC
    `;

    return res.status(200).json(
      rows.map((r: any) => ({
        programId: r.program_id,
        programName: r.program_name,
        status: r.status,
        updatedAt: r.updated_at,
      }))
    );
  } catch (e: any) {
    console.error("Journey interests error:", e?.message || e);
    return res.status(500).json({ error: "Failed to retrieve interests." });
  }
}
