import type { VercelRequest, VercelResponse } from "@vercel/node";
import { portalCors, sql } from "../_lib/portal.js";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (!portalCors(req, res)) return;
  if (req.method !== "GET") return res.status(405).end();

  const q = String(req.query.q || "").trim();
  const limit = Math.min(parseInt(String(req.query.limit || "12"), 10) || 12, 50);
  if (q.length < 2) return res.status(200).json({ results: [] });

  const rows = await sql`
    SELECT id, name, category, province, stage, status
    FROM programs
    WHERE (name ILIKE ${"%" + q + "%"} OR description ILIKE ${"%" + q + "%"})
      AND status NOT IN ('dissolved')
    ORDER BY
      CASE WHEN name ILIKE ${q + "%"} THEN 0 ELSE 1 END,
      CASE status WHEN 'verified' THEN 0 WHEN 'active' THEN 1 ELSE 2 END,
      name
    LIMIT ${limit}
  `;

  return res.status(200).json({ results: rows });
}
