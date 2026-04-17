import type { VercelRequest, VercelResponse } from "@vercel/node";
import { portalCors, verifyPerson, logEvent, sql } from "../_lib/portal.js";

const SYSTEM_PROMPT = `You are a senior UI designer for Trellis (Canada's agtech ecosystem navigation tool).
Trellis uses: DM Serif Display for headings, DM Sans for body, warm amber/gold accents (#D4A828, #C4A052), forest green primary (#1B4332, #2D5A3D), cream background (#FAFAF7), soft borders (#E8E5E0), generous whitespace, card-based layouts.

The user is a partner (an accelerator operator, grant writer, or director at BioEnterprise) proposing a feature they'd want to see in Trellis. Your job is to generate a self-contained HTML mockup that shows them what that feature might look like.

RULES:
- Output ONLY a single <div> with inline styles. No <html>, no <head>, no <body>, no <script>, no external stylesheets, no external images, no fonts imports. Only inline styles.
- Use SVG for any icons. Never <img>. Never <script>.
- Fit naturally into Trellis's editorial aesthetic: DM Serif for headings (fall back to Georgia, serif), DM Sans for body (fall back to system-ui, sans-serif).
- Design the feature as it would appear on a desktop screen. Use realistic sample data (real-sounding Canadian agtech program names, real provinces, real funding amounts).
- Make it feel polished, not a wireframe. Real buttons, real card shadows, real spacing.
- Include one or two concrete interaction hints (a primary button, a small tag, a subtle "new" label) so they can imagine using it.
- 500-800px wide. Clean. Professional. Read-to-ship feel.
- Do NOT include any text that says "mockup" or "concept" — act as if this is shipped.
- If the feature they describe is ambiguous, make reasonable assumptions and build something anyway.
- Keep the output under 4000 characters.

Respond ONLY with the raw HTML. No markdown fences, no preamble.`;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (!portalCors(req, res)) return;
  if (req.method !== "POST") return res.status(405).end();

  const { org, person, prompt } = req.body || {};
  const identity = await verifyPerson(org, person);
  if (!identity) return res.status(404).json({ error: "unknown portal identity" });
  if (!prompt || String(prompt).trim().length < 8) {
    return res.status(400).json({ error: "prompt too short" });
  }

  const cleanPrompt = String(prompt).slice(0, 600);

  try {
    const apiRes = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY || "",
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: process.env.CLAUDE_SONNET_MODEL || "claude-sonnet-4-6",
        max_tokens: 2400,
        system: SYSTEM_PROMPT,
        messages: [{ role: "user", content: cleanPrompt }],
      }),
    });

    const data = await apiRes.json() as any;
    if (!apiRes.ok) {
      console.error("Sandbox Anthropic error:", apiRes.status, data?.error);
      return res.status(502).json({ error: "AI generation failed" });
    }

    let html = (data.content?.[0]?.text || "").trim();
    html = html.replace(/^```html\s*/i, "").replace(/```$/, "").trim();
    html = html.replace(/<script[\s\S]*?<\/script>/gi, "");
    html = html.replace(/<iframe[\s\S]*?<\/iframe>/gi, "");
    html = html.replace(/\son\w+\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, "");
    html = html.replace(/javascript:/gi, "");

    const inserted = await sql`
      INSERT INTO portal_feature_requests (org, person, prompt, mockup_html, status)
      VALUES (${org}, ${person}, ${cleanPrompt}, ${html}, 'draft')
      RETURNING id, status, created_at
    `;
    const row = (inserted as any[])[0];

    await logEvent({
      req, org, person,
      event_type: "sandbox_generate",
      path: "/portal/sandbox",
      metadata: { request_id: row.id, prompt_len: cleanPrompt.length },
    });

    return res.status(200).json({ ok: true, id: row.id, mockup_html: html });
  } catch (e) {
    console.error("Sandbox error:", e);
    return res.status(500).json({ error: String(e) });
  }
}
