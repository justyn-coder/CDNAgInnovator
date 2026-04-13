import type { VercelRequest, VercelResponse } from "@vercel/node";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { programs } from "../schema.js";
import { sql, or, gte, lte, and, asc } from "drizzle-orm";
import { setCors } from "../_lib/rate-limit.js";

const conn = process.env.POSTGRES_URL || process.env.DATABASE_URL || "";
const client = postgres(conn, { ssl: "require", max: 1 });
const db = drizzle(client);

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (!setCors(req, res)) return;
  if (req.method !== "GET") return res.status(405).end();

  try {
    const dateFrom = typeof req.query.date_from === "string" ? req.query.date_from : undefined;
    const dateTo = typeof req.query.date_to === "string" ? req.query.date_to : undefined;
    const sortBy = typeof req.query.sort === "string" ? req.query.sort : undefined;
    const upcomingOnly = req.query.upcoming_only === "true";

    const conditions = [];

    // Date range filter: match if ANY date column falls within range
    if (dateFrom || dateTo) {
      const dateCols = [programs.eventStartDate, programs.eventEndDate, programs.applicationDeadline];
      const colConditions = dateCols.map(col => {
        const parts = [];
        if (dateFrom) parts.push(gte(col, dateFrom));
        if (dateTo) parts.push(lte(col, dateTo));
        return parts.length === 2 ? and(...parts) : parts[0];
      });
      conditions.push(or(...colConditions));
    }

    // Upcoming-only filter: exclude past events
    if (upcomingOnly) {
      const today = new Date().toISOString().split("T")[0];
      conditions.push(
        or(
          gte(programs.eventEndDate, today),
          sql`${programs.eventEndDate} IS NULL`
        )
      );
    }

    // Build query
    let query = db.select().from(programs);

    if (conditions.length > 0) {
      query = query.where(and(...conditions)) as typeof query;
    }

    // Sort
    if (sortBy === "upcoming") {
      query = query.orderBy(
        sql`${programs.eventStartDate} ASC NULLS LAST`,
        asc(programs.name)
      ) as typeof query;
    } else {
      query = query.orderBy(asc(programs.name)) as typeof query;
    }

    const result = await query;
    return res.status(200).json(result);
  } catch (e) {
    console.error("[programs] Error:", e);
    return res.status(500).json({ error: String(e) });
  }
}
