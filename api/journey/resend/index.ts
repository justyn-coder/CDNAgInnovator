import type { VercelRequest, VercelResponse } from "@vercel/node";
import postgres from "postgres";
import nodemailer from "nodemailer";
import { checkRateLimit, setCors } from "../../_lib/rate-limit.js";

const conn = process.env.POSTGRES_URL || process.env.DATABASE_URL || "";
const sql = postgres(conn, { ssl: "require", max: 1 });

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const STAGE_LABELS: Record<string, string> = {
  Idea: "Idea", MVP: "MVP", Pilot: "Pilot",
  Comm: "First Customers", Scale: "Scale",
};

const PROVINCE_LABELS: Record<string, string> = {
  AB: "Alberta", SK: "Saskatchewan", MB: "Manitoba", ON: "Ontario",
  BC: "British Columbia", QC: "Quebec", Atlantic: "Atlantic", National: "National",
};

const NEED_LABELS: Record<string, string> = {
  "non-dilutive-capital": "Funding",
  "validate-with-farmers": "Validation",
  "structured-program": "Structured Program",
  "pilot-site-field-validation": "Pilot Site",
  "credibility-validation": "Credibility",
  "first-customers": "First Customers",
  "channel-distribution": "Distribution",
  "go-to-market": "GTM Strategy",
  "growth-capital": "Growth Capital",
  "industry-connections": "Industry Connections",
  "accelerator": "Accelerator",
  "market-expansion": "New Markets",
  "all": "All Programs",
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (!setCors(req, res)) return;
  if (req.method !== "POST") return res.status(405).end();

  const allowed = await checkRateLimit(req, res, {
    maxRequests: 2, windowSeconds: 60, endpoint: "journey-resend",
  });
  if (!allowed) return;

  try {
    const { email } = req.body;
    if (!email || !EMAIL_RE.test(email)) {
      return res.status(400).json({ error: "Valid email is required" });
    }

    const emailLower = email.trim().toLowerCase();

    // Always return ok:true regardless of whether email exists (no info leakage)
    const rows = await sql`
      SELECT token, name, stage, provinces, need, pathway_data, notify_new_programs
      FROM saved_journeys
      WHERE email = ${emailLower} AND status = 'active'
      LIMIT 1
    `;

    if (rows.length > 0) {
      const row = rows[0];
      const user = process.env.GMAIL_USER;
      const pass = process.env.GMAIL_APP_PASSWORD;

      if (user && pass) {
        const transporter = nodemailer.createTransport({
          service: "gmail",
          auth: { user, pass },
        });

        const link = `https://trellisag.ca/navigator?journey=${row.token}`;
        const greeting = row.name ? `Hi ${row.name},` : "Hi there,";
        const stageLabel = STAGE_LABELS[row.stage] || row.stage;
        const provLabels = (row.provinces || []).map((p: string) => PROVINCE_LABELS[p] || p).join(", ");
        const needLabel = NEED_LABELS[row.need] || row.need;

        const topPrograms: string[] = [];
        try {
          const steps = row.pathway_data?.pathway?.steps || [];
          for (const step of steps.slice(0, 3)) {
            if (step.program_name) topPrograms.push(step.program_name);
          }
        } catch {}

        const programList = topPrograms.length > 0
          ? topPrograms.map((p: string, i: number) => `  ${i + 1}. ${p}`).join("\n")
          : "  (See your full pathway at the link above)";

        const notifyLine = row.notify_new_programs
          ? "\nYou're subscribed to program match updates (weekly, no spam).\n"
          : "";

        // Fire-and-forget
        transporter.sendMail({
          from: `Trellis <${user}>`,
          to: emailLower,
          subject: "Your Trellis Innovation Pathway Link",
          text: [
            greeting,
            "",
            "Here's your saved pathway link:",
            "",
            link,
            "",
            "Your snapshot:",
            `  Stage: ${stageLabel}`,
            `  Province: ${provLabels}`,
            `  Focus: ${needLabel}`,
            `  Top programs:`,
            programList,
            notifyLine,
            "Bookmark the link above or find this email later.",
            "",
            "-- Trellis",
            "https://trellisag.ca",
          ].join("\n"),
        }).catch(() => {});
      }
    }

    // Always return success (no info leakage)
    return res.status(200).json({ ok: true });
  } catch (e) {
    console.error("Journey resend error:", e);
    return res.status(500).json({ error: "Something went wrong. Please try again." });
  }
}
