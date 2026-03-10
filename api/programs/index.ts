import type { VercelRequest, VercelResponse } from "@vercel/node";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { programs } from "../schema.js";

const conn = process.env.POSTGRES_URL || process.env.DATABASE_URL || "";
const client = postgres(conn, { ssl: "require", max: 1 });
const db = drizzle(client);

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "GET") return res.status(405).end();
  try {
    const result = await db.select().from(programs).orderBy(programs.name);
    return res.status(200).json(result);
  } catch (e) {
    return res.status(500).json({ error: String(e) });
  }
}
