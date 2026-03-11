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

ADVISOR CHANNEL INSIGHT: For any founder at Pilot stage or beyond whose product will be used by farmers/growers, flag if they haven't mentioned engaging the agronomist/CCA advisor channel. In Canadian agriculture, going direct-to-farmer without trusted advisor endorsement is the #1 adoption mistake. Key programs for advisor access: AgSphere (AB), Farming Smarter Field-Tested (AB), CCA networks (Prairies), provincial agrologist institutes. Frame this constructively: "The fastest path to farmer adoption runs through their trusted crop advisor."`;

const SYSTEM_EC = `You are a Canadian agtech ecosystem analyst. Today's date is ${new Date().toLocaleDateString('en-CA', { year: 'numeric', month: 'long', day: 'numeric' })}. You help ecosystem operators (accelerator managers, government program officers, investors) understand gaps, coverage, and strategic opportunities in the Canadian agtech support landscape.

Be analytical. Surface gaps, overlaps, and strategic insights. Use data when available. Format findings clearly with headers.`;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") return res.status(405).end();

  const { message, mode, history = [] } = req.body;
  if (!message) return res.status(400).json({ error: "No message" });

  try {
    // Detect province mention for filtering
    const provMap: Record<string, string> = {
      alberta: "AB", "ab ": "AB", ontario: "ON", "on ": "ON",
      saskatchewan: "SK", " sk ": "SK", manitoba: "MB", " mb ": "MB",
      "british columbia": "BC", " bc ": "BC", quebec: "QC",
    };
    const msgLower = message.toLowerCase();
    let provFilter = "";
    for (const [k, v] of Object.entries(provMap)) {
      if (msgLower.includes(k)) { provFilter = v; break; }
    }

    // Fetch relevant programs
    const rows = await client.unsafe(
      provFilter
        ? `SELECT name, category, description, use_case, province, stage, website FROM programs WHERE $1 = ANY(province) OR 'National' = ANY(province) ORDER BY name LIMIT 50`
        : `SELECT name, category, description, use_case, province, stage, website FROM programs ORDER BY name LIMIT 50`,
      provFilter ? [provFilter] : []
    );

    // Fetch knowledge
    const knowledge = await client.unsafe(
      `SELECT title, body FROM knowledge ORDER BY confidence DESC LIMIT 8`
    );

    const context = `ECOSYSTEM DATA (${rows.length} programs${provFilter ? ` in ${provFilter}` : ""}):
${rows.map((p: any) => `- ${p.name} [${p.category}] | Stages: ${(p.stage || []).join(",")} | Province: ${(p.province || []).join(",")} | ${p.description?.slice(0, 120) || ""}`).join("\n")}

${knowledge.length ? `ECOSYSTEM INTELLIGENCE:\n${knowledge.map((k: any) => `[${k.title}]: ${k.body}`).join("\n\n")}` : ""}`;

    const apiRes = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY || "",
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 1024,
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
