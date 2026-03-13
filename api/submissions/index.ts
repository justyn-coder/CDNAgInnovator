import type { VercelRequest, VercelResponse } from "@vercel/node";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { submissions } from "../schema.js";
import nodemailer from "nodemailer";

const conn = process.env.POSTGRES_URL || process.env.DATABASE_URL || "";
const client = postgres(conn, { ssl: "require", max: 1 });
const db = drizzle(client);

async function sendNotification(data: { programName: string; bestFor: string; submitterName: string; submitterEmail: string }) {
  const user = process.env.GMAIL_USER;
  const pass = process.env.GMAIL_APP_PASSWORD;
  const to = process.env.NOTIFY_EMAIL;
  if (!user || !pass || !to) return; // skip if not configured

  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: { user, pass },
  });

  const pageContext = data.programName.startsWith("FEEDBACK:") ? data.programName.replace("FEEDBACK:", "").trim() : "";

  await transporter.sendMail({
    from: `AgPath Feedback <${user}>`,
    to,
    subject: `New feedback from ${data.submitterName}${pageContext ? ` — ${pageContext}` : ""}`,
    text: [
      `From: ${data.submitterName} (${data.submitterEmail})`,
      pageContext ? `Page: ${pageContext}` : "",
      `---`,
      data.bestFor,
      `---`,
      `View all: https://cdn-ag-innovator.vercel.app/api/admin/feedback`,
    ].filter(Boolean).join("\n"),
  });
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") return res.status(405).end();
  try {
    const { programName, bestFor, submitterName, submitterEmail } = req.body;
    if (!programName || !bestFor || !submitterName || !submitterEmail)
      return res.status(400).json({ error: "Missing fields" });
    await db.insert(submissions).values({ programName, bestFor, submitterName, submitterEmail });
    // Fire-and-forget email — don't block the response
    sendNotification({ programName, bestFor, submitterName, submitterEmail }).catch(() => {});
    return res.status(201).json({ ok: true });
  } catch (e) {
    return res.status(500).json({ error: String(e) });
  }
}
