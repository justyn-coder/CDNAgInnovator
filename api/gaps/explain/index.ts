import type { VercelRequest, VercelResponse } from "@vercel/node";
import postgres from "postgres";
import { checkRateLimit } from "../../_lib/rate-limit";

const conn = process.env.POSTGRES_URL || process.env.DATABASE_URL || "";
const client = postgres(conn, { ssl: "require", max: 1 });

// ── Gap classification (deterministic, not LLM) ──────────────────────────

interface GapContext {
  province: string;
  category: string;
  stage: string; // "All" or specific stage
  count: number;
  programs: { name: string; description: string | null; stage: string[] }[];
  neighborCounts: Record<string, number>; // adjacent provinces → count
  nationalCount: number; // national programs in this category
  unfilteredCount: number; // count without stage filter (to detect stage mismatch)
}

type GapType =
  | "structural"    // provincial economy doesn't generate demand
  | "market_failure" // demand exists, no org has filled it
  | "coverage_gap"  // national programs exist but aren't provincially accessible
  | "stage_mismatch" // programs exist but not for the filtered stage
  | "data_gap"      // likely missing data, not missing programs
  | "weak"          // count=1, single point of failure
  | "adequate";     // count>=2, no explanation needed (but available)

// Provinces where ag is a major economic driver
const AG_HEAVY = ["SK", "AB", "MB", "ON", "QC"];
// Provinces with small/niche ag sectors
const AG_LIGHT = ["PE", "NL", "NB", "NS", "BC"];
// Province adjacency for neighbor context
const NEIGHBORS: Record<string, string[]> = {
  BC: ["AB"], AB: ["BC", "SK"], SK: ["AB", "MB"], MB: ["SK", "ON"],
  ON: ["MB", "QC"], QC: ["ON", "NB"], NB: ["QC", "NS", "PE"],
  NS: ["NB", "PE"], PE: ["NB", "NS"], NL: ["NS"],
  National: [],
};

function classifyGap(ctx: GapContext): GapType {
  const { province, category, count, stage, unfilteredCount, nationalCount } = ctx;

  // Has programs → weak or adequate
  if (count >= 2) return "adequate";
  if (count === 1) return "weak";

  // count === 0 from here

  // Stage mismatch: programs exist when unfiltered, but not for this stage
  if (stage !== "All" && unfilteredCount > 0) return "stage_mismatch";

  // Data gap signals: QC (french ecosystem, disconnected), or categories where
  // informal support likely exists but isn't catalogued
  if (province === "QC" && ["Event", "Org", "Train"].includes(category)) return "data_gap";

  // Coverage gap: national programs exist (3+) but province has 0
  if (nationalCount >= 3 && province !== "National") return "coverage_gap";

  // Structural: light-ag province + capital-intensive category
  if (AG_LIGHT.includes(province) && ["Pilot", "Accel", "Fund"].includes(category)) return "structural";

  // Market failure: ag-heavy province with 0 programs = someone should be here
  if (AG_HEAVY.includes(province)) return "market_failure";

  // Default for remaining cases
  return "market_failure";
}

// ── Bioenterprise context (baked in, not LLM-generated) ──────────────────

const PROVINCE_CONTEXT: Record<string, string> = {
  SK: "Saskatchewan has Canada's strongest ag support ecosystem. Deep institutional alignment between government, producers, and research. If a gap exists here, it's notable.",
  AB: "Alberta has strong ag investment but weak triage/navigation for founders. Organizations exist but founders struggle to find the right entry point. The Innovation Ecosystem gap analysis (2024) flagged this specifically.",
  QC: "Quebec has a dense innovation ecosystem that is largely disconnected from the rest of Canada. Many organizations operate primarily in French. Gaps here may reflect data limitations rather than actual absence of support.",
  ON: "Ontario has Canada's largest general innovation ecosystem but almost nothing ag-specific. AgTech founders compete for attention in generalist programs not designed for agricultural timelines or technical requirements.",
  BC: "British Columbia has pieces of an ag innovation ecosystem but they don't connect well. Wine/vineyard and specialty crop tech have some support; broadacre ag has very little.",
  MB: "Manitoba's ag innovation support is thin but improving. EMILI is the dedicated agtech organization and partners with FCC on the Innovation Farm Network (17,000+ acres for real-world testing). For most other support categories, founders must look to Saskatchewan or national programs.",
  NB: "New Brunswick has zero full-stack agtech support organizations. Part of the broader Atlantic gap where agricultural innovation infrastructure is largely absent.",
  NS: "Nova Scotia has some food/ocean tech crossover but minimal dedicated ag innovation support. Part of the Atlantic gap.",
  PE: "Prince Edward Island's agriculture is significant relative to its economy but the province lacks dedicated agtech innovation infrastructure due to small absolute scale.",
  NL: "Newfoundland and Labrador has minimal agricultural activity and no dedicated agtech innovation support. Not a structural priority.",
  National: "National-level programs should theoretically serve all provinces, but practical accessibility varies. The TRL 4-7 gap (proof-of-concept to commercial pilot) is the most documented unsolved problem in Canadian ag commercialization. Canada ranks 9th in ag research but 21st in commercialization.",
};

