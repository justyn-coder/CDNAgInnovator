import type { VercelRequest, VercelResponse } from "@vercel/node";
import { portalCors, verifyPerson, logEvent, sql } from "../_lib/portal.js";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (!portalCors(req, res)) return;

  if (req.method === "GET") {
    const org = String(req.query.org || "");
    const person = String(req.query.person || "");
    const identity = await verifyPerson(org, person);
    if (!identity) return res.status(404).json({ error: "unknown portal identity" });

    const yours = await sql`
      SELECT ppv.program_id, p.name, p.category, p.province, p.status
      FROM portal_priority_votes ppv
      JOIN programs p ON p.id = ppv.program_id
      WHERE ppv.org = ${org} AND ppv.person = ${person}
      ORDER BY ppv.created_at DESC
    `;

    const teamCounts = await sql`
      SELECT program_id, COUNT(*) AS cnt
      FROM portal_priority_votes
      WHERE org = ${org} AND person != ${person}
      GROUP BY program_id
    `;

    return res.status(200).json({ yours, teamCounts });
  }

  if (req.method === "POST") {
    const { org, person, program_id, vote } = req.body || {};
    const identity = await verifyPerson(org, person);
    if (!identity) return res.status(404).json({ error: "unknown portal identity" });

    if (!program_id || !Number.isInteger(Number(program_id))) {
      return res.status(400).json({ error: "program_id required" });
    }

    if (vote === "remove") {
      await sql`
        DELETE FROM portal_priority_votes
        WHERE org = ${org} AND person = ${person} AND program_id = ${Number(program_id)}
      `;
    } else {
      await sql`
        INSERT INTO portal_priority_votes (org, person, program_id)
        VALUES (${org}, ${person}, ${Number(program_id)})
        ON CONFLICT (org, person, program_id) DO NOTHING
      `;
    }

    await logEvent({
      req, org, person,
      event_type: "priority_" + (vote === "remove" ? "remove" : "add"),
      path: "/portal/priority",
      metadata: { program_id: Number(program_id) },
    });

    return res.status(200).json({ ok: true });
  }

  return res.status(405).end();
}
