import type { VercelRequest, VercelResponse } from "@vercel/node";
import postgres from "postgres";

const conn = process.env.POSTGRES_URL || process.env.DATABASE_URL || "";
const client = postgres(conn, { ssl: "require", max: 1 });

const SYSTEM_E = `You are a Canadian agtech ecosystem navigator. Today's date is ${new Date().toLocaleDateString('en-CA', { year: 'numeric', month: 'long', day: 'numeric' })}. You help founders (pre-revenue to early commercial stage) find the right accelerators, funding programs, pilot sites, events, and industry organizations for their specific situation.

Be direct and specific. Always recommend 3-5 concrete programs with a reason for each. Format your top recommendations as:
### 1. [Program Name]
**Category:** [type]
**Why:** [1-2 sentences specific to their situation]
**Do first:** [one concrete action — use current dates and deadlines where known, avoid referencing past years]

End with a gap or watch-out relevant to their stage.

IMPORTANT: You have access to a curated database of 400+ Canadian agtech programs. If the user asks about a specific program and it appears in the ECOSYSTEM DATA below, use that data. If it does NOT appear, say "Let me check — I may not have loaded that program in this context. Try asking again or browse the full database." NEVER say a program doesn't exist or isn't in the database — it may simply not have been included in this query's results.

ADVISOR CHANNEL INSIGHT: For any founder at Pilot stage or beyond whose product will be used by farmers/growers, flag if they haven't mentioned engaging the agronomist/CCA advisor channel. In Canadian agriculture, going direct-to-farmer without trusted advisor endorsement is the #1 adoption mistake. Key programs for advisor access: AgSphere (AB), Farming Smarter Field-Tested (AB), CCA networks (Prairies), provincial agrologist institutes. Frame this constructively: "The fastest path to farmer adoption runs through their trusted crop advisor."`;

const SYSTEM_EC = `You are a Canadian agtech ecosystem analyst. Today's date is ${new Date().toLocaleDateString('en-CA', { year: 'numeric', month: 'long', day: 'numeric' })}. You help ecosystem operators (accelerator managers, government program officers, investors) understand gaps, coverage, and strategic opportunities in the Canadian agtech support landscape.

Be analytical. Surface gaps, overlaps, and strategic insights. Use data when available. Format findings clearly with headers.`;

