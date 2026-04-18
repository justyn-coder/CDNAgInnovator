import type { VercelRequest, VercelResponse } from "@vercel/node";
import { portalCors, verifyPerson, logEvent, sql } from "../_lib/portal.js";
import { checkRateLimit } from "../_lib/rate-limit.js";

export const config = { maxDuration: 30 };

const SYSTEM_PROMPT = `You are a senior product analyst for Trellis, a Canadian agtech ecosystem navigation tool. You are summarizing what you have learned about a specific user based on their portal activity and any existing profile.

Your output has two purposes:
1. Show the user a short, specific summary that proves you were paying attention.
2. Extract structured facts (stage, provinces, sector, primary need, short description) so the product can personalize future interactions.

Voice and style rules (hard):
- Speak to the user directly in second person. Not about them in third person.
- No flattery. No "great to have you." Name what you noticed.
- Never use em-dashes, en-dashes, or semicolons. Use commas, periods, or parentheses.
- Under 120 words for the prose summary.
- Be specific. If they poked Ontario accelerators and left feedback about the gap map, say that. If their session was thin, say that honestly and ask what they want captured.

Always return valid JSON matching this shape exactly:
{
  "summary": "<2-4 sentence prose summary addressed to the user>",
  "facts": {
    "stage": "MVP" | "Pilot" | "Comm" | "Scale" | null,
    "provinces": ["ON", "SK", ...] (ISO 3166-2 short codes, uppercase),
    "sector": "<short string like 'Precision ag / soil' or null>",
    "primary_need": "<short string like 'Bridge funding' or 'Pilot site introductions' or null>",
    "description": "<1-2 sentence description of what they are building or their role, or null>"
  }
}

Only include facts you have real evidence for. Unknown fields MUST be null, not guessed.`;

interface FactsPayload {
  stage?: string | null;
  provinces?: string[];
  sector?: string | null;
  primary_need?: string | null;
  description?: string | null;
}

interface ClaudeResponse {
  summary: string;
  facts: FactsPayload;
}

function safeParse(raw: string): ClaudeResponse | null {
  let s = raw.trim();
  s = s.replace(/^```(?:json)?\s*/i, "").replace(/```$/, "").trim();
  try {
    const parsed = JSON.parse(s);
    if (typeof parsed?.summary !== "string") return null;
    if (typeof parsed?.facts !== "object" || parsed.facts === null) return null;
    return parsed;
  } catch {
    return null;
  }
}

async function summarize(activityBlob: string): Promise<ClaudeResponse> {
  const resp = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": process.env.ANTHROPIC_API_KEY || "",
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: process.env.CLAUDE_SONNET_MODEL || "claude-sonnet-4-6",
      max_tokens: 900,
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: activityBlob }],
    }),
  });
  if (!resp.ok) {
    const body = await resp.text().catch(() => "");
    throw new Error(`Anthropic ${resp.status}: ${body.slice(0, 200)}`);
  }
  const data = (await resp.json()) as any;
  const raw = (data.content?.[0]?.text || "").trim();
  const parsed = safeParse(raw);
  if (!parsed) throw new Error("Claude returned non-JSON");
  return parsed;
}

function buildActivityBlob(identity: any, org: string, activity: any[], feedback: any[], features: any[], freeText: string): string {
  const lines: string[] = [];
  lines.push(`User: ${identity.display_name} (${identity.role || "no role set"}), slug /for/${org}/${identity.person}`);
  if (identity.email) lines.push(`Email: ${identity.email}`);
  if (identity.founder_profile) {
    lines.push(`\nExisting founder_profile (may be stale):`);
    lines.push(JSON.stringify(identity.founder_profile, null, 2));
  }
  if (freeText) {
    lines.push(`\nUser added this free-text context in the wrap-up card:`);
    lines.push(`"${freeText.slice(0, 600)}"`);
  }
  if (activity.length > 0) {
    lines.push(`\nPortal activity (last 30 days, newest first, up to 40 events):`);
    activity.slice(0, 40).forEach((a) => {
      lines.push(`- ${new Date(a.created_at).toISOString().slice(0, 16)} ${a.event_type} ${a.path || ""}`);
    });
  } else {
    lines.push(`\nNo portal activity logged yet.`);
  }
  if (feedback.length > 0) {
    lines.push(`\nFeedback they have left in the portal:`);
    feedback.slice(0, 8).forEach((f) => {
      lines.push(`- [${f.topic || "general"}] ${String(f.body).slice(0, 200)}`);
    });
  }
  if (features.length > 0) {
    lines.push(`\nFeature ideas they have submitted:`);
    features.slice(0, 8).forEach((f) => {
      lines.push(`- "${String(f.prompt).slice(0, 160)}" (${f.status})`);
    });
  }
  return lines.join("\n");
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (!portalCors(req, res)) return;
  if (req.method !== "POST") return res.status(405).end();

  const allowed = await checkRateLimit(req, res, { maxRequests: 5, windowSeconds: 60, endpoint: "portal_summary" });
  if (!allowed) return;

  const { org, person, freeText } = req.body || {};
  if (typeof org !== "string" || typeof person !== "string") {
    return res.status(400).json({ error: "org and person required" });
  }
  const identity = await verifyPerson(org, person);
  if (!identity) return res.status(404).json({ error: "unknown portal identity" });

  const activity = await sql`
    SELECT event_type, path, created_at
    FROM portal_access_log
    WHERE org = ${org} AND person = ${person} AND created_at > NOW() - INTERVAL '30 days'
    ORDER BY created_at DESC
    LIMIT 60
  `;
  const feedback = await sql`
    SELECT topic, body, created_at
    FROM portal_feedback
    WHERE org = ${org} AND person = ${person}
    ORDER BY created_at DESC
    LIMIT 10
  `;
  const features = await sql`
    SELECT prompt, status, created_at
    FROM portal_feature_requests
    WHERE org = ${org} AND person = ${person}
    ORDER BY created_at DESC
    LIMIT 10
  `;

  const blob = buildActivityBlob(
    identity,
    org,
    activity as any[],
    feedback as any[],
    features as any[],
    typeof freeText === "string" ? freeText : ""
  );

  try {
    const result = await summarize(blob);
    await logEvent({
      req, org, person,
      event_type: "summary_generate",
      path: "/portal/home",
      metadata: { free_text_len: typeof freeText === "string" ? freeText.length : 0 },
    });
    return res.status(200).json({ ok: true, ...result });
  } catch (e) {
    console.error("Summary error:", e);
    return res.status(502).json({ error: "summary generation failed", detail: String(e).slice(0, 200) });
  }
}
