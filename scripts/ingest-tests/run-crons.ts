// Verify the cron endpoints execute without crashing.
// We don't assert email send (GMAIL creds may not be configured locally) — we
// just confirm the handlers return 200 and produce a body we can inspect.
//
// Usage: source .env.local && npx tsx scripts/ingest-tests/run-crons.ts

import retryHandler from "../../api/admin/captures/retry-queued.js";
import digestHandler from "../../api/admin/captures/digest.js";
import weeklyHandler from "../../api/admin/captures/weekly-metrics.js";

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

function makeReq(method = "GET", auth = ""): any {
  return {
    method,
    headers: { ...(auth ? { authorization: auth } : {}), "content-type": "application/json" },
  };
}

async function call(name: string, handler: any, auth: string) {
  const res = new MockRes();
  await handler(makeReq("GET", auth), res);
  return { name, status: res.statusCode, body: res.body };
}

async function main() {
  console.log("\n=== CRON HANDLER SMOKE TESTS ===\n");

  const cron = `Bearer ${process.env.CRON_SECRET}`;
  const nobody = "Bearer WRONG";

  const results: any[] = [];

  // 1. 401 without auth
  results.push(await call("retry-queued no-auth", retryHandler, nobody));
  results.push(await call("digest no-auth", digestHandler, nobody));
  results.push(await call("weekly no-auth", weeklyHandler, nobody));

  // 2. 200 with valid cron secret
  results.push(await call("retry-queued cron", retryHandler, cron));
  results.push(await call("digest cron", digestHandler, cron));
  results.push(await call("weekly cron", weeklyHandler, cron));

  for (const r of results) {
    const expect =
      r.name.includes("no-auth") ? 401 :
      r.name.includes("retry") ? 200 :
      r.name.includes("digest") || r.name.includes("weekly") ? 200 : 200;
    const pass = r.status === expect;
    const mark = pass ? "✓" : "✗";
    const detail = r.body
      ? typeof r.body === "object"
        ? JSON.stringify(r.body).slice(0, 150)
        : String(r.body).slice(0, 150)
      : "";
    console.log(`${mark} ${r.name.padEnd(26)} status=${r.status} ${detail}`);
  }

  const failed = results.filter((r) => {
    const expect = r.name.includes("no-auth") ? 401 : 200;
    return r.status !== expect;
  }).length;

  console.log(`\n${results.length - failed}/${results.length} cron smoke tests passed`);
  process.exit(failed > 0 ? 1 : 0);
}

main().catch((e) => {
  console.error(e);
  process.exit(2);
});