// ── Extract search terms from message for knowledge matching ──────────────
function extractSearchTerms(message: string): string[] {
  const stopWords = new Set([
    "the", "a", "an", "is", "are", "was", "were", "be", "been", "being",
    "have", "has", "had", "do", "does", "did", "will", "would", "could",
    "should", "may", "might", "can", "shall", "to", "of", "in", "for",
    "on", "with", "at", "by", "from", "as", "into", "through", "during",
    "before", "after", "above", "below", "between", "out", "off", "over",
    "under", "again", "further", "then", "once", "here", "there", "when",
    "where", "why", "how", "all", "each", "every", "both", "few", "more",
    "most", "other", "some", "such", "no", "not", "only", "own", "same",
    "so", "than", "too", "very", "just", "about", "what", "which", "who",
    "this", "that", "these", "those", "am", "but", "and", "or", "if",
    "my", "me", "i", "we", "our", "you", "your", "they", "them", "their",
    "it", "its", "he", "she", "his", "her", "any", "also", "get", "got",
    "like", "know", "think", "want", "need", "look", "help", "tell",
    "show", "find", "give", "make", "go", "come", "see", "take",
    "programs", "program", "best", "good", "right", "new", "first",
  ]);

  return message
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, " ")
    .split(/\s+/)
    .filter(w => w.length > 2 && !stopWords.has(w))
    .slice(0, 15); // Cap at 15 terms
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") return res.status(405).end();

  const { message, mode, history = [] } = req.body;
  if (!message) return res.status(400).json({ error: "No message" });

  try {
    // Detect province mention for filtering
    const provMap: Record<string, string[]> = {
      alberta: ["AB"], ontario: ["ON"],
      saskatchewan: ["SK"], manitoba: ["MB"],
      "british columbia": ["BC"], quebec: ["QC"],
      atlantic: ["NB", "NS", "PE", "NL"], "new brunswick": ["NB"], "nova scotia": ["NS"],
      "prince edward": ["PE"], newfoundland: ["NL"], national: ["National"],
    };
    // Also match province codes from wizard context prefix (e.g. "Province: ON")
    const provCodeMap: Record<string, string> = {
      "ab": "AB", "on": "ON", "sk": "SK", "mb": "MB", "bc": "BC",
      "qc": "QC", "nb": "NB", "ns": "NS", "pe": "PE", "nl": "NL",
    };
    const msgLower = message.toLowerCase();
    const detectedProvs: string[] = [];
    for (const [k, v] of Object.entries(provMap)) {
      if (msgLower.includes(k)) {
        for (const prov of v) {
          if (!detectedProvs.includes(prov)) detectedProvs.push(prov);
        }
      }
    }
    // Match "Province: ON" or "Province: AB, SK" patterns from wizard context
    const provContextMatch = msgLower.match(/province:\s*([a-z,\s]+?)(?:\.|]|\n)/);
    if (provContextMatch) {
      for (const code of provContextMatch[1].split(",").map((s: string) => s.trim())) {
        const mapped = provCodeMap[code];
        if (mapped && !detectedProvs.includes(mapped)) detectedProvs.push(mapped);
      }
    }

    // Detect stage from wizard context prefix (e.g. "Stage: MVP")
    const stageMatch = msgLower.match(/stage:\s*(idea|mvp|pilot|comm|scale)/);
    const detectedStage = stageMatch ? stageMatch[1].charAt(0).toUpperCase() + stageMatch[1].slice(1) : "";

    // ── Name-match lookup: check if user is asking about a specific program ──
    const nameMatches = await client.unsafe(
      `SELECT name, category, description, use_case, province, stage, website FROM programs WHERE name ILIKE $1 OR name ILIKE $2 LIMIT 5`,
      [`%${msgLower.replace(/[^a-z0-9 ]/g, "").trim()}%`, `%${msgLower.split(" ").filter((w: string) => w.length > 3).join("%")}%`]
    );

    // Fetch relevant programs (broader context) — filter by province AND stage when available
    let contextRows: any[];
    if (detectedProvs.length > 0 && detectedStage) {
      contextRows = await client.unsafe(
        `SELECT name, category, description, use_case, province, stage, website FROM programs WHERE (province && $1 OR 'National' = ANY(province)) AND $2 = ANY(stage) ORDER BY name LIMIT 20`,
        [detectedProvs, detectedStage]
      );
    } else if (detectedProvs.length > 0) {
      contextRows = await client.unsafe(
        `SELECT name, category, description, use_case, province, stage, website FROM programs WHERE province && $1 OR 'National' = ANY(province) ORDER BY name LIMIT 20`,
        [detectedProvs]
      );
    } else if (detectedStage) {
      contextRows = await client.unsafe(
        `SELECT name, category, description, use_case, province, stage, website FROM programs WHERE $1 = ANY(stage) ORDER BY name LIMIT 20`,
        [detectedStage]
      );
    } else {
      contextRows = await client.unsafe(
        `SELECT name, category, description, use_case, province, stage, website FROM programs ORDER BY name LIMIT 20`
      );
    }

    // Merge: name matches first, then context rows (deduplicated)
    const seenNames = new Set(nameMatches.map((r: any) => r.name));
    const rows = [...nameMatches, ...contextRows.filter((r: any) => !seenNames.has(r.name))];

    // ── Smart knowledge retrieval ──────────────────────────────────────
    // Strategy: pull entries that match by province OR by tag overlap with message keywords
    // This replaces the old LIMIT 8 approach that ignored relevance
    const searchTerms = extractSearchTerms(message);
    const provArray = detectedProvs.length > 0 ? detectedProvs : [];

    let knowledge: any[];

    if (searchTerms.length > 0 || provArray.length > 0) {
      // Build a relevance-scored query
      // Score = (number of matching tags) + (province match bonus)
      const tagPattern = searchTerms.length > 0 ? searchTerms.join("|") : "NOMATCH";
      const provClause = provArray.length > 0
        ? `OR province && $2::text[] OR 'National' = ANY(province)`
        : "";

      knowledge = await client.unsafe(
        `SELECT title, body,
          (SELECT COUNT(*) FROM unnest(tags) AS t WHERE t ~* $1) AS tag_score,
          CASE WHEN ${provArray.length > 0 ? `province && $2::text[] OR 'National' = ANY(province)` : "FALSE"} THEN 2 ELSE 0 END AS prov_score
        FROM knowledge
        ORDER BY
          (SELECT COUNT(*) FROM unnest(tags) AS t WHERE t ~* $1)
          + CASE WHEN ${provArray.length > 0 ? `province && $2::text[] OR 'National' = ANY(province)` : "FALSE"} THEN 2 ELSE 0 END
          DESC,
          confidence DESC
        LIMIT 8`,
        provArray.length > 0
          ? [tagPattern, `{${provArray.join(",")}}`]
          : [tagPattern]
      );
    } else {
      // Fallback: just get top by confidence
      knowledge = await client.unsafe(
        `SELECT title, body FROM knowledge ORDER BY confidence DESC LIMIT 10`
      );
    }

    // Filter out zero-relevance entries if we have enough good ones
    const scored = knowledge as any[];
    const relevant = scored.filter((k: any) => (k.tag_score || 0) + (k.prov_score || 0) > 0);
    const finalKnowledge = relevant.length >= 4 ? relevant : scored.slice(0, 10);

    const context = `ECOSYSTEM DATA (${rows.length} programs${detectedProvs.length ? ` in ${detectedProvs.join(", ")}` : ""}):
${rows.map((p: any) => `- ${p.name} [${p.category}] | Stages: ${(p.stage || []).join(",")} | Province: ${(p.province || []).join(",")} | ${p.description?.slice(0, 120) || ""}`).join("\n")}

${finalKnowledge.length ? `ECOSYSTEM INTELLIGENCE:\n${finalKnowledge.map((k: any) => `[${k.title}]: ${k.body}`).join("\n\n")}` : ""}`;

    const apiRes = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY || "",
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 2048,
        system: (mode === "ec" ? SYSTEM_EC : SYSTEM_E) + "\n\n" + context,
        messages: [
          ...history.slice(-6),
          { role: "user", content: message },
        ],
      }),
    });

    const data = await apiRes.json() as any;
    const reply = data.content?.[0]?.text || "Something went wrong.";
    return res.status(200).json({ reply });
  } catch (e) {
    return res.status(500).json({ error: String(e) });
  }
}
