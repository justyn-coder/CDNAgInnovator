import type { VercelRequest, VercelResponse } from "@vercel/node";
import postgres from "postgres";

const conn = process.env.POSTGRES_URL || process.env.DATABASE_URL || "";
const client = postgres(conn, { ssl: "require", max: 1 });

// ── Need → Category mapping (broadened for later stages) ─────────────────
const NEED_TO_CATEGORIES: Record<string, string[]> = {
  "non-dilutive-capital": ["Fund", "Accel"],
  "pilot-site-field-validation": ["Pilot", "Accel", "Org"],
  "first-customers": ["Org", "Event", "Accel", "Fund"],
  "accelerator": ["Accel", "Fund", "Event"],
  "channel-distribution": ["Org", "Event", "Train"],
  "market-expansion": ["Org", "Event", "Fund", "Pilot", "Train"],
  "growth-capital": ["Fund", "Accel", "Org"],
  "industry-connections": ["Org", "Event", "Train", "Fund"],
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

// ── Stage display labels (for LLM output) ────────────────────────────────
const STAGE_DISPLAY: Record<string, string> = {
  Idea: "Idea", MVP: "MVP", Pilot: "Pilot",
  Comm: "First Customers", Scale: "Scale",
};

// ── Stage-specific framing guidance ──────────────────────────────────────
const STAGE_FRAMING: Record<string, string> = {
  Idea: "This founder is pre-product. They need validation, mentorship, and seed funding. Recommend programs that help them test their idea with real farmers before building.",
  MVP: "This founder has built something but needs to prove it works. They need pilot sites, early funding, and connections to progressive farmers willing to trial new tech. If they plan to sell to farmers, flag that they should be thinking about the agronomist/CCA advisor channel early — most growers won't adopt tech without their trusted advisor's endorsement.",
  Pilot: "This founder is actively testing with farmers. CRITICAL: Check whether any program in the pathway provides access to the CCA/agronomist advisor channel. Going direct-to-farmer without agronomist vetting is the canonical AgTech mistake — growers rely on their trusted crop advisors before adopting new tools. Programs like AgSphere, Farming Smarter's Field-Tested program, and provincial CCA/agrologist networks are how startups get vetted. If no advisor-channel program is in the pathway, flag this as a gap_warning.",
  Comm: "This founder has paying customers and is growing. They likely already know the basic ecosystem. Recommend programs they might NOT know about — growth capital, export support, industry associations that open new market segments, and events where they can reach the NEXT tier of customer. Don't recommend basic incubator/accelerator programs unless they have specific scale-up tracks. Also check: have they engaged the advisor channel (CCAs, agrologists, applied research orgs)? If not, this is a blind spot — fewer than 5% of agtech companies entering the Canadian market have a credible advisor engagement strategy.",
  Scale: "This founder is scaling nationally/internationally. They need growth capital (Series A+), trade/export programs, regulatory navigation, and strategic industry partnerships. Basic ecosystem programs are below their level — focus on capital, market access, and strategic positioning.",
};

// ── System prompt ────────────────────────────────────────────────────────
const SYSTEM_PROMPT = `You are the pathway engine for the Canadian Ag Innovation Navigator. You generate personalized, ordered innovation pathways for agtech founders.

Today's date: ${new Date().toISOString().split("T")[0]}

You receive:
- The founder's description of what they're building
- Their current stage and stage-specific framing guidance
- Their province(s)
- Their primary need
- A list of ACTUAL programs from our database with descriptions and use cases
- The priority categories for their stage

YOUR JOB: Generate a structured, ordered pathway of 4-6 concrete steps. Each step maps to a real program from the provided list.

CRITICAL RULES:
- ONLY recommend programs from the provided list. Never invent programs.
- Each step must reference a real program by its exact name as shown in the list.
- PRIORITIZE programs whose description or use_case closely matches what the founder is building. A fruit-orchard-specific program is far more valuable than a generic one for a fruit tech company.
- The pathway should tell a STORY of progression: "Do this first because X, then this because Y."
- For each step, explain WHY this program matters for THEIR SPECIFIC product/market, not just what the program does generically.
- Include at least one "horizon" step — something for their NEXT stage.
- If their province has gaps (few/no programs in a category they need), say so directly and suggest the best alternative.
- Be specific about what the founder should DO — not "explore this program" but "apply to X" or "contact Y and ask about Z."
- For timing: "now" = do this week, "next_month" = within 30 days, "next_quarter" = 1-3 months, "horizon" = 3-6 months or next stage.
- TIMING HONESTY: Use approximate language for event dates and deadlines. Say "typically held in [month]" or "applications usually open in [season]" — do NOT assert exact dates unless they are in the program data. If you don't know the exact deadline, say so.
- Only include program_website if the URL is provided in the program data. If no URL is listed, set program_website to null. NEVER invent URLs.
- For Comm and Scale stage companies: these founders are sophisticated. Don't recommend basic accelerators unless they have scale-specific tracks. Focus on growth capital, market expansion, strategic partnerships, and resources they're less likely to already know about.
- CONFIDENCE: For each step, honestly assess fit_confidence as "high" (strong match to their specific product/market), "medium" (relevant category but not product-specific), or "exploratory" (strategic but indirect path). Do NOT mark everything as high.
- ACCESS PATH: For each step, include a brief "prepare" field noting what the founder should have ready (pitch deck, pilot data, partnership proposal, etc.) and the best way in (direct application, warm intro, event attendance, membership).
- CHANNEL/DISTRIBUTION NEED: If the need is "channel-distribution", focus on organizations and events where dealers, distributors, equipment resellers, or service partners can be found. Think about who installs, services, and maintains technology for farmers — not just who funds it.
- ADVISOR CHANNEL CHECK: For any founder at MVP, Pilot, or Comm stage whose product will be used by farmers/growers, check whether the pathway includes at least one program with advisor-channel access (use_case includes "advisor-channel"). If not, set gap_warning to explain: "Your pathway currently lacks engagement with the agronomist/CCA advisor channel. In Canadian agriculture, growers rarely adopt new technology without endorsement from their trusted crop advisor. Organizations like AgSphere, Farming Smarter, CCA networks, and provincial agrologist institutes are how agtech companies get vetted before reaching farmers." Name specific programs from the list that could fill this gap.

Respond ONLY with a JSON object, no markdown, no backticks, no preamble:
{
  "pathway_title": "Your [Stage] → [NextStage] Pathway",
  "summary": "One sentence summary of the overall strategy for this founder.",
  "steps": [
    {
      "order": 1,
      "program_name": "Exact program name from the list",
      "program_website": "URL if provided, otherwise null",
      "category": "Fund|Accel|Pilot|Event|Org|Train",
      "action": "Specific action to take — 1 sentence, imperative voice.",
      "why": "Why this matters for their specific product/market — 1-2 sentences.",
      "fit_confidence": "high|medium|exploratory",
      "prepare": "What to have ready + best way in (1 sentence).",
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

  const { description, stage, provinces: rawProvinces = [], need = "all" } = req.body;

  if (!description || !stage) {
    return res.status(400).json({ error: "description and stage are required" });
  }

  // Expand "Atlantic" into individual province codes
  const provinces: string[] = rawProvinces.flatMap((p: string) =>
    p === "Atlantic" ? ["NB", "NS", "PE", "NL"] : [p]
  );

  try {
    // 1. Determine which categories to focus on
    const needCategories = NEED_TO_CATEGORIES[need] || NEED_TO_CATEGORIES["all"];
    const stagePriorities = STAGE_PRIORITIES[stage] || STAGE_PRIORITIES["MVP"];
    const nextStage = NEXT_STAGE[stage] || "Scale";
    const allCategories = [...new Set([...needCategories, ...stagePriorities])];
    const stageFraming = STAGE_FRAMING[stage] || STAGE_FRAMING["MVP"];

    // 2. Query matching programs — broader query, let the LLM prioritize
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
       LIMIT 50`,
      [
        `{${provArray.join(",")}}`,
        stage,
        nextStage,
        `{${allCategories.join(",")}}`,
      ]
    );

    // 3. Gap detection
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

    // 4. Build context for the LLM — include full descriptions and use_case
    const programList = (rows as any[]).map((p: any) => {
      const parts = [
        `${p.name} [${p.category}]`,
        `Stages: ${(p.stage || []).join(", ") || "all"}`,
        `Province: ${(p.province || []).join(", ")}`,
        p.use_case?.length ? `Use cases: ${p.use_case.join(", ")}` : "",
        p.description || "",
        p.website ? `URL: ${p.website}` : "(no URL)",
        p.funding_max_cad ? `Max funding: $${p.funding_max_cad.toLocaleString()} CAD` : "",
      ].filter(Boolean);
      return `- ${parts.join(" | ")}`;
    }).join("\n");

    const gapSummary = Object.entries(gapInfo)
      .map(([cat, count]) => `${cat}: ${count} programs`)
      .join(", ");

    const stageDisplay = STAGE_DISPLAY[stage] || stage;
    const nextStageDisplay = STAGE_DISPLAY[nextStage] || nextStage;

    // Identify advisor-channel programs in the result set for the gap warning
    const advisorPrograms = (rows as any[])
      .filter((p: any) => p.use_case && p.use_case.includes("advisor-channel"))
      .map((p: any) => p.name);

    const userMessage = `FOUNDER PROFILE:
Description: ${description}
Current Stage: ${stageDisplay} (internal code: ${stage})
Next Stage: ${nextStageDisplay}
Province(s): ${provinces.join(", ") || "Not specified"}
Primary Need: ${need}

IMPORTANT: Use "${stageDisplay}" and "${nextStageDisplay}" in the pathway_title (e.g., "Your ${stageDisplay} → ${nextStageDisplay} Pathway"), NOT the internal stage codes.

STAGE-SPECIFIC GUIDANCE:
${stageFraming}

${advisorPrograms.length > 0 ? `ADVISOR-CHANNEL PROGRAMS AVAILABLE IN THIS LIST:\n${advisorPrograms.join(", ")}\nIf the gap_warning fires, reference THESE specific programs as the solution.` : "NOTE: No advisor-channel programs are available for this province/stage combination."}

AVAILABLE PROGRAMS (${(rows as any[]).length} matching):
${programList || "No programs found matching these criteria."}

CATEGORY AVAILABILITY for ${provinces.join("/")}:
${gapSummary}

PRIORITY CATEGORIES for ${stage} stage: ${stagePriorities.join(", ")}

Generate the pathway now. Remember: prioritize programs whose description closely matches what this specific founder is building. Generic programs should come after industry-specific ones.`;

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
        max_tokens: 2000,
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
