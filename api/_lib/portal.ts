import type { VercelRequest, VercelResponse } from "@vercel/node";
import postgres from "postgres";
import crypto from "crypto";

const conn = process.env.POSTGRES_URL || process.env.DATABASE_URL || "";
export const sql = postgres(conn, { ssl: "require", max: 1 });

export interface PortalPerson {
  org: string;
  person: string;
  display_name: string;
  role: string | null;
  email: string | null;
}

export async function verifyPerson(org: string, person: string): Promise<PortalPerson | null> {
  if (!org || !person) return null;
  const rows = await sql`
    SELECT org, person, display_name, role, email
    FROM portal_people
    WHERE org = ${org} AND person = ${person}
    LIMIT 1
  `;
  return ((rows as any[])[0] as PortalPerson) || null;
}

export function hashIp(req: VercelRequest): string {
  const ip = (req.headers["x-forwarded-for"] as string || "unknown").split(",")[0].trim();
  return crypto.createHash("sha256").update(ip).digest("hex").slice(0, 16);
}

export async function logEvent(params: {
  req: VercelRequest;
  org: string;
  person: string;
  event_type: string;
  path?: string;
  metadata?: Record<string, unknown>;
}) {
  try {
    const { req, org, person, event_type, path = null, metadata = {} } = params;
    await sql`
      INSERT INTO portal_access_log (org, person, event_type, path, metadata, ip_hash, user_agent)
      VALUES (${org}, ${person}, ${event_type}, ${path}, ${JSON.stringify(metadata)}::jsonb, ${hashIp(req)}, ${(req.headers["user-agent"] as string) || null})
    `;
    await sql`
      UPDATE portal_people
      SET last_seen_at = NOW(),
          first_seen_at = COALESCE(first_seen_at, NOW())
      WHERE org = ${org} AND person = ${person}
    `;
  } catch (e) {
    console.error("portal.logEvent failed:", e);
  }
}

export function portalCors(req: VercelRequest, res: VercelResponse): boolean {
  const ALLOWED = [
    "https://trellisag.ca",
    "https://www.trellisag.ca",
    "https://cdn-ag-innovator.vercel.app",
    "http://localhost:5173",
    "http://localhost:3000",
    "http://localhost:3001",
  ];
  const origin = req.headers.origin || "";
  if (origin && !ALLOWED.includes(origin)) {
    res.status(403).json({ error: "origin not allowed" });
    return false;
  }
  const allowedOrigin = ALLOWED.includes(origin) ? origin : ALLOWED[0];
  res.setHeader("Access-Control-Allow-Origin", allowedOrigin);
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  if (req.method === "OPTIONS") {
    res.status(204).end();
    return false;
  }
  return true;
}
