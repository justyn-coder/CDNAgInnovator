import type { VercelRequest, VercelResponse } from "@vercel/node";
import { portalCors, verifyPerson, getOrgConfig, sql } from "../_lib/portal.js";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (!portalCors(req, res)) return;
  if (req.method !== "GET") return res.status(405).end();

  const org = String(req.query.org || "");
  const person = String(req.query.person || "");
  const identity = await verifyPerson(org, person);
  if (!identity) return res.status(404).json({ error: "unknown portal identity" });

  const orgConfig = await getOrgConfig(org);

  // Team activity: per-person event counts in the last 30 days (counters only, no content)
  const teamActivityRows = await sql`
    SELECT pp.person, pp.display_name,
           COUNT(DISTINCT pal.id) FILTER (WHERE pal.event_type = 'view') AS views,
           COUNT(DISTINCT pf.id) AS feedback_count,
           COUNT(DISTINCT pfr.id) FILTER (WHERE pfr.status IN ('draft','endorsed')) AS feature_count,
           COUNT(DISTINCT ppv.program_id) AS priority_count,
           MAX(pal.created_at) AS last_seen
    FROM portal_people pp
    LEFT JOIN portal_access_log pal ON pal.org = pp.org AND pal.person = pp.person AND pal.created_at > NOW() - INTERVAL '30 days'
    LEFT JOIN portal_feedback pf ON pf.org = pp.org AND pf.person = pp.person AND pf.created_at > NOW() - INTERVAL '30 days'
    LEFT JOIN portal_feature_requests pfr ON pfr.org = pp.org AND pfr.person = pp.person
    LEFT JOIN portal_priority_votes ppv ON ppv.org = pp.org AND ppv.person = pp.person
    WHERE pp.org = ${org} AND pp.person != ${person}
    GROUP BY pp.person, pp.display_name
    ORDER BY pp.display_name
  `;

  // Your activity summary (for "since last visit" and your own totals)
  const yourSummaryRows = await sql`
    SELECT
      (SELECT COUNT(*) FROM portal_feedback WHERE org = ${org} AND person = ${person}) AS your_feedback,
      (SELECT COUNT(*) FROM portal_feature_requests WHERE org = ${org} AND person = ${person}) AS your_features,
      (SELECT COUNT(*) FROM portal_priority_votes WHERE org = ${org} AND person = ${person}) AS your_priorities,
      (SELECT MAX(created_at) FROM portal_access_log WHERE org = ${org} AND person = ${person} AND event_type = 'view' AND created_at < NOW() - INTERVAL '5 minutes') AS last_visit
  `;

  return res.status(200).json({
    identity,
    orgConfig,
    you: (yourSummaryRows as any[])[0],
    team: teamActivityRows,
  });
}
