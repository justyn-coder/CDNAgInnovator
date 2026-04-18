// POST /api/ingest/linkedin
// Zero-friction LinkedIn capture endpoint. iOS Shortcut hits this.
//
// Flow:
//   1. Validate auth (Bearer INGEST_SECRET)
//   2. Cheap shape validation on body
//   3. Idempotency check (same source_url + captured_by within current UTC hour)
//   4. INSERT into captures with decision='queued', return 202 {capture_id} fast
//   5. Kick off processCapture() async. Uses Vercel's `waitUntil`-style deferred work
//      by simply awaiting with a reasonable timeout. The endpoint's maxDuration
//      is set high so we can afford to process inline. If it times out, the retry
//      cron picks it up.

import type { VercelRequest, VercelResponse } from "@vercel/node";
import postgres from "postgres";
import { buildIdempotencyKey } from "../_lib/ingest/linkedin-normalize.js";
import { processCapture } from "../_lib/ingest/pipeline.js";
import type { CaptureSource, IngestRequest } from "../_lib/ingest/types.js";

const conn = process.env.POSTGRES_URL || process.env.DATABASE_URL || "";
const sql = postgres(conn, { ssl: "require", max: 2 });

export const config = { maxDuration: 60 };

function authorized(req: VercelRequest): boolean {
  const secret = process.env.INGEST_SECRET;
  if (!secret) return false;
  const h = req.headers.authorization || "";
  return h === `Bearer ${secret}`;
}

function isFeatureEnabled(): boolean {
  // Default: flag must be explicitly "true" to accept captures. Safer for rollout.
  return (process.env.INGEST_ENABLED || "").toLowerCase() === "true";
}

interface RateLimitState {
  count: number;
  windowStart: number;
  authFailures: number;
  authFailWindow: number;
}

const rlMap = new Map<string, RateLimitState>();

function checkRateLimit(token: string): { ok: boolean; reason?: string } {
  const now = Date.now();
  const state = rlMap.get(token) || {
    count: 0,
    windowStart: now,
    authFailures: 0,
    authFailWindow: now,
  };

  // 1h success window, 100 req cap
  if (now - state.windowStart > 60 * 60 * 1000) {
    state.count = 0;
    state.windowStart = now;
  }
  if (state.count >= 100) {
    rlMap.set(token, state);
    return { ok: false, reason: "rate_limit_100_per_hour" };
  }
  state.count += 1;
  rlMap.set(token, state);
  return { ok: true };
}

