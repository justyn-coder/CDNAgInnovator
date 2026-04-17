import type { VercelRequest, VercelResponse } from "@vercel/node";
import { sql } from "../_lib/portal.js";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const auth = req.headers.authorization || "";
  const token = auth.replace(/^Bearer\s+/i, "");
  if (!token || token !== process.env.ADMIN_SECRET) {
    return res.status(401).json({ error: "unauthorized" });
  }
  if (req.method !== "GET") return res.status(405).end();

  const orgs = await sql`
    SELECT
      po.slug,
      po.display_name,
      po.theme_color,
      po.banner_text,
      po.tour_variant,
      (SELECT COUNT(*) FROM portal_people pp WHERE pp.org = po.slug) AS people_count,
      (SELECT COUNT(*) FROM portal_people pp WHERE pp.org = po.slug AND pp.first_seen_at IS NOT NULL) AS people_active,
      (SELECT COUNT(*) FROM portal_access_log pal WHERE pal.org = po.slug AND pal.event_type = 'view') AS views_total,
      (SELECT COUNT(*) FROM portal_access_log pal WHERE pal.org = po.slug AND pal.event_type = 'view' AND pal.created_at > NOW() - INTERVAL '7 days') AS views_7d,
      (SELECT COUNT(*) FROM portal_feedback pf WHERE pf.org = po.slug) AS feedback_count,
      (SELECT COUNT(*) FROM portal_feature_requests pfr WHERE pfr.org = po.slug) AS feature_count,
      (SELECT COUNT(DISTINCT ppv.program_id) FROM portal_priority_votes ppv WHERE ppv.org = po.slug) AS priority_count,
      (SELECT MAX(created_at) FROM portal_access_log pal WHERE pal.org = po.slug) AS last_activity
    FROM portal_orgs po
    ORDER BY po.display_name
  `;

  const recentActivity = await sql`
    SELECT pal.org, pal.person, pp.display_name, pal.event_type, pal.path, pal.created_at, po.display_name AS org_name, po.theme_color
    FROM portal_access_log pal
    LEFT JOIN portal_people pp ON pp.org = pal.org AND pp.person = pal.person
    LEFT JOIN portal_orgs po ON po.slug = pal.org
    WHERE pal.event_type = 'view'
    ORDER BY pal.created_at DESC
    LIMIT 40
  `;

  const recentFeedback = await sql`
    SELECT pf.id, pf.org, pf.person, pp.display_name, pf.topic, pf.body, pf.created_at, po.display_name AS org_name, po.theme_color
    FROM portal_feedback pf
    LEFT JOIN portal_people pp ON pp.org = pf.org AND pp.person = pf.person
    LEFT JOIN portal_orgs po ON po.slug = pf.org
    ORDER BY pf.created_at DESC
    LIMIT 15
  `;

  const totals = {
    orgs: (orgs as any[]).length,
    people: (orgs as any[]).reduce((s, o) => s + Number(o.people_count || 0), 0),
    people_active: (orgs as any[]).reduce((s, o) => s + Number(o.people_active || 0), 0),
    views_total: (orgs as any[]).reduce((s, o) => s + Number(o.views_total || 0), 0),
    views_7d: (orgs as any[]).reduce((s, o) => s + Number(o.views_7d || 0), 0),
    feedback: (orgs as any[]).reduce((s, o) => s + Number(o.feedback_count || 0), 0),
    features: (orgs as any[]).reduce((s, o) => s + Number(o.feature_count || 0), 0),
    priorities: (orgs as any[]).reduce((s, o) => s + Number(o.priority_count || 0), 0),
  };

  return res.status(200).json({ orgs, totals, recentActivity, recentFeedback });
}
