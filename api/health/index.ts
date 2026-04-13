import type { VercelRequest, VercelResponse } from "@vercel/node";
import postgres from "postgres";
import { sendEmail } from "../_lib/email.js";

const conn = process.env.POSTGRES_URL || process.env.DATABASE_URL || "";
const client = postgres(conn, { ssl: "require", max: 1 });

interface CheckResult {
  ok: boolean;
  ms: number;
  error?: string;
  [key: string]: unknown;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "GET") return res.status(405).end();

  // Auth: cron sends CRON_SECRET, manual calls use ADMIN_SECRET
  const authHeader = req.headers["authorization"] || "";
  const validCron = authHeader === `Bearer ${process.env.CRON_SECRET}`;
  const validAdmin = authHeader === `Bearer ${process.env.ADMIN_SECRET}`;
  if (!validCron && !validAdmin) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const checks: Record<string, CheckResult> = {};

  // 1. Database connectivity
  const dbStart = Date.now();
  try {
    await client`SELECT 1`;
    checks.database = { ok: true, ms: Date.now() - dbStart };
  } catch (e: any) {
    checks.database = { ok: false, ms: Date.now() - dbStart, error: e.message };
  }

  // 2. Program count (data integrity)
  const countStart = Date.now();
  try {
    const rows = await client`
      SELECT COUNT(*) as cnt FROM programs
      WHERE status NOT IN ('closed', 'dissolved')
    `;
    const count = parseInt((rows as any[])[0]?.cnt || "0", 10);
    checks.programs = { ok: count > 100, ms: Date.now() - countStart, count };
  } catch (e: any) {
    checks.programs = { ok: false, ms: Date.now() - countStart, error: e.message };
  }

  // 3. Anthropic API (model + key validation)
  const model = process.env.CLAUDE_SONNET_MODEL || "claude-sonnet-4-6";
  const aiStart = Date.now();
  try {
    const apiRes = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY || "",
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model,
        max_tokens: 10,
        messages: [{ role: "user", content: "Say OK" }],
      }),
    });

    const data = await apiRes.json() as any;

    if (!apiRes.ok) {
      checks.anthropic = {
        ok: false,
        ms: Date.now() - aiStart,
        model,
        error: `${data?.error?.type}: ${data?.error?.message}`,
      };
    } else {
      checks.anthropic = { ok: true, ms: Date.now() - aiStart, model };
    }
  } catch (e: any) {
    checks.anthropic = { ok: false, ms: Date.now() - aiStart, model, error: e.message };
  }

  // Determine overall status
  const allOk = Object.values(checks).every((c) => c.ok);
  const anyDown = checks.database?.ok === false || checks.anthropic?.ok === false;
  const status = allOk ? "healthy" : anyDown ? "down" : "degraded";

  const result = {
    status,
    checks,
    timestamp: new Date().toISOString(),
  };

  // Email on failure (fire-and-forget)
  if (!allOk) {
    const failedChecks = Object.entries(checks)
      .filter(([, c]) => !c.ok)
      .map(([name, c]) => `${name}: ${c.error || "failed"}`)
      .join(", ");

    sendEmail({
      subject: `Trellis health check FAILED: ${failedChecks}`,
      text: JSON.stringify(result, null, 2),
    }).catch((e) => console.error("Health alert email failed:", e));
  }

  return res.status(allOk ? 200 : 503).json(result);
}

export const config = { maxDuration: 30 };
