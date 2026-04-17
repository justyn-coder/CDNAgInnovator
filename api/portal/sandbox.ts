import type { VercelRequest, VercelResponse } from "@vercel/node";
import { portalCors, verifyPerson, logEvent, sql } from "../_lib/portal.js";

const SYSTEM_PROMPT = `You are a senior UI designer for Trellis (Canada's agtech ecosystem navigation tool).
Trellis uses: DM Serif Display for headings, DM Sans for body, warm amber/gold accents (#D4A828, #C4A052), forest green primary (#1B4332, #2D5A3D), cream background (#FAFAF7), soft borders (#E8E5E0), generous whitespace, card-based layouts.

The user is a partner (accelerator operator, grant writer, or director at BioEnterprise) proposing a feature they'd want to see in Trellis.

Your job: generate THREE distinct design variants of the feature, each taking a different angle. Variant 1 should be the most literal interpretation; variant 2 should surface a different dimension of the same idea (e.g., a different primary axis, a different hierarchy, or inverted emphasis); variant 3 should be a more ambitious take that adds an intelligence layer or interaction the user probably wasn't imagining.

RULES for each variant:
- Never use em-dashes, en-dashes, or semicolons anywhere in the copy. Use commas, periods, colons, or parentheses instead.
- Output only a single self-contained <div> with inline styles. No <html>/<head>/<body>/<script>/<iframe>/<link>/<img>. No external resources.
- Use inline SVG for icons.
- Use DM Serif Display (with Georgia fallback) for headings, DM Sans (system-ui fallback) for body.
- Width 560-740px, designed for a desktop card.
- Realistic sample data: real Canadian agtech program names, provinces, dollar figures, dates.
- Feel polished, not wireframe. Real shadows, real spacing, real buttons with labels.
- No text like "mockup" or "concept". Design as if shipped.
- Under 2800 characters per variant.

Respond as a single JSON object with this exact shape, no markdown fences, no preamble:
{
  "variants": [
    { "angle": "short label (3-5 words) describing this variant's take", "html": "<div style=...>...</div>" },
    { "angle": "...", "html": "..." },
    { "angle": "...", "html": "..." }
  ]
}`;

function sanitize(html: string): string {
  let h = String(html || "").trim();
  h = h.replace(/^```(?:html|json)?\s*/i, "").replace(/```$/, "").trim();
  h = h.replace(/<script[\s\S]*?<\/script>/gi, "");
  h = h.replace(/<iframe[\s\S]*?<\/iframe>/gi, "");
  h = h.replace(/<link[^>]*>/gi, "");
  h = h.replace(/\son\w+\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, "");
  h = h.replace(/javascript:/gi, "");
  return h;
}

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
        max_tokens: 8000,
        system: SYSTEM_PROMPT,
        messages: [{ role: "user", content: cleanPrompt }],
      }),
    });

    const data = await apiRes.json() as any;
    if (!apiRes.ok) {
      console.error("Sandbox Anthropic error:", apiRes.status, data?.error);
      return res.status(502).json({ error: "AI generation failed" });
    }

    const raw = (data.content?.[0]?.text || "").trim();
    const cleaned = raw.replace(/^```(?:json)?\s*/i, "").replace(/```$/, "").trim();
    let parsed: { variants: { angle: string; html: string }[] };
    try {
      parsed = JSON.parse(cleaned);
    } catch {
      return res.status(502).json({ error: "AI response could not be parsed" });
    }
    if (!parsed?.variants || !Array.isArray(parsed.variants) || parsed.variants.length === 0) {
      return res.status(502).json({ error: "AI response had no variants" });
    }

    const variants = parsed.variants.slice(0, 3).map((v) => ({
      angle: String(v.angle || "").slice(0, 80),
      html: sanitize(v.html),
    }));

    // Persist each variant; endorse/discard later flips status.
    const inserts = await Promise.all(
      variants.map((v, i) => sql`
        INSERT INTO portal_feature_requests (org, person, prompt, mockup_html, status)
        VALUES (${org}, ${person}, ${cleanPrompt + " [variant " + (i + 1) + ": " + v.angle + "]"}, ${v.html}, 'draft')
        RETURNING id, created_at
      `)
    );
    const results = variants.map((v, i) => ({
      id: (inserts[i] as any[])[0].id,
      angle: v.angle,
      html: v.html,
    }));

    await logEvent({
      req, org, person,
      event_type: "sandbox_generate",
      path: "/portal/sandbox",
      metadata: { prompt_len: cleanPrompt.length, variant_count: results.length },
    });

    return res.status(200).json({ ok: true, prompt: cleanPrompt, variants: results });
  } catch (e) {
    console.error("Sandbox error:", e);
    return res.status(500).json({ error: String(e) });
  }
}
