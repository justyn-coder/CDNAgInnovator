import type { VercelRequest, VercelResponse } from "@vercel/node";
import postgres from "postgres";
import { checkRateLimit, setCors } from "../_lib/rate-limit.js";

export const config = { maxDuration: 30 };

const conn = process.env.POSTGRES_URL || process.env.DATABASE_URL || "";
const sql = postgres(conn, { ssl: "require", max: 1 });

const SYSTEM_PROMPT = `You are Trellis, a Canadian agtech navigation tool. You are writing a short, specific wrap-up summary for a founder who just ran the wizard and saw their pathway. The purpose is to show them that Trellis paid attention to their inputs, and to give them something to take with them.

Voice rules (hard):
- Address the founder in second person. Do not talk about them in third person.
- No flattery. No "great to have you." Name the specifics.
- Never use em-dashes, en-dashes, or semicolons. Use commas, periods, or parentheses.
- Be specific. Cite their stage, province, sector, primary need, and at least one concrete program name from the pathway if the pathway is non-empty.
- 3 to 5 sentences. Between 60 and 140 words. No headings, no lists, just flowing prose.
- Do not end with "Good luck" or similar filler. End with the most actionable next thought.

Output: plain text only. No JSON, no markdown, no fences. Just the summary.`;

interface WizardSnapshot {
  description?: string;
  stage?: string;
  provinces?: string[];
  need?: string;
  sector?: string;
  company_url?: string;
  product_type?: string;
  expansion_provinces?: string[];
}

interface PathwayStep {
  program_name?: string;
  program_id?: string;
  rationale?: string;
  timing?: string;
}

interface PathwayData {
  pathway?: { steps?: PathwayStep[]; gap_warnings?: string[] } | null;
}

function sanitizeSummary(raw: string): string {
  return String(raw || "")
    .replace(/\u2014|\u2013/g, ",") // em/en-dash -> comma fallback
    .replace(/[;]/g, ".") // semicolons -> periods
    .replace(/^```(?:text)?\s*/i, "")
    .replace(/```\s*$/i, "")
    .trim();
}

function buildUserPrompt(snapshot: WizardSnapshot, pathway: PathwayData | null): string {
  const lines: string[] = [];
  lines.push("Founder wizard inputs:");
  lines.push(`- Description: ${snapshot.description || "(not provided)"}`);
  lines.push(`- Stage: ${snapshot.stage || "(not provided)"}`);
  lines.push(`- Provinces: ${(snapshot.provinces || []).join(", ") || "(not provided)"}`);
  lines.push(`- Primary need: ${snapshot.need || "(not provided)"}`);
  if (snapshot.sector) lines.push(`- Sector: ${snapshot.sector}`);
  if (snapshot.product_type) lines.push(`- Product type: ${snapshot.product_type}`);
  if (snapshot.expansion_provinces?.length) lines.push(`- Expanding to: ${snapshot.expansion_provinces.join(", ")}`);
  if (snapshot.company_url) lines.push(`- Company URL: ${snapshot.company_url}`);

  const steps = pathway?.pathway?.steps || [];
  if (steps.length > 0) {
    lines.push("\nPathway Trellis generated for them (top 5):");
    steps.slice(0, 5).forEach((s, i) => {
      lines.push(`${i + 1}. ${s.program_name || "(unnamed)"}${s.timing ? ` (${s.timing})` : ""}`);
    });
  }

  const gaps = pathway?.pathway?.gap_warnings || [];
  if (gaps.length > 0) {
    lines.push("\nGap warnings surfaced:");
    gaps.slice(0, 3).forEach((g) => lines.push(`- ${g}`));
  }

  lines.push("\nWrite the wrap-up summary now. Plain text only.");
  return lines.join("\n");
}

async function callClaude(userPrompt: string): Promise<string> {
  const resp = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": process.env.ANTHROPIC_API_KEY || "",
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: process.env.CLAUDE_SONNET_MODEL || "claude-sonnet-4-6",
      max_tokens: 600,
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: userPrompt }],
    }),
  });
  if (!resp.ok) {
    const body = await resp.text().catch(() => "");
    throw new Error(`Anthropic ${resp.status}: ${body.slice(0, 200)}`);
  }
  const data = (await resp.json()) as any;
  return sanitizeSummary(data.content?.[0]?.text || "");
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (!setCors(req, res)) return;
  if (req.method !== "POST") return res.status(405).end();

  const allowed = await checkRateLimit(req, res, { maxRequests: 5, windowSeconds: 60, endpoint: "navigator-summary" });
  if (!allowed) return;

  try {
    const { wizardSnapshot, pathwayData, journeyToken } = req.body || {};
    if (!wizardSnapshot || typeof wizardSnapshot !== "object") {
      return res.status(400).json({ error: "wizardSnapshot required" });
    }

    let effectiveSnapshot: WizardSnapshot = wizardSnapshot;
    let effectivePathway: PathwayData | null = pathwayData || null;

    // If a journeyToken is provided, enrich from the saved row (defense: a client
    // could skip the snapshot). Token is opaque uuid; no PII exposed in response.
    if (typeof journeyToken === "string" && journeyToken.length > 0) {
      const rows = await sql`
        SELECT description, stage, provinces, need, sector, product_type,
               expansion_provinces, company_url, pathway_data
        FROM saved_journeys
        WHERE token = ${journeyToken} AND status = 'active'
        LIMIT 1
      `;
      if (rows.length > 0) {
        const r = rows[0];
        effectiveSnapshot = {
          description: r.description,
          stage: r.stage,
          provinces: r.provinces,
          need: r.need,
          sector: r.sector,
          product_type: r.product_type,
          expansion_provinces: r.expansion_provinces,
          company_url: r.company_url,
          ...wizardSnapshot, // client-sent snapshot wins for any overlapping fields
        };
        effectivePathway = r.pathway_data || effectivePathway;
      }
    }

    const userPrompt = buildUserPrompt(effectiveSnapshot, effectivePathway);
    const summary = await callClaude(userPrompt);

    return res.status(200).json({ ok: true, summary });
  } catch (e: any) {
    console.error("Navigator summary error:", e?.message || e);
    return res.status(502).json({ error: "summary generation failed", detail: String(e?.message || e).slice(0, 200) });
  }
}
