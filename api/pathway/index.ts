import type { VercelRequest, VercelResponse } from "@vercel/node";
import postgres from "postgres";

const conn = process.env.POSTGRES_URL || process.env.DATABASE_URL || "";
const client = postgres(conn, { ssl: "require", max: 1 });

// ── Need → Category mapping ──────────────────────────────────────────────
const NEED_TO_CATEGORIES: Record<string, string[]> = {
  "non-dilutive-capital": ["Fund"],
  "pilot-site-field-validation": ["Pilot", "Accel"],
  "first-customers": ["Org", "Event", "Accel"],
  "accelerator": ["Accel", "Fund"],
  "all": ["Fund", "Accel", "Pilot", "Event", "Org", "Train"],
};

// ── Stage progression logic ──────────────────────────────────────────────
const STAGE_PRIORITIES: Record<string, string[]> = {
  Idea:  ["Train", "Accel", "Fund", "Event"],
  MVP:   ["Fund", "Accel", "Pilot", "Event"],
  Pilot: ["Pilot", "Fund", "Org", "Event"],
  Comm:  ["Fund", "Org", "Event", "Accel"],
  Scale: ["Fund", "Org", "Event", "Pilot"],
};

const NEXT_STAGE: Record<string, string> = {
  Idea: "MVP", MVP: "Pilot", Pilot: "Comm", Comm: "Scale", Scale: "Scale",
};

// ── System prompt ────────────────────────────────────────────────────────
const SYSTEM_PROMPT = `You are the pathway engine for the Canadian Ag Innovation Navigator. You generate personalized, ordered innovation pathways for agtech founders.

You receive:
- The founder's description of what they're building
- Their current stage (Idea / MVP / Pilot / Comm / Scale)
- Their province(s)
- Their primary need
- A list of ACTUAL programs from our database that match their criteria
- The priority categories for their stage

YOUR JOB: Generate a structured, ordered pathway of 4-6 concrete steps. Each step maps to a real program from the provided list. The pathway should be ordered by what to do FIRST, not alphabetically.

CRITICAL RULES:
- ONLY recommend programs from the provided list. Never invent programs.
- Each step must reference a real program by exact name.
- The pathway should tell a STORY of progression: "Do this first because X, then this because Y."
- For each step, explain WHY this program matters for their specific situation, not just what it does.
- Include at least one "horizon" step — something for their NEXT stage, not just their current one.
- If their province has gaps (few/no programs in a category they need), say so directly and suggest the best alternative (neighboring province or national program).
- Be specific about what the founder should DO — not "explore this program" but "apply before [deadline]" or "contact [org] and ask about [specific thing]."

Respond ONLY with a JSON object, no markdown, no backticks, no preamble:
{
  "pathway_title": "Your [Stage] → [NextStage] Pathway",
  "summary": "One sentence summary of the overall strategy for this founder.",
  "steps": [
    {
      "order": 1,
      "program_name": "Exact program name from the list",
      "program_website": "URL if available",
      "category": "Fund|Accel|Pilot|Event|Org|Train",
      "action": "Specific action to take — 1 sentence, imperative voice.",
      "why": "Why this matters for their specific situation — 1-2 sentences.",
      "timing": "now|next_month|next_quarter|horizon",
      "horizon": false
    }
  ],
  "gap_warning": "If there's a significant gap in their province/stage combination, describe it here. Otherwise null.",
  "next_stage_note": "One sentence about what changes when they reach the next stage."
}`;