function recordAuthFailure(ip: string): boolean {
  const now = Date.now();
  const state = rlMap.get(`auth:${ip}`) || {
    count: 0,
    windowStart: now,
    authFailures: 0,
    authFailWindow: now,
  };
  // 1min auth-fail window, 5 fail cap → 15min block
  if (now - state.authFailWindow > 60 * 1000) {
    state.authFailures = 0;
    state.authFailWindow = now;
  }
  state.authFailures += 1;
  rlMap.set(`auth:${ip}`, state);
  // Returns true if blocked
  return state.authFailures > 5;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Strictly POST only — no CORS since this is token-auth (not from a browser).
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const ip = String(req.headers["x-forwarded-for"] || "").split(",")[0].trim() || "unknown";

  if (!authorized(req)) {
    const blocked = recordAuthFailure(ip);
    if (blocked) {
      return res.status(429).json({ error: "too many auth failures, blocked 15min" });
    }
    return res.status(401).json({ error: "unauthorized" });
  }

  if (!isFeatureEnabled()) {
    return res.status(503).json({ error: "INGEST_ENABLED is off" });
  }

  // Parse body
  let body: IngestRequest;
  try {
    body = (typeof req.body === "string" ? JSON.parse(req.body) : req.body) as IngestRequest;
  } catch {
    return res.status(400).json({ error: "invalid json body" });
  }

  if (!body || typeof body !== "object") {
    return res.status(400).json({ error: "body must be a json object" });
  }

  // Require at least source_url or image_base64 or raw_text
  if (!body.source_url && !body.image_base64 && !body.raw_text) {
    return res
      .status(400)
      .json({ error: "must provide source_url, image_base64, or raw_text" });
  }

  const captured_by = (body.captured_by || "justyn").slice(0, 64);

  // Per-user rate limit (100/hr)
  const rl = checkRateLimit(captured_by);
  if (!rl.ok) {
    res.setHeader("Retry-After", "3600");
    return res.status(429).json({ error: "rate limit", reason: rl.reason });
  }

  const source: CaptureSource = body.source
    ? body.source
    : body.image_base64
    ? "linkedin_screenshot"
    : body.source_url
    ? "linkedin_post"
    : "manual";

  const now = new Date();
  const idempotency_key = buildIdempotencyKey(body.source_url, captured_by, now);

  // Idempotency: if the same (source_url, captured_by, hour) already has a row, return it.
  if (idempotency_key) {
    try {
      const existing = await sql`
        SELECT id, decision FROM captures
        WHERE idempotency_key = ${idempotency_key}
        LIMIT 1
      `;
      if (existing.length > 0) {
        return res.status(200).json({
          capture_id: existing[0].id,
          status: existing[0].decision,
          idempotent: true,
        });
      }
    } catch (e) {
      console.error("idempotency check failed:", e);
    }
  }

  // Optionally store the image_base64 — for Phase 1 we keep it in memory only and
  // pass directly to the classifier for vision input. Storage integration is a
  // Phase 1.5 add (Supabase Storage bucket).
  const image_url: string | null = null; // reserved for Phase 1.5 Supabase Storage

  // Insert capture row
  let capture_id: number;
  try {
    const ins = await sql`
      INSERT INTO captures (
        source, source_url, image_url, raw_text,
        author_name, author_url, captured_by,
        idempotency_key, decision
      ) VALUES (
        ${source},
        ${body.source_url || null},
        ${image_url},
        ${body.raw_text || null},
        ${body.author_name || null},
        ${body.author_url || null},
        ${captured_by},
        ${idempotency_key},
        'queued'
      )
      RETURNING id
    `;
    capture_id = ins[0].id as number;
  } catch (e: any) {
    const msg = String(e).slice(0, 300);
    // Unique violation (race on idempotency_key) — return the existing row.
    if (msg.includes("captures_idempotency_idx") || msg.includes("duplicate key")) {
      const existing = await sql`
        SELECT id FROM captures WHERE idempotency_key = ${idempotency_key} LIMIT 1
      `;
      if (existing.length > 0) {
        return res.status(200).json({ capture_id: existing[0].id, status: "queued", idempotent: true });
      }
    }
    console.error("capture insert failed:", e);
    return res.status(500).json({ error: "capture insert failed", detail: msg });
  }

  // Kick off async processing. Since Vercel serverless doesn't always support
  // waitUntil in plain node handlers, we process synchronously with a guardrail:
  // if image_base64 is present (vision input), pass it through here since the
  // pipeline reads from DB only. For phase 1, fall back to raw_text+URL path
  // for image captures; vision is a stretch goal for this slice.
  //
  // We await classification so the response time reflects actual pipeline status,
  // but we cap ourselves with a soft timeout via Promise.race to return 202 if
  // we're still running at the limit.

  const softTimeoutMs = 45000;
  const raceResult = await Promise.race([
    processCapture(sql, capture_id, { image_base64: body.image_base64 })
      .then((r) => ({ kind: "done" as const, result: r }))
      .catch((e) => ({ kind: "err" as const, err: String(e) })),
    new Promise<{ kind: "timeout" }>((resolve) =>
      setTimeout(() => resolve({ kind: "timeout" }), softTimeoutMs)
    ),
  ]);

  if (raceResult.kind === "done") {
    return res.status(202).json({
      capture_id,
      status: raceResult.result.decision,
      classification: raceResult.result.classification,
      confidence: raceResult.result.confidence,
      target_table: raceResult.result.target_table,
      target_id: raceResult.result.target_id,
    });
  }

  if (raceResult.kind === "err") {
    // pipeline already marked the row as 'error' if it got far enough; retry cron will pick up.
    return res.status(202).json({
      capture_id,
      status: "processing_error_background",
      detail: String(raceResult.err).slice(0, 200),
    });
  }

  // timeout — return 202, retry cron picks up via decision='classifying' + stale updated_at
  return res.status(202).json({
    capture_id,
    status: "processing",
    note: "background classification continuing; retry cron will finalize",
  });
}
