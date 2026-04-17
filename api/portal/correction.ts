import type { VercelRequest, VercelResponse } from "@vercel/node";
import nodemailer from "nodemailer";
import { portalCors, verifyPerson, logEvent, sql } from "../_lib/portal.js";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (!portalCors(req, res)) return;
  if (req.method !== "POST") return res.status(405).end();

  const { org, person, program_id, field, current_value, suggested_value, note } = req.body || {};
  const identity = await verifyPerson(org, person);
  if (!identity) return res.status(404).json({ error: "unknown portal identity" });

  if (!program_id || !field || !suggested_value) {
    return res.status(400).json({ error: "program_id, field, and suggested_value required" });
  }

  // Store correction in submissions table (reusing existing feedback plumbing).
  const programRows = await sql`SELECT name FROM programs WHERE id = ${Number(program_id)} LIMIT 1`;
  const programName = (programRows as any[])[0]?.name || `Program #${program_id}`;

  const body = [
    `Program: ${programName} (id ${program_id})`,
    `Field: ${field}`,
    `Current: ${current_value || "(empty)"}`,
    `Suggested: ${suggested_value}`,
    note ? `Note: ${note}` : "",
  ].filter(Boolean).join("\n");

  await sql`
    INSERT INTO submissions (program_name, best_for, submitter_name, submitter_email)
    VALUES (${`CORRECTION: ${programName}`}, ${body}, ${identity.display_name}, ${identity.email || "no-email"})
  `;

  await logEvent({
    req, org, person,
    event_type: "correction_submit",
    path: "/portal/programs",
    metadata: { program_id: Number(program_id), field: String(field) },
  });

  // Email notification
  const user = process.env.GMAIL_USER;
  const pass = process.env.GMAIL_APP_PASSWORD;
  const to = process.env.NOTIFY_EMAIL;
  if (user && pass && to) {
    try {
      const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: { user, pass },
      });
      await transporter.sendMail({
        from: `Trellis Portal <${user}>`,
        to,
        subject: `${identity.display_name} flagged a correction on ${programName}`,
        text: [
          `From: ${identity.display_name} (${org})`,
          ``,
          body,
          ``,
          `Admin: https://trellisag.ca/admin/partners/${org}`,
        ].join("\n"),
      });
    } catch (e) {
      console.error("correction email failed:", e);
    }
  }

  return res.status(200).json({ ok: true });
}
