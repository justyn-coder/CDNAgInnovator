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

const PROVINCE_LABELS: Record<string, string> = {
  AB: "Alberta", SK: "Saskatchewan", MB: "Manitoba", ON: "Ontario",
  BC: "British Columbia", QC: "Quebec", Atlantic: "Atlantic", National: "National",
};

async function sendJourneyEmail(
  email: string,
  name: string | null,
  token: string,
  stage: string,
  provinces: string[],
  need: string,
  topPrograms: string[],
  notifyNewPrograms: boolean,
) {
  const user = process.env.GMAIL_USER;
  const pass = process.env.GMAIL_APP_PASSWORD;
  if (!user || !pass) return;

  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: { user, pass },
  });

  const link = `https://trellisag.ca/navigator?journey=${token}`;
  const greeting = name ? `Hi ${name},` : "Hi there,";
  const stageLabel = STAGE_LABELS[stage] || stage;
  const provLabels = provinces.map(p => PROVINCE_LABELS[p] || p).join(", ");
  const needLabel = NEED_LABELS[need] || need;
  const programList = topPrograms.length > 0
    ? topPrograms.map((p, i) => `  ${i + 1}. ${p}`).join("\n")
    : "  (See your full pathway at the link above)";

  const notifyLine = notifyNewPrograms
    ? "\nYou'll also get updates when new programs match your profile.\nWe check weekly. No spam.\n"
    : "";

  await transporter.sendMail({
    from: `Trellis <${user}>`,
    to: email,
    subject: "Your Trellis Innovation Pathway",
    text: [
      greeting,
      "",
      "Your innovation pathway is saved. Come back to it anytime:",
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
  });
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (!setCors(req, res)) return;
  if (req.method !== "POST") return res.status(405).end();

  const allowed = await checkRateLimit(req, res, {
    maxRequests: 3, windowSeconds: 60, endpoint: "journey-save",
  });
  if (!allowed) return;

  try {
    const { email, name, wizardSnapshot, pathwayData, notifyNewPrograms, lastSummaryText } = req.body;

    // Validate required fields
    if (!email || !EMAIL_RE.test(email)) {
      return res.status(400).json({ error: "Valid email is required" });
    }
    if (!wizardSnapshot?.description || !wizardSnapshot?.stage ||
        !wizardSnapshot?.provinces?.length || !wizardSnapshot?.need) {
      return res.status(400).json({ error: "Missing wizard data" });
    }
    if (!pathwayData) {
      return res.status(400).json({ error: "Missing pathway data" });
    }

    const emailLower = email.trim().toLowerCase();

    // Check if email already has an active journey
    const existing = await sql`
      SELECT token FROM saved_journeys
      WHERE email = ${emailLower} AND status = 'active'
      LIMIT 1
    `;

    let isUpdate = false;
    let token: string;

    const summaryText = typeof lastSummaryText === "string" && lastSummaryText.trim().length > 0
      ? lastSummaryText.trim().slice(0, 2000)
      : null;

    if (existing.length > 0) {
      // Update existing journey (keep same token)
      isUpdate = true;
      token = existing[0].token;
      await sql`
        UPDATE saved_journeys SET
          name = ${name?.trim() || null},
          description = ${wizardSnapshot.description},
          stage = ${wizardSnapshot.stage},
          provinces = ${wizardSnapshot.provinces},
          need = ${wizardSnapshot.need},
          sector = ${wizardSnapshot.sector || null},
          company_url = ${wizardSnapshot.companyUrl || null},
          product_type = ${wizardSnapshot.productType || null},
          expansion_provinces = ${wizardSnapshot.expansionProvinces || null},
          completed_programs = ${wizardSnapshot.completedPrograms || null},
          pathway_data = ${sql.json(pathwayData)},
          notify_new_programs = ${!!notifyNewPrograms},
          last_summary_text = COALESCE(${summaryText}, last_summary_text),
          last_summary_at = CASE WHEN ${summaryText}::text IS NOT NULL THEN NOW() ELSE last_summary_at END,
          updated_at = NOW()
        WHERE email = ${emailLower} AND status = 'active'
      `;
    } else {
      // Insert new journey
      const result = await sql`
        INSERT INTO saved_journeys (
          email, name, description, stage, provinces, need,
          sector, company_url, product_type, expansion_provinces,
          completed_programs, pathway_data, notify_new_programs,
          last_summary_text, last_summary_at
        ) VALUES (
          ${emailLower},
          ${name?.trim() || null},
          ${wizardSnapshot.description},
          ${wizardSnapshot.stage},
          ${wizardSnapshot.provinces},
          ${wizardSnapshot.need},
          ${wizardSnapshot.sector || null},
          ${wizardSnapshot.companyUrl || null},
          ${wizardSnapshot.productType || null},
          ${wizardSnapshot.expansionProvinces || null},
          ${wizardSnapshot.completedPrograms || null},
          ${sql.json(pathwayData)},
          ${!!notifyNewPrograms},
          ${summaryText},
          ${summaryText ? new Date().toISOString() : null}
        ) RETURNING token
      `;
      token = result[0].token;
    }

    // Extract top program names for email
    const topPrograms: string[] = [];
    try {
      const steps = pathwayData?.pathway?.steps || [];
      for (const step of steps.slice(0, 3)) {
        if (step.program_name) topPrograms.push(step.program_name);
      }
    } catch {}

    // Fire-and-forget email
    sendJourneyEmail(
      emailLower, name?.trim() || null, token,
      wizardSnapshot.stage, wizardSnapshot.provinces, wizardSnapshot.need,
      topPrograms, !!notifyNewPrograms,
    ).catch(() => {});

    return res.status(isUpdate ? 200 : 201).json({ ok: true, isUpdate });
  } catch (e: any) {
    console.error("Journey save error:", e?.message || e, e?.stack || "");
    return res.status(500).json({ error: "Failed to save journey. Please try again." });
  }
}