const CATEGORY_CONTEXT: Record<string, string> = {
  Fund: "Funding programs for agtech range from non-dilutive grants (IRAP, provincial innovation funds) to venture investment. The gap between research grants and commercial investment (TRL 4-7) is where most Canadian agtech companies stall.",
  Accel: "Accelerators provide structured support, mentorship, and often investment for early-stage companies. Ag-specific accelerators are rare in Canada; most founders must adapt to generalist programs.",
  Pilot: "Pilot sites are confirmed as a structural gap nationally. No national-level pilot infrastructure exists for agtech — the FCC Innovation Farm Network (17,000+ acres in MB/SK) is the closest thing but is still limited. Provincial pilot opportunities are ad hoc and relationship-dependent. Critical insight: the agronomist/CCA advisor channel is the real gatekeeper for pilot access. Organizations like Farming Smarter run Field-Tested validation programs, and applied research associations are often the bridge between startups and farmers willing to trial new tech.",
  Event: "Events and conferences provide networking and visibility. The Canadian agtech event calendar is thin compared to the US or EU, concentrating deal flow at a few key moments.",
  Org: "Industry organizations provide advocacy, network access, and sometimes program delivery. Coverage is uneven — some provinces have strong producer organizations but weak innovation-focused orgs. The most underutilized channel for agtech adoption is the CCA/agrologist advisor network: 1,400+ certified crop advisers on the Prairies alone act as trusted recommenders who influence grower purchasing decisions. AgSphere (Calgary), ICAN (Alberta), and provincial agrologist institutes are key entry points. Most agtech companies skip this channel and go direct-to-farmer — which is the canonical adoption mistake.",
  Train: "Training programs for agtech founders are sparse. Most available training is general entrepreneurship, not calibrated to agricultural market cycles, regulatory requirements, or producer buying patterns.",
};

// ── System prompt ────────────────────────────────────────────────────────

const SYSTEM_PROMPT = `You are the AI analyst for the Canadian Ag Innovation Navigator's gap analysis feature. You explain ecosystem patterns to help agtech founders and ecosystem operators understand the landscape.

IMPORTANT FRAMING: Our database is built from publicly available information and may be incomplete. When you identify gaps, frame them as "based on what we've catalogued" rather than absolute statements. We actively want users to correct us — missing programs, miscategorized entries, and regional nuances we haven't captured are all valuable feedback. Be direct about what the data shows, but honest about what we might not know.

You will receive structured context about a specific cell in the Province × Category gap matrix, including:
- The gap classification (already determined — do not override it)
- Provincial and category context from the Bioenterprise 2024 roundtable findings
- Neighboring province counts for comparison
- The user's mode (founder or operator)

YOUR JOB: Generate a structured explanation with exactly three fields. Respond ONLY with a JSON object, no markdown, no preamble, no backticks.

Response format:
{
  "classification_label": "Human-readable gap type (e.g., 'Likely Gap', 'Possible Structural Gap', 'Stage Mismatch', 'Data Blind Spot')",
  "why": "2-3 sentences explaining WHY this pattern shows up for this province+category+stage combination. Be specific to the province's economy and ecosystem. Reference Bioenterprise findings where relevant. Acknowledge uncertainty where appropriate.",
  "action": "1-2 sentences with a concrete next step. For founders: where to look instead. For operators: what opportunity this represents. End with a nudge: 'Know something we don't? Use the buttons below to let us know.'"
}

RULES:
- Never say "this is a confirmed gap" — say "based on our data" or "from what we've found."
- Never be generic. "This province lacks programs in this category" is useless. WHY the data shows this pattern is the point.
- For FOUNDER mode: the action should be a workaround — a neighboring province program, a national alternative, or a specific org to contact.
- For OPERATOR mode: the action should frame the opportunity — who is best positioned to fill this, what would it take, is there a model from another province.
- For WEAK (count=1): highlight the concentration risk. Name the one program and note what happens if it changes focus.
- For STAGE MISMATCH: be explicit that programs exist but don't serve this stage. Name what stages ARE served and what's missing.
- For DATA GAP: be honest that this likely reflects incomplete data, especially for Quebec/French-language programs or smaller regional initiatives. Suggest what might exist but isn't catalogued.
- For ADEQUATE (count>=2): briefly note strengths and any concentration patterns.
- Keep "why" under 60 words and "action" under 40 words.`;

