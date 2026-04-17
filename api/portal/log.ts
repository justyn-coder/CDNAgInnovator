import type { VercelRequest, VercelResponse } from "@vercel/node";
import nodemailer from "nodemailer";
import { portalCors, verifyPerson, logEvent, sql } from "../_lib/portal.js";

async function maybeSendFirstVisitEmail(org: string, person: string, displayName: string) {
  const user = process.env.GMAIL_USER;
  const pass = process.env.GMAIL_APP_PASSWORD;
  const to = process.env.NOTIFY_EMAIL;
  if (!user || !pass || !to) return;

  const rows = await sql`
    SELECT first_seen_at, last_seen_at
    FROM portal_people
    WHERE org = ${org} AND person = ${person}
    LIMIT 1
  `;
  const row = (rows as any[])[0];
  if (!row) return;

  const firstSeen = row.first_seen_at ? new Date(row.first_seen_at).getTime() : null;
  if (!firstSeen) return;
  const ageMs = Date.now() - firstSeen;
  if (ageMs > 90 * 1000) return;

  try {
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: { user, pass },
    });
    await transporter.sendMail({
      from: `Trellis Portal <${user}>`,
      to,
      subject: `${displayName} just opened the ${org} portal`,
      text: [
        `${displayName} (${person}) opened the ${org} partner portal for the first time just now.`,
        ``,
        `Admin dashboard: https://trellisag.ca/admin/partners/${org}`,
      ].join("\n"),
    });
  } catch (e) {
    console.error("first-visit email failed:", e);
  }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (!portalCors(req, res)) return;
  if (req.method !== "POST") return res.status(405).end();

  const { org, person, path, event_type = "view", metadata = {} } = req.body || {};
  const identity = await verifyPerson(org, person);
  if (!identity) return res.status(404).json({ error: "unknown portal identity" });

  await logEvent({ req, org, person, event_type, path, metadata });

  if (event_type === "view") {
    await maybeSendFirstVisitEmail(org, person, identity.display_name);
  }

  return res.status(200).json({ ok: true });
}
