import type { VercelRequest, VercelResponse } from "@vercel/node";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { submissions } from "../../schema.js";
import { desc } from "drizzle-orm";

const conn = process.env.POSTGRES_URL || process.env.DATABASE_URL || "";
const client = postgres(conn, { ssl: "require", max: 1 });
const db = drizzle(client);

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "GET") return res.status(405).end();

  const secret = process.env.ADMIN_SECRET;
  if (!secret) return res.status(500).json({ error: "ADMIN_SECRET not configured" });

  const auth = req.headers.authorization;
  if (!auth || auth !== `Bearer ${secret}`) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  try {
    const rows = await db.select().from(submissions).orderBy(desc(submissions.createdAt));
    // Return as simple HTML table for easy browser viewing
    const accept = req.headers.accept || "";
    if (accept.includes("text/html")) {
      const html = `<!DOCTYPE html><html><head><title>Trellis Feedback</title>
        <style>body{font-family:system-ui;padding:24px;max-width:960px;margin:0 auto}
        table{border-collapse:collapse;width:100%}th,td{border:1px solid #ddd;padding:8px 12px;text-align:left;font-size:14px}
        th{background:#f5f5f5;font-weight:600}tr:nth-child(even){background:#fafafa}
        .feedback{max-width:400px;white-space:pre-wrap}</style></head>
        <body><h1>Trellis Feedback (${rows.length})</h1>
        <table><tr><th>Date</th><th>Name</th><th>Email</th><th>Context</th><th>Feedback</th></tr>
        ${rows.map(r => `<tr>
          <td>${r.createdAt ? new Date(r.createdAt).toLocaleDateString() : "—"}</td>
          <td>${esc(r.submitterName)}</td>
          <td>${esc(r.submitterEmail)}</td>
          <td>${esc(r.programName)}</td>
          <td class="feedback">${esc(r.bestFor)}</td>
        </tr>`).join("")}
        </table></body></html>`;
      res.setHeader("Content-Type", "text/html");
      return res.status(200).send(html);
    }
    return res.status(200).json({ count: rows.length, submissions: rows });
  } catch (e) {
    return res.status(500).json({ error: String(e) });
  }
}

function esc(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}
