import type { VercelRequest, VercelResponse } from "@vercel/node";
import { portalCors, verifyPerson, sql } from "../_lib/portal.js";

// Returns the set of programs associated with the partner org (by name/description match).
// For BioEnterprise, this pulls the 7 direct entries plus any where the notes reference the org.
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (!portalCors(req, res)) return;
  if (req.method !== "GET") return res.status(405).end();

  const org = String(req.query.org || "");
  const person = String(req.query.person || "");
  const identity = await verifyPerson(org, person);
  if (!identity) return res.status(404).json({ error: "unknown portal identity" });

  // Search term: use the human name of the org.
  const orgSearchTerm = org === "bioenterprise" ? "bioenterprise" : org;

  const rows = await sql.unsafe(
    `SELECT id, name, category, province, stage, status, description, website, notes, confidence, verified_at
     FROM programs
     WHERE name ILIKE $1 OR description ILIKE $1 OR notes ILIKE $1
     ORDER BY
       CASE WHEN name ILIKE $1 THEN 0 ELSE 1 END,
       CASE status WHEN 'verified' THEN 0 WHEN 'active' THEN 1 WHEN 'unverified' THEN 2 ELSE 3 END,
       name`,
    [`%${orgSearchTerm}%`]
  );

  // Separate into direct-owned vs. partnership-referenced
  const results = (rows as any[]).map((r) => {
    const nameMatch = (r.name || "").toLowerCase().includes(orgSearchTerm.toLowerCase());
    return { ...r, ownership: nameMatch ? "direct" : "partnership" };
  });

  return res.status(200).json({ programs: results });
}
