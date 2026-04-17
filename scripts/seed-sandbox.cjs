// One-time seed of the Feature Sandbox team roadmap with starter mockups
// pulled directly from signals in the BioEnterprise meeting.
// Run with: node scripts/seed-sandbox.cjs
require("dotenv").config({ path: ".env.local" });
const postgres = require("postgres");

const POSTGRES_URL = process.env.POSTGRES_URL || process.env.DATABASE_URL;
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
if (!POSTGRES_URL || !ANTHROPIC_API_KEY) {
  console.error("Missing POSTGRES_URL or ANTHROPIC_API_KEY");
  process.exit(1);
}

const sql = postgres(POSTGRES_URL, { ssl: "require", max: 1 });

const SYSTEM_PROMPT = `You are a senior UI designer for Trellis (Canada's agtech ecosystem navigation tool).
Trellis uses: DM Serif Display for headings, DM Sans for body, warm amber/gold accents (#D4A828, #C4A052), forest green primary (#1B4332, #2D5A3D), cream background (#FAFAF7), soft borders (#E8E5E0), generous whitespace, card-based layouts.

Your job: design ONE polished, shipped-looking mockup of the feature described.

RULES:
- Output only a single self-contained <div> with inline styles. No <html>/<head>/<body>/<script>/<iframe>/<link>/<img>. No external resources.
- Use inline SVG for icons.
- DM Serif Display (Georgia fallback) for headings, DM Sans (system-ui fallback) for body.
- Width 560-720px, desktop card. Realistic Canadian agtech sample data. Real program names, provinces, dollar figures.
- Polished, not wireframe. Real shadows, real spacing, real buttons.
- No text like "mockup" or "concept". Design as if shipped.
- Under 2800 characters total.

Respond with the raw HTML only. No markdown fences, no preamble.`;

function sanitize(html) {
  let h = String(html || "").trim();
  h = h.replace(/^```(?:html|json)?\s*/i, "").replace(/```$/, "").trim();
  h = h.replace(/<script[\s\S]*?<\/script>/gi, "");
  h = h.replace(/<iframe[\s\S]*?<\/iframe>/gi, "");
  h = h.replace(/<link[^>]*>/gi, "");
  h = h.replace(/\son\w+\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, "");
  h = h.replace(/javascript:/gi, "");
  return h;
}

async function generateMockup(prompt) {
  const resp = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": ANTHROPIC_API_KEY,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-6",
      max_tokens: 3000,
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: prompt }],
    }),
  });
  if (!resp.ok) {
    const err = await resp.text();
    throw new Error(`Anthropic ${resp.status}: ${err.slice(0, 200)}`);
  }
  const data = await resp.json();
  const html = (data.content?.[0]?.text || "").trim();
  return sanitize(html);
}

const SEEDS = [
  {
    tag: "For Tabitha",
    prompt: "A one-pager called 'Gap Snapshot' that a grant writer can drop into a funding narrative. Shows one chosen gap cell (e.g., Ontario Accelerator at Scale) with: the headline stat (0 programs), a 2-sentence AI-generated rationale citing the Bioenterprise roundtable, neighbouring-province comparison, and a citation block formatted for use in a proposal. Clean, exportable feel.",
  },
  {
    tag: "For Dave",
    prompt: "A University Expertise Map view. Shows Canadian universities (Guelph, Dalhousie, Saskatchewan, UBC, etc.) in a tiled grid. Each tile lists that university's actual agtech focus areas (soil biology, precision ag, food processing, animal genomics) as tags, not just a generic 'ag' label. This addresses the fact that most universities say they do ag but don't expose what they actually specialize in. Include filter controls for domain (e.g., soil, biologicals, robotics).",
  },
  {
    tag: "For Carla",
    prompt: "A 'Trellis → Engine' routing dashboard for an accelerator director. Shows, for each of the last 30 days, how many founders ran the Trellis wizard and ended up recommended to Bioenterprise programs (GOAH, SGAP, etc.). Top metrics: total founders routed, breakdown by program, conversion to Engine signup. Visual: a left-to-right flow diagram plus a small time series chart. Includes a callout tile for 'Founders we don't have a good answer for' — a spot where Trellis routes founders that don't match any current BE program, highlighting an opportunity for program design.",
  },
];

(async () => {
  try {
    console.log("Generating", SEEDS.length, "seed mockups…");
    for (const seed of SEEDS) {
      console.log(" → ", seed.tag);
      const html = await generateMockup(seed.prompt);
      // Mark author as 'justyn', status 'endorsed', visibility 'team' so it shows on the roadmap immediately.
      const promptLabel = seed.prompt + " [seed from meeting: " + seed.tag + "]";
      await sql`
        INSERT INTO portal_feature_requests (org, person, prompt, mockup_html, status, visibility)
        VALUES ('bioenterprise', 'justyn', ${promptLabel}, ${html}, 'endorsed', 'team')
      `;
      console.log("   done. chars:", html.length);
    }
    console.log("✅ Seeded", SEEDS.length, "starter mockups.");
    process.exit(0);
  } catch (e) {
    console.error("FAIL:", e.message);
    process.exit(1);
  }
})();
