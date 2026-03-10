import type { VercelRequest, VercelResponse } from "@vercel/node";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { submissions } from "../schema.js";

const conn = process.env.POSTGRES_URL || process.env.DATABASE_URL || "";
const client = postgres(conn, { ssl: "require", max: 1 });
const db = drizzle(client);

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") return res.status(405).end();
  try {
    const { programName, bestFor, submitterName, submitterEmail } = req.body;
    if (!programName || !bestFor || !submitterName || !submitterEmail)
      return res.status(400).json({ error: "Missing fields" });
    await db.insert(submissions).values({ programName, bestFor, submitterName, submitterEmail });
    return res.status(201).json({ ok: true });
  } catch (e) {
    return res.status(500).json({ error: String(e) });
  }
}
