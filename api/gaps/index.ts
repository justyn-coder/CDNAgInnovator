import type { VercelRequest, VercelResponse } from "@vercel/node";
import postgres from "postgres";

const conn = process.env.POSTGRES_URL || process.env.DATABASE_URL || "";
const client = postgres(conn, { ssl: "require", max: 1 });

const PROVINCES = ["BC", "AB", "SK", "MB", "ON", "QC", "NB", "NS", "PE", "NL", "National"];
const CATEGORIES = ["Fund", "Accel", "Pilot", "Event", "Org", "Train"];

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "GET") return res.status(405).end();

  const stage = req.query.stage as string | undefined;

  try {
    // Pull all programs, optionally filtered by stage
    const rows = stage && stage !== "All"
      ? await client.unsafe(
          `SELECT name, category, province, stage, website, description
           FROM programs
           WHERE status NOT IN ('closed', 'dissolved', 'inactive')
             AND $1 = ANY(stage)`,
          [stage]
        )
      : await client.unsafe(
          `SELECT name, category, province, stage, website, description FROM programs WHERE status NOT IN ('closed', 'dissolved', 'inactive')`
        );

    // Build cell map: "PROVINCE|CATEGORY" -> program list
    const cellMap: Record<string, { name: string; website: string | null; description: string | null; stage: string[] }[]> = {};

    for (const row of rows as any[]) {
      const provinces: string[] = row.province || [];
      const category: string = row.category;

      if (!CATEGORIES.includes(category)) continue;

      for (const prov of provinces) {
        if (!PROVINCES.includes(prov)) continue;
        const key = `${prov}|${category}`;
        if (!cellMap[key]) cellMap[key] = [];
        cellMap[key].push({
          name: row.name,
          website: row.website,
          description: row.description?.slice(0, 120) || null,
          stage: row.stage || [],
        });
      }
    }

    // Build matrix output
    const matrix: Record<string, Record<string, { count: number; programs: { name: string; website: string | null; description: string | null; stage: string[] }[] }>> = {};

    for (const prov of PROVINCES) {
      matrix[prov] = {};
      for (const cat of CATEGORIES) {
        const key = `${prov}|${cat}`;
        const programs = cellMap[key] || [];
        matrix[prov][cat] = { count: programs.length, programs };
      }
    }

    // Summary stats
    const totalCells = PROVINCES.length * CATEGORIES.length;
    const emptyCells = Object.values(matrix).flatMap(p => Object.values(p)).filter(c => c.count === 0).length;
    const weakCells = Object.values(matrix).flatMap(p => Object.values(p)).filter(c => c.count === 1).length;

    return res.status(200).json({
      matrix,
      provinces: PROVINCES,
      categories: CATEGORIES,
      summary: {
        totalCells,
        emptyCells,
        weakCells,
        coveredCells: totalCells - emptyCells,
        stageFilter: stage || "All",
      },
    });
  } catch (e) {
    return res.status(500).json({ error: String(e) });
  }
}
