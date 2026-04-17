import type { VercelRequest, VercelResponse } from "@vercel/node";
import { portalCors, verifyPerson, logEvent, sql } from "../_lib/portal.js";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (!portalCors(req, res)) return;
  if (req.method !== "POST") return res.status(405).end();

  const { org, person, id, action } = req.body || {};
  const identity = await verifyPerson(org, person);
  if (!identity) return res.status(404).json({ error: "unknown portal identity" });

  const requestId = Number(id);
  if (!Number.isInteger(requestId)) return res.status(400).json({ error: "id required" });

  const newStatus = action === "endorse" ? "endorsed" : action === "discard" ? "discarded" : null;
  if (!newStatus) return res.status(400).json({ error: "action must be endorse or discard" });

  await sql`
    UPDATE portal_feature_requests
    SET status = ${newStatus}
    WHERE id = ${requestId} AND org = ${org} AND person = ${person}
  `;

  await logEvent({
    req, org, person,
    event_type: `roadmap_${newStatus}`,
    path: "/portal/sandbox",
    metadata: { request_id: requestId },
  });

  return res.status(200).json({ ok: true });
}
