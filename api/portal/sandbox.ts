import type { VercelRequest, VercelResponse } from "@vercel/node";
import { portalCors, verifyPerson, logEvent, sql } from "../_lib/portal.js";
import { checkRateLimit } from "../_lib/rate-limit.js";

// Allow up to 60s since we fire three parallel Anthropic calls per request.
export const config = { maxDuration: 60 };

const SYSTEM_PROMPT = `You are a senior UI designer for Trellis (Canada's agtech ecosystem navigation tool).
Trellis uses: DM Serif Display for headings, DM Sans for body, warm amber/gold accents (#D4A828, #C4A052), forest green primary (#1B4332, #2D5A3D), cream background (#FAFAF7), soft borders (#E8E5E0), generous whitespace, card-based layouts.

Your job: generate ONE polished, shipped-looking mockup of the feature described.

RULES:
- Never use em-dashes, en-dashes, or semicolons anywhere in the copy. Use commas, periods, colons, or parentheses instead.
- Output only a single self-contained <div> with inline styles. No <html>/<head>/<body>/<script>/<iframe>/<link>/<img>. No external resources.
- Use inline SVG for icons.
- DM Serif Display (Georgia fallback) for headings, DM Sans (system-ui fallback) for body.
- Width 560-740px, desktop card. Realistic Canadian agtech sample data: real program names, provinces, dollar figures.
- Polished, not wireframe. Real shadows, real spacing, real buttons with labels.
- No text like "mockup" or "concept". Design as if shipped.
- Under 2600 characters total.

Respond with the raw HTML only. No markdown fences, no preamble. Start with <div.`;

const ANGLES = [
  { label: "Literal take", lens: "Design the most direct, literal interpretation of the request. Primary use case, primary layout, clearest path from data to action." },
  { label: "Different angle", lens: "Invert the primary axis of the idea, swap hierarchy, or lead with a different dimension. Same feature, different perspective. Surprise but still fit." },
  { label: "AI-forward take", lens: "Add a proactive intelligence layer the user probably wasn't imagining: a suggested next action, a pre-filled recommendation, a detected pattern callout, or a short AI-generated summary tile at the top. Still their feature. Smarter." },
];

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

async function generateOne(userPrompt: string, angleLens: string): Promise<string> {
  const resp = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": process.env.ANTHROPIC_API_KEY || "",
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: process.env.CLAUDE_SONNET_MODEL || "claude-sonnet-4-6",
      max_tokens: 2800,
      system: SYSTEM_PROMPT,
      messages: [
        {
          role: "user",
          content: `Feature request: ${userPrompt}\n\nAngle for this take: ${angleLens}`,
        },
      ],
    }),
  });
  if (!resp.ok) {
    const body = await resp.text().catch(() => "");
    throw new Error(`Anthropic ${resp.status}: ${body.slice(0, 200)}`);
  }
  const data = (await resp.json()) as any;
  const raw = (data.content?.[0]?.text || "").trim();
  return sanitize(raw);
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (!portalCors(req, res)) return;
  if (req.method !== "POST") return res.status(405).end();

  // Rate limit: each generation fans out to 3 Anthropic calls, so cap aggressively.
  // 4 generations per minute per IP is plenty for a human clicking "Design this".
  const allowed = await checkRateLimit(req, res, { maxRequests: 4, windowSeconds: 60, endpoint: "portal_sandbox" });
  if (!allowed) return;

  const { org, person, prompt } = req.body || {};
  const identity = await verifyPerson(org, person);
  if (!identity) return res.status(404).json({ error: "unknown portal identity" });
  if (!prompt || String(prompt).trim().length < 8) {
    return res.status(400).json({ error: "prompt too short" });
  }

  const cleanPrompt = String(prompt).slice(0, 600);

  try {
    // Fire all three generations in parallel. Fail the request only if ALL three fail.
    const settled = await Promise.allSettled(
      ANGLES.map((a) => generateOne(cleanPrompt, a.lens))
    );
    const variants = ANGLES.map((a, i) => {
      const r = settled[i];
      return r.status === "fulfilled" ? { angle: a.label, html: r.value } : null;
    }).filter((v): v is { angle: string; html: string } => v !== null && v.html.length > 80);

    if (variants.length === 0) {
      const firstErr = settled.find((s) => s.status === "rejected") as PromiseRejectedResult | undefined;
      console.error("Sandbox: all three variants failed", firstErr?.reason);
      return res.status(502).json({ error: "AI generation failed" });
    }

    // Persist each variant as a draft feature request.
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
