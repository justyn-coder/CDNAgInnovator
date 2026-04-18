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
    maxRequests: 10, windowSeconds: 60, endpoint: "journey-restore",
  });
  if (!allowed) return;

  try {
    const token = req.query.token as string;

    if (!token || !UUID_RE.test(token)) {
      return res.status(400).json({ error: "Invalid token" });
    }

    const rows = await sql`
      SELECT name, description, stage, provinces, need, sector,
             company_url, product_type, expansion_provinces, completed_programs,
             pathway_data, notify_new_programs, created_at,
             last_summary_text, last_summary_at
      FROM saved_journeys
      WHERE token = ${token} AND status = 'active'
      LIMIT 1
    `;

    if (rows.length === 0) {
      return res.status(404).json({ error: "Journey not found" });
    }

    // Update access tracking (fire-and-forget)
    sql`
      UPDATE saved_journeys SET
        last_accessed_at = NOW(),
        access_count = access_count + 1
      WHERE token = ${token}
    `.catch(() => {});

    const row = rows[0];

    return res.status(200).json({
      name: row.name,
      wizardSnapshot: {
        description: row.description,
        stage: row.stage,
        provinces: row.provinces,
        need: row.need,
        sector: row.sector,
        companyUrl: row.company_url,
        productType: row.product_type,
        expansionProvinces: row.expansion_provinces,
        completedPrograms: row.completed_programs,
      },
      pathwayData: row.pathway_data,
      savedAt: row.created_at,
      notifyNewPrograms: row.notify_new_programs,
      lastSummaryText: row.last_summary_text || null,
      lastSummaryAt: row.last_summary_at || null,
    });
  } catch (e) {
    console.error("Journey restore error:", e);
    return res.status(500).json({ error: "Failed to restore journey. Please try again." });
  }
}
