import type { VercelRequest, VercelResponse } from "@vercel/node";
import postgres from "postgres";

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
