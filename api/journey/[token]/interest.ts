import type { VercelRequest, VercelResponse } from "@vercel/node";
import postgres from "postgres";
import { checkRateLimit, setCors } from "../../_lib/rate-limit.js";

const conn = process.env.POSTGRES_URL || process.env.DATABASE_URL || "";
const sql = postgres(conn, { ssl: "require", max: 1 });

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const VALID_STATUSES = ["interested", "applied", "dismissed"];

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (!setCors(req, res)) return;
  if (req.method !== "POST") return res.status(405).end();

  const allowed = await checkRateLimit(req, res, {
    maxRequests: 60, windowSeconds: 60, endpoint: "journey-interest",
  });
  if (!allowed) return;

  try {
    const token = req.query.token as string;
    if (!token || !UUID_RE.test(token)) {
      return res.status(400).json({ error: "Invalid token" });
    }

    const { programId, programName, status } = req.body;

    if (!programId || typeof programId !== "number") {
      return res.status(400).json({ error: "programId (number) is required" });
    }
    if (!programName || typeof programName !== "string") {
      return res.status(400).json({ error: "programName is required" });
    }
    if (!VALID_STATUSES.includes(status)) {
      return res.status(400).json({ error: `status must be one of: ${VALID_STATUSES.join(", ")}` });
    }

    // Validate token -> get journey_id
    const journeys = await sql`
      SELECT id FROM saved_journeys WHERE token = ${token} AND status = 'active' LIMIT 1
    `;
    if (journeys.length === 0) {
      return res.status(404).json({ error: "Journey not found" });
    }
    const journeyId = journeys[0].id;

    // Validate program exists
    const programs = await sql`SELECT id FROM programs WHERE id = ${programId} LIMIT 1`;
    if (programs.length === 0) {
      return res.status(404).json({ error: "Program not found" });
    }

    // Upsert interest
    const result = await sql`
      INSERT INTO journey_interests (journey_id, program_id, program_name, status)
      VALUES (${journeyId}, ${programId}, ${programName}, ${status})
      ON CONFLICT (journey_id, program_id) DO UPDATE SET
        status = ${status},
        program_name = ${programName},
        updated_at = NOW()
      RETURNING program_id, status, updated_at
    `;

    return res.status(200).json({
      programId: result[0].program_id,
      status: result[0].status,
      updatedAt: result[0].updated_at,
    });
  } catch (e: any) {
    console.error("Journey interest error:", e?.message || e);
    return res.status(500).json({ error: "Failed to save interest. Please try again." });
  }
}
