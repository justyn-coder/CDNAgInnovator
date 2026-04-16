import type { VercelRequest, VercelResponse } from "@vercel/node";
import postgres from "postgres";

const ALLOWED_ORIGINS = [
  "https://trellisag.ca",
  "https://www.trellisag.ca",
  "https://cdn-ag-innovator.vercel.app",
  "http://localhost:5173", // vite dev
  "http://localhost:3000", // vercel dev
  "http://localhost:3001", // vercel dev (alt port)
];

/**
 * Set CORS headers. Returns false (and sends 403) if origin is not allowed.
 * Call at the top of every public handler.
 */
export function setCors(req: VercelRequest, res: VercelResponse): boolean {
  const origin = req.headers.origin || "";

  if (origin && !ALLOWED_ORIGINS.includes(origin)) {
    res.status(403).json({ error: "Origin not allowed" });
    return false;
  }

  const allowedOrigin = ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];
  res.setHeader("Access-Control-Allow-Origin", allowedOrigin);
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  // Handle preflight
  if (req.method === "OPTIONS") {
    res.status(204).end();
    return false;
  }

  return true;
}

const conn = process.env.POSTGRES_URL || process.env.DATABASE_URL || "";
const sql = postgres(conn, { ssl: "require", max: 1 });

interface RateLimitConfig {
  maxRequests: number;   // max requests allowed
  windowSeconds: number; // rolling window in seconds
  endpoint: string;      // identifier for this endpoint
}

/**
 * Check rate limit for a request. Returns true if allowed, false if blocked.
 * Sends 429 response automatically if blocked.
 */
export async function checkRateLimit(
  req: VercelRequest,
  res: VercelResponse,
  config: RateLimitConfig
): Promise<boolean> {
  const ip = (req.headers["x-forwarded-for"] as string || "unknown").split(",")[0].trim();

  try {
    // Count recent requests from this IP for this endpoint
    const result = await sql`
      SELECT COUNT(*) as cnt FROM rate_limits
      WHERE ip = ${ip}
        AND endpoint = ${config.endpoint}
        AND timestamp > NOW() - ${config.windowSeconds + " seconds"}::interval
    `;

    const count = parseInt((result as any[])[0]?.cnt || "0", 10);

    if (count >= config.maxRequests) {
      res.setHeader("Retry-After", String(config.windowSeconds));
      res.status(429).json({
        error: "Too many requests. Please try again later.",
        retry_after: config.windowSeconds,
      });
      return false;
    }

    // Record this request
    await sql`
      INSERT INTO rate_limits (ip, endpoint, timestamp)
      VALUES (${ip}, ${config.endpoint}, NOW())
    `;

    return true;
  } catch (e) {
    // If rate limiting fails (DB issue), allow the request but log it
    console.error("Rate limit check failed:", e);
    return true;
  }
}