// ── Handler ──────────────────────────────────────────────────────────────

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") return res.status(405).end();

  // Rate limit: 10 requests per minute per IP
  const allowed = await checkRateLimit(req, res, { maxRequests: 10, windowSeconds: 60, endpoint: "gaps_explain" });
  if (!allowed) return;

  const { province, category, stage = "All", mode = "founder" } = req.body;

  if (!province || !category) {
    return res.status(400).json({ error: "province and category are required" });
  }

  try {
    // 1. Get programs in this cell (with stage filter)
    const cellPrograms = stage && stage !== "All"
      ? await client.unsafe(
          `SELECT name, description, stage FROM programs
           WHERE status NOT IN ('closed', 'dissolved', 'inactive') AND category = $1 AND $2 = ANY(province) AND $3 = ANY(stage)`,
          [category, province, stage]
        )
      : await client.unsafe(
          `SELECT name, description, stage FROM programs
           WHERE status NOT IN ('closed', 'dissolved', 'inactive') AND category = $1 AND $2 = ANY(province)`,
          [category, province]
        );

    // 2. Get unfiltered count (to detect stage mismatch)
    const unfilteredRows = await client.unsafe(
      `SELECT COUNT(*) as cnt FROM programs WHERE status NOT IN ('closed', 'dissolved', 'inactive') AND category = $1 AND $2 = ANY(province)`,
      [category, province]
    );
    const unfilteredCount = parseInt((unfilteredRows as any[])[0]?.cnt || "0", 10);

    // 3. Get national count for this category
    const nationalRows = await client.unsafe(
      `SELECT COUNT(*) as cnt FROM programs WHERE status NOT IN ('closed', 'dissolved', 'inactive') AND category = $1 AND 'National' = ANY(province)`,
      [category]
    );
    const nationalCount = parseInt((nationalRows as any[])[0]?.cnt || "0", 10);

    // 4. Get neighbor counts
    const neighbors = NEIGHBORS[province] || [];
    const neighborCounts: Record<string, number> = {};
    for (const n of neighbors) {
      const nRows = stage && stage !== "All"
        ? await client.unsafe(
            `SELECT COUNT(*) as cnt FROM programs WHERE status NOT IN ('closed', 'dissolved', 'inactive') AND category = $1 AND $2 = ANY(province) AND $3 = ANY(stage)`,
            [category, n, stage]
          )
        : await client.unsafe(
            `SELECT COUNT(*) as cnt FROM programs WHERE status NOT IN ('closed', 'dissolved', 'inactive') AND category = $1 AND $2 = ANY(province)`,
            [category, n]
          );
      neighborCounts[n] = parseInt((nRows as any[])[0]?.cnt || "0", 10);
    }

    // 5. Classify the gap
    const count = (cellPrograms as any[]).length;
    const programs = (cellPrograms as any[]).map((p: any) => ({
      name: p.name,
      description: p.description?.slice(0, 120) || null,
      stage: p.stage || [],
    }));

    const gapType = classifyGap({
      province, category, stage, count, programs,
      neighborCounts, nationalCount, unfilteredCount,
    });

    // 6. Build the user message with all context
    const neighborSummary = Object.entries(neighborCounts)
      .map(([p, c]) => `${p}: ${c}`)
      .join(", ");

    const userMessage = `CELL: ${province} × ${category}
STAGE FILTER: ${stage}
COUNT: ${count} programs${stage !== "All" ? ` (${unfilteredCount} unfiltered)` : ""}
GAP TYPE: ${gapType}
MODE: ${mode === "ec" ? "operator" : "founder"}

PROGRAMS IN CELL:
${programs.length > 0
  ? programs.map(p => `- ${p.name} (stages: ${p.stage.join(", ") || "unknown"})`).join("\n")
  : "None"}

NEIGHBOR COUNTS (${category}): ${neighborSummary || "N/A"}
NATIONAL COUNT (${category}): ${nationalCount}

PROVINCE CONTEXT: ${PROVINCE_CONTEXT[province] || "No specific context available."}
CATEGORY CONTEXT: ${CATEGORY_CONTEXT[category] || "No specific context available."}

Generate the JSON explanation now.`;

    // 7. Call Anthropic API
    const apiRes = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY || "",
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 512,
        system: SYSTEM_PROMPT,
        messages: [{ role: "user", content: userMessage }],
      }),
    });

    const data = await apiRes.json() as any;
    const raw = data.content?.[0]?.text || "";

    // 8. Parse JSON response
    let explanation: { classification_label: string; why: string; action: string };
    try {
      const cleaned = raw.replace(/```json|```/g, "").trim();
      explanation = JSON.parse(cleaned);
    } catch {
      // Fallback if JSON parsing fails
      explanation = {
        classification_label: gapType.replace("_", " ").replace(/\b\w/g, c => c.toUpperCase()),
        why: raw.slice(0, 200),
        action: "Unable to generate structured explanation. Try refreshing.",
      };
    }

    return res.status(200).json({
      province,
      category,
      stage,
      count,
      gapType,
      mode,
      explanation,
      meta: {
        unfilteredCount,
        nationalCount,
        neighborCounts,
      },
    });
  } catch (e) {
    console.error("Gap explain error:", e);
    return res.status(500).json({ error: String(e) });
  }
}
