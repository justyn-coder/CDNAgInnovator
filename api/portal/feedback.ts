import type { VercelRequest, VercelResponse } from "@vercel/node";
import { portalCors, verifyPerson, logEvent, sql } from "../_lib/portal.js";

const VALID_TOPICS = [
  "Gap Map",
  "Your Programs",
  "Wizard / Pathway",
  "AI Analysis",
  "Sandbox",
  "General",
];

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (!portalCors(req, res)) return;

  if (req.method === "GET") {
    const org = String(req.query.org || "");
    const person = String(req.query.person || "");
    const identity = await verifyPerson(org, person);
    if (!identity) return res.status(404).json({ error: "unknown portal identity" });

    // Your own posts (full content, with any Justyn replies attached)
    const yours = await sql`
      SELECT pf.id, pf.topic, pf.body, pf.visibility, pf.created_at,
             COALESCE(
               json_agg(json_build_object('id', pfr.id, 'body', pfr.body, 'created_at', pfr.created_at) ORDER BY pfr.created_at)
               FILTER (WHERE pfr.id IS NOT NULL),
               '[]'::json
             ) AS replies
      FROM portal_feedback pf
      LEFT JOIN portal_feedback_replies pfr ON pfr.feedback_id = pf.id
      WHERE pf.org = ${org} AND pf.person = ${person}
      GROUP BY pf.id
      ORDER BY pf.created_at DESC
      LIMIT 50
    `;

    // Team-shared posts (visibility = 'team') from others with full content + author
    const teamPublic = await sql`
      SELECT pf.id, pf.topic, pf.body, pf.created_at, pp.display_name AS author_name, pf.person AS author_person
      FROM portal_feedback pf
      JOIN portal_people pp ON pp.org = pf.org AND pp.person = pf.person
      WHERE pf.org = ${org} AND pf.person != ${person} AND pf.visibility = 'team'
      ORDER BY pf.created_at DESC
      LIMIT 50
    `;

    // Team private-post counters (content stays private)
    const teamPrivateCounts = await sql`
      SELECT topic, COUNT(*) AS cnt
      FROM portal_feedback
      WHERE org = ${org} AND person != ${person} AND visibility = 'private'
      GROUP BY topic
      ORDER BY cnt DESC
    `;

    return res.status(200).json({ yours, teamPublic, teamPrivateCounts });
  }

  if (req.method === "POST") {
    const { org, person, topic, body, visibility = "private" } = req.body || {};
    const identity = await verifyPerson(org, person);
    if (!identity) return res.status(404).json({ error: "unknown portal identity" });
    if (!topic || !body) return res.status(400).json({ error: "topic and body required" });
    const cleanTopic = VALID_TOPICS.includes(String(topic)) ? String(topic) : "General";
    const cleanBody = String(body).slice(0, 4000);
    const cleanVisibility = visibility === "team" ? "team" : "private";

    const inserted = await sql`
      INSERT INTO portal_feedback (org, person, topic, body, visibility)
      VALUES (${org}, ${person}, ${cleanTopic}, ${cleanBody}, ${cleanVisibility})
      RETURNING id, topic, body, visibility, created_at
    `;

    await logEvent({
      req, org, person,
      event_type: "feedback_submit",
      path: "/portal/feedback",
      metadata: { topic: cleanTopic, chars: cleanBody.length, visibility: cleanVisibility },
    });

    return res.status(200).json({ ok: true, post: (inserted as any[])[0] });
  }

  return res.status(405).end();
}
