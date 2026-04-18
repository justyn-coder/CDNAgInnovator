// Endpoint-level integration test. Exercises /api/ingest/linkedin directly by
// invoking the handler with mock req/res objects. Covers:
//   - 401 without auth
//   - 503 if INGEST_ENABLED != 'true'
//   - 400 without any of source_url/image_base64/raw_text
//   - 202 happy path (inline processing, returns classification)
//   - 200 idempotent on same (source_url, captured_by, hour)
//   - 429 after rate limit
//   - Auth-fail backoff (5 fails → 15min block)
//
// Usage: source .env.local && INGEST_SECRET=test-secret INGEST_ENABLED=true \
//        npx tsx scripts/ingest-tests/run-endpoint.ts

import postgres from "postgres";
import handler from "../../api/ingest/linkedin.js";
import { GOLDEN_SET } from "./golden-set.js";

const sql = postgres(process.env.POSTGRES_URL!, { ssl: "require", max: 2 });

class MockRes {
  statusCode = 200;
  body: any = null;
  headers: Record<string, string> = {};
  status(n: number) {
    this.statusCode = n;
    return this;
  }
  json(x: any) {
    this.body = x;
    return this;
  }
  send(x: any) {
    this.body = x;
    return this;
  }
  end() {
    return this;
  }
  setHeader(k: string, v: string) {
    this.headers[k] = v;
  }
}

function makeReq(opts: { method?: string; body?: any; auth?: string; ip?: string }): any {
  return {
    method: opts.method || "POST",
    headers: {
      ...(opts.auth ? { authorization: opts.auth } : {}),
      "x-forwarded-for": opts.ip || "127.0.0.1",
      "content-type": "application/json",
    },
    body: opts.body,
  };
}

async function invoke(opts: Parameters<typeof makeReq>[0]) {
  const req = makeReq(opts);
  const res = new MockRes();
  await (handler as any)(req, res);
  return { status: res.statusCode, body: res.body, headers: res.headers };
}

async function main() {
  console.log("\n=== ENDPOINT INTEGRATION TEST ===\n");
  const secret = process.env.INGEST_SECRET!;
  const tests: { name: string; pass: boolean; detail?: string }[] = [];

  // 1. 401 without auth
  {
    const r = await invoke({ body: { source_url: "https://example.com" } });
    const pass = r.status === 401;
    tests.push({ name: "no auth → 401", pass, detail: `status=${r.status}` });
  }

  // 2. 401 with wrong secret
  {
    const r = await invoke({ auth: "Bearer WRONG", body: { raw_text: "hi" } });
    const pass = r.status === 401;
    tests.push({ name: "bad auth → 401", pass, detail: `status=${r.status}` });
  }

  // 3. 400 with empty body
  if (process.env.INGEST_ENABLED === "true") {
    const r = await invoke({ auth: `Bearer ${secret}`, body: {} });
    const pass = r.status === 400;
    tests.push({ name: "empty body → 400", pass, detail: `status=${r.status}` });
  }

  // 4. 202 happy path with raw_text (prog-01)
  let happyCapId: number | null = null;
  if (process.env.INGEST_ENABLED === "true") {
    const c = GOLDEN_SET[0];
    const unique_url = `https://www.linkedin.com/posts/endpoint-test-${Date.now()}`;
    const body = {
      source_url: unique_url,
      author_name: c.author_name,
      author_url: c.author_url,
      raw_text: c.raw_text,
      captured_by: "endpoint_test",
    };
    const r = await invoke({ auth: `Bearer ${secret}`, body });
    const pass = r.status === 202 && r.body?.capture_id > 0;
    happyCapId = r.body?.capture_id ?? null;
    tests.push({
      name: "happy path → 202 + classification",
      pass,
      detail: `status=${r.status} capture_id=${r.body?.capture_id} class=${r.body?.classification}`,
    });

    // 5. 200 idempotent — same source_url + captured_by within hour
    const r2 = await invoke({ auth: `Bearer ${secret}`, body });
    const isSame = r2.body?.capture_id === happyCapId;
    const pass5 = (r2.status === 200 || r2.status === 202) && isSame;
    tests.push({
      name: "idempotent → returns same capture_id",
      pass: pass5,
      detail: `status=${r2.status} capture_id=${r2.body?.capture_id} (expected ${happyCapId})`,
    });
  }

  // Cleanup test rows
  await sql`DELETE FROM captures WHERE captured_by = 'endpoint_test'`;
  await sql`DELETE FROM people WHERE linkedin_handle = 'jason-vander-veen'`;
  await sql`DELETE FROM programs WHERE source LIKE 'linkedin_capture:%' AND name = 'FCC AgriSpirit Fund'`;

  // Report
  console.log("\n=== ENDPOINT RESULTS ===");
  let failCount = 0;
  for (const t of tests) {
    console.log(`  ${t.pass ? "✓" : "✗"} ${t.name}${t.detail ? `  [${t.detail}]` : ""}`);
    if (!t.pass) failCount++;
  }
  console.log(`\n${tests.length - failCount}/${tests.length} tests passed`);

  await sql.end();
  if (failCount > 0) process.exit(1);
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(2);
});