// ── Handler ──────────────────────────────────────────────────────────────
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") return res.status(405).end();

  const { description, stage, provinces = [], need = "all" } = req.body;

  if (!description || !stage) {
    return res.status(400).json({ error: "description and stage are required" });
  }

  try {
    // 1. Determine which categories to focus on
    const needCategories = NEED_TO_CATEGORIES[need] || NEED_TO_CATEGORIES["all"];
    const stagePriorities = STAGE_PRIORITIES[stage] || STAGE_PRIORITIES["MVP"];
    const nextStage = NEXT_STAGE[stage] || "Scale";
    const allCategories = [...new Set([...needCategories, ...stagePriorities])];

    // 2. Query matching programs — simple approach, no dynamic param numbering
    const provArray = provinces.length > 0 ? provinces : [];
    const rows = await client.unsafe(
      `SELECT name, category, description, use_case, province, stage, website, funding_type, funding_max_cad
       FROM programs
       WHERE (
         province && $1::text[]
         OR 'National' = ANY(province)
         ${provArray.length === 0 ? "OR TRUE" : ""}
       )
       AND ($2 = ANY(stage) OR $3 = ANY(stage) OR stage IS NULL OR array_length(stage, 1) IS NULL)
       ORDER BY
         CASE WHEN category = ANY($4::text[]) THEN 0 ELSE 1 END,
         name
       LIMIT 40`,
      [
        `{${provArray.join(",")}}`,
        stage,
        nextStage,
        `{${allCategories.join(",")}}`,
      ]
    );

    // 3. Gap detection — simple per-category counts
    const gapInfo: Record<string, number> = {};
    for (const cat of allCategories) {
      const countRows = await client.unsafe(
        `SELECT COUNT(*) as cnt FROM programs
         WHERE category = $1
           AND (province && $2::text[] OR 'National' = ANY(province) ${provArray.length === 0 ? "OR TRUE" : ""})
           AND ($3 = ANY(stage) OR stage IS NULL OR array_length(stage, 1) IS NULL)`,
        [cat, `{${provArray.join(",")}}`, stage]
      );
      gapInfo[cat] = parseInt((countRows as any[])[0]?.cnt || "0", 10);
    }

    // 4. Build context for the LLM
    const programList = (rows as any[]).map((p: any) => {
      const parts = [
        `${p.name} [${p.category}]`,
        `Stages: ${(p.stage || []).join(", ") || "all"}`,
        `Province: ${(p.province || []).join(", ")}`,
        p.description ? p.description.slice(0, 150) : "",
        p.website ? `URL: ${p.website}` : "",
        p.funding_max_cad ? `Max funding: $${p.funding_max_cad.toLocaleString()} CAD` : "",
      ].filter(Boolean);
      return `- ${parts.join(" | ")}`;
    }).join("\n");

    const gapSummary = Object.entries(gapInfo)
      .map(([cat, count]) => `${cat}: ${count} programs`)
      .join(", ");

    const userMessage = `FOUNDER PROFILE:
Description: ${description}
Current Stage: ${stage}
Next Stage: ${nextStage}
Province(s): ${provinces.join(", ") || "Not specified"}
Primary Need: ${need}

AVAILABLE PROGRAMS (${(rows as any[]).length} matching):
${programList || "No programs found matching these criteria."}

CATEGORY AVAILABILITY for ${provinces.join("/")}:
${gapSummary}

PRIORITY CATEGORIES for ${stage} stage: ${stagePriorities.join(", ")}

Generate the pathway now.`;

    // 5. Call Anthropic API
    const apiRes = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY || "",
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 1500,
        system: SYSTEM_PROMPT,
        messages: [{ role: "user", content: userMessage }],
      }),
    });

    const data = await apiRes.json() as any;
    const raw = data.content?.[0]?.text || "";

    // 6. Parse JSON response
    let pathway: any;
    try {
      const cleaned = raw.replace(/```json|```/g, "").trim();
      pathway = JSON.parse(cleaned);
    } catch {
      pathway = {
        pathway_title: `Your ${stage} Pathway`,
        summary: "Unable to generate a structured pathway. Please try the chat for personalized recommendations.",
        steps: [],
        gap_warning: null,
        next_stage_note: null,
      };
    }

    return res.status(200).json({
      pathway,
      meta: {
        stage,
        nextStage,
        provinces,
        need,
        programsConsidered: (rows as any[]).length,
        gapInfo,
      },
    });
  } catch (e) {
    console.error("Pathway generation error:", e);
    return res.status(500).json({ error: String(e) });
  }
}
