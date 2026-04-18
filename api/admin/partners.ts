import type { VercelRequest, VercelResponse } from "@vercel/node";
import { sql } from "../_lib/portal.js";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Admin-only endpoint: bearer token required
  const auth = req.headers.authorization || "";
  const token = auth.replace(/^Bearer\s+/i, "");
  if (!token || token !== process.env.ADMIN_SECRET) {
    return res.status(401).json({ error: "unauthorized" });
  }
  if (req.method !== "GET") return res.status(405).end();

  const org = String(req.query.org || "bioenterprise");

  // People/feedback/features/priorities exclude Justyn's admin-preview identity so
  // the real partner numbers aren't polluted by his own clicks. The activity
  // timeline keeps him in so he can still see his actions for debugging.
  const people = await sql`
    SELECT person, display_name, role, email, first_seen_at, last_seen_at
    FROM portal_people
    WHERE org = ${org} AND person != 'justyn'
    ORDER BY display_name
  `;

  const activity = await sql`
    SELECT person, event_type, path, metadata, created_at
    FROM portal_access_log
    WHERE org = ${org}
    ORDER BY created_at DESC
    LIMIT 300
  `;

  const feedback = await sql`
    SELECT id, person, topic, body, created_at
    FROM portal_feedback
    WHERE org = ${org} AND person != 'justyn'
    ORDER BY created_at DESC
    LIMIT 100
  `;

  const features = await sql`
    SELECT id, person, prompt, status, created_at
    FROM portal_feature_requests
    WHERE org = ${org} AND person != 'justyn'
    ORDER BY created_at DESC
    LIMIT 100
  `;

  const priorities = await sql`
    SELECT ppv.person, p.id AS program_id, p.name, p.category, p.province, ppv.created_at
    FROM portal_priority_votes ppv
    JOIN programs p ON p.id = ppv.program_id
    WHERE ppv.org = ${org} AND ppv.person != 'justyn'
    ORDER BY ppv.created_at DESC
    LIMIT 200
  `;

  return res.status(200).json({ org, people, activity, feedback, features, priorities });
}
