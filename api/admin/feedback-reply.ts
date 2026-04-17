import type { VercelRequest, VercelResponse } from "@vercel/node";
import { sql } from "../_lib/portal.js";

// Justyn-only: reply to a portal_feedback post. Visible to the author only.
export default async function handler(req: VercelRequest, res: VercelResponse) {
  const auth = req.headers.authorization || "";
  const token = auth.replace(/^Bearer\s+/i, "");
  if (!token || token !== process.env.ADMIN_SECRET) {
    return res.status(401).json({ error: "unauthorized" });
  }
  if (req.method !== "POST") return res.status(405).end();

  const { feedback_id, body } = req.body || {};
  if (!feedback_id || !body) return res.status(400).json({ error: "feedback_id and body required" });

  const inserted = await sql`
    INSERT INTO portal_feedback_replies (feedback_id, body)
    VALUES (${Number(feedback_id)}, ${String(body).slice(0, 4000)})
    RETURNING id, body, created_at
  `;

  return res.status(200).json({ ok: true, reply: (inserted as any[])[0] });
}
