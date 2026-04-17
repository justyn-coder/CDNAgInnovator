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

    // Your own posts (full content)
    const yours = await sql`
      SELECT id, topic, body, created_at
      FROM portal_feedback
      WHERE org = ${org} AND person = ${person}
      ORDER BY created_at DESC
      LIMIT 50
    `;

    // Team counters by topic (no content, no authors)
    const teamCounts = await sql`
      SELECT topic, COUNT(*) AS cnt
      FROM portal_feedback
      WHERE org = ${org} AND person != ${person}
      GROUP BY topic
      ORDER BY cnt DESC
    `;

    return res.status(200).json({ yours, teamCounts });
  }

  if (req.method === "POST") {
    const { org, person, topic, body } = req.body || {};
    const identity = await verifyPerson(org, person);
    if (!identity) return res.status(404).json({ error: "unknown portal identity" });
    if (!topic || !body) return res.status(400).json({ error: "topic and body required" });
    const cleanTopic = VALID_TOPICS.includes(String(topic)) ? String(topic) : "General";
    const cleanBody = String(body).slice(0, 4000);

    const inserted = await sql`
      INSERT INTO portal_feedback (org, person, topic, body)
      VALUES (${org}, ${person}, ${cleanTopic}, ${cleanBody})
      RETURNING id, topic, body, created_at
    `;

    await logEvent({
      req, org, person,
      event_type: "feedback_submit",
      path: "/portal/feedback",
      metadata: { topic: cleanTopic, chars: cleanBody.length },
    });

    return res.status(200).json({ ok: true, post: (inserted as any[])[0] });
  }

  return res.status(405).end();
}
