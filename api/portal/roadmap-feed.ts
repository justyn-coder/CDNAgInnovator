import type { VercelRequest, VercelResponse } from "@vercel/node";
import { portalCors, verifyPerson, sql } from "../_lib/portal.js";

// Team roadmap feed: all endorsed + draft mockups the team has generated.
// This is the public team view of the sandbox output.
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (!portalCors(req, res)) return;
  if (req.method !== "GET") return res.status(405).end();

  const org = String(req.query.org || "");
  const person = String(req.query.person || "");
  const identity = await verifyPerson(org, person);
  if (!identity) return res.status(404).json({ error: "unknown portal identity" });

  const rows = await sql`
    SELECT pfr.id, pfr.person, pfr.prompt, pfr.mockup_html, pfr.status, pfr.created_at,
           pp.display_name AS author_name
    FROM portal_feature_requests pfr
    JOIN portal_people pp ON pp.org = pfr.org AND pp.person = pfr.person
    WHERE pfr.org = ${org}
      AND pfr.status IN ('endorsed', 'draft')
      AND pfr.visibility = 'team'
    ORDER BY
      CASE pfr.status WHEN 'endorsed' THEN 0 ELSE 1 END,
      pfr.created_at DESC
    LIMIT 60
  `;

  return res.status(200).json({ mockups: rows });
}
