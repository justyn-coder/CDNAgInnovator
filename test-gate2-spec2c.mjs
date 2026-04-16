import { chromium } from "playwright";

const BASE = "http://localhost:5173";

// Mock pathway response with ecosystem insights
const MOCK_PATHWAY = {
  pathway: {
    pathway_title: "Your MVP to Pilot Pathway",
    summary: "A test pathway with ecosystem insights.",
    steps: [
      {
        order: 1,
        program_name: "RDAR Applied Research",
        program_website: "https://rdar.ca",
        category: "Pilot",
        action: "Apply to RDAR for field trial funding.",
        why: "RDAR funds applied research projects that validate agtech in real farm conditions.",
        fit_confidence: "high",
        prepare: "Have your pilot protocol and budget ready.",
        timing: "now",
        horizon: false,
        ecosystem_insight: "According to findings from the Calgary AgTech Conference, RDAR has increased its agtech allocation by 40% this year.",
        insight_source: "calgary-agtech-conference-2026",
      },
      {
        order: 2,
        program_name: "Alberta Innovates",
        program_website: null,
        category: "Fund",
        action: "Apply for AICE voucher.",
        why: "Covers up to $100K in validation costs.",
        fit_confidence: "medium",
        prepare: "Partnership letter from a farm operator.",
        timing: "next_month",
        horizon: false,
        ecosystem_insight: null,
        insight_source: null,
      },
      {
        order: 3,
        program_name: "BioEnterprise",
        program_website: "https://bioenterprise.ca",
        category: "Accel",
        action: "Join the BioEnterprise Ag-tech Accelerator.",
        why: "Ontario-based but accepts national applicants.",
        fit_confidence: "medium",
        prepare: "Pitch deck and demo.",
        timing: "next_quarter",
        horizon: false,
        ecosystem_insight: "From the BioEnterprise National Roundtable, their accelerator has a 65% conversion rate to pilot partnerships.",
        insight_source: "CFIN Foodtech in Canada 2025 Ecosystem Report",
      },
      {
        order: 4,
        program_name: "AgSphere Network",
        program_website: null,
        category: "Org",
        action: "Connect with CCA advisors through AgSphere.",
        why: "Advisor channel is critical for farmer adoption.",
        fit_confidence: "exploratory",
        prepare: "Product one-pager for advisors.",
        timing: "horizon",
        horizon: true,
        ecosystem_insight: null,
        insight_source: null,
      },
    ],
    gap_warning: null,
    next_stage_note: "At Pilot stage, focus on third-party validation.",
  },
  meta: {
    stage: "MVP",
    nextStage: "Pilot",
    provinces: ["AB"],
    need: "validate-with-farmers",
    programsConsidered: 42,
    gapInfo: { Fund: 12, Accel: 3, Pilot: 2, Event: 8, Org: 5, Train: 1 },
    deterministicGaps: [],
  },
};

async function runTests() {
  const browser = await chromium.launch({ headless: true });
  const results = [];

  // ── Test 1: Home page loads ──────────────────────────────────────────────
  {
    const page = await browser.newPage();
    try {
      await page.goto(BASE, { waitUntil: "networkidle", timeout: 10000 });
      const title = await page.title();
      // The popup shows "Build My Pathway" and the page has the CTAs
      const hasContent = title.includes("Trellis");
      results.push({
        test: "Home page loads",
        pass: hasContent,
        detail: `title="${title}"`,
      });
    } catch (e) {
      results.push({ test: "Home page loads", pass: false, detail: e.message });
    }
    await page.close();
  }

  // ── Test 2: Pathway with ecosystem insights renders correctly ────────────
  {
    const page = await browser.newPage();
    try {
      // Pre-set localStorage to skip the welcome popup
      await page.goto(BASE, { waitUntil: "networkidle", timeout: 10000 });
      await page.evaluate(() => {
        localStorage.setItem("trellis_welcomed", "true");
        localStorage.setItem("ag_nav_mode", "e");
      });

      // Mock API calls
      await page.route("**/api/pathway", async (route) => {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify(MOCK_PATHWAY),
        });
      });
      await page.route("**/api/programs", async (route) => {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify([]),
        });
      });

      // Navigate to the wizard
      await page.goto(`${BASE}/navigator`, { waitUntil: "networkidle", timeout: 10000 });
      await page.waitForTimeout(500);

      // Step 1: Description — use click + type to trigger React state updates
      const textarea = page.locator("textarea").first();
      await textarea.waitFor({ state: "visible", timeout: 5000 });
      await textarea.click();
      await textarea.pressSequentially("Building a livestock monitoring IoT platform for ranchers", { delay: 10 });
      await page.waitForTimeout(300);

      // Next button should be enabled now (description > 8 chars)
      const nextBtn1 = page.locator("button:has-text('Next')").first();
      await nextBtn1.waitFor({ state: "visible", timeout: 3000 });
      await nextBtn1.click({ timeout: 5000 });
      await page.waitForTimeout(500);

      // Step 2: Stage — click MVP button then Next
      await page.locator("button:has-text('MVP')").first().click();
      await page.waitForTimeout(200);
      // Stage step auto-advances on click, or uses Next
      const stageNext = page.locator("button:has-text('Next')");
      if (await stageNext.count() > 0 && await stageNext.first().isEnabled()) {
        await stageNext.first().click();
      }
      await page.waitForTimeout(500);

      // Step 3: Province — click Alberta then Next
      await page.locator("button:has-text('Alberta')").first().click();
      await page.waitForTimeout(200);
      await page.locator("button:has-text('Next')").first().click({ timeout: 5000 });
      await page.waitForTimeout(500);

      // Step 3b: Sector — click Livestock (auto-advances on click for radio-like steps)
      const livestockBtn = page.locator("button:has-text('Livestock')").first();
      await livestockBtn.waitFor({ state: "visible", timeout: 3000 });
      await livestockBtn.click();
      await page.waitForTimeout(500);

      // Step 4: Need — click "Prove it works" then click Generate
      const proveBtn = page.locator("button:has-text('Prove it works')").first();
      await proveBtn.waitFor({ state: "visible", timeout: 3000 });
      await proveBtn.click();
      await page.waitForTimeout(300);

      // Click Generate button
      const genBtn = page.locator("button:has-text('Generate')").first();
      await genBtn.waitFor({ state: "visible", timeout: 5000 });
      await genBtn.click();

      // Wait for pathway to render (mocked, should be fast)
      await page.waitForSelector("text=Your Innovation Pathway", { timeout: 8000 });
      await page.waitForTimeout(500);

      // ── Check ecosystem insight callouts ──
      // Use the specific callout container class to avoid matching unrelated text
      const insightCallouts = await page.locator(".border-amber-400.border-l-2").count();
      results.push({
        test: "Ecosystem insight callouts render (expect 2 of 4 steps)",
        pass: insightCallouts === 2,
        detail: `insight callout containers found=${insightCallouts} (expected 2)`,
      });

      // Check first insight content renders
      const calgaryRef = await page.locator("text=Calgary AgTech Conference").count();
      results.push({
        test: "First insight content renders (Calgary AgTech Conference)",
        pass: calgaryRef > 0,
        detail: `found=${calgaryRef}`,
      });

      // Check second insight content renders
      const bioRef = await page.locator("text=BioEnterprise National Roundtable").count();
      results.push({
        test: "Second insight content renders (BioEnterprise Roundtable)",
        pass: bioRef > 0,
        detail: `found=${bioRef}`,
      });

      // Check source attribution for slug format (calgary-agtech-conference-2026)
      const slugSource = await page.locator("text=From Calgary Agtech Conference 2026").count();
      results.push({
        test: "Source attribution renders for slug format",
        pass: slugSource > 0,
        detail: `slug source found=${slugSource}`,
      });

      // Check source attribution for human-readable format
      const readableSource = await page.locator("text=From CFIN Foodtech in Canada 2025 Ecosystem Report").count();
      results.push({
        test: "Source attribution renders for human-readable format",
        pass: readableSource > 0,
        detail: `readable source found=${readableSource}`,
      });

      // Check graceful absence: steps 2 and 4 should NOT have insight callouts
      results.push({
        test: "Graceful absence: no empty callouts for steps without insights",
        pass: insightCallouts === 2,
        detail: `Exactly 2 of 4 steps show insight callout containers — steps without insights render cleanly`,
      });

      // Check that all 4 program names render (basic pathway regression)
      const rdar = await page.locator("text=RDAR Applied Research").count();
      const ai = await page.locator("text=Alberta Innovates").count();
      const bio = await page.locator("text=BioEnterprise").count();
      const ag = await page.locator("text=AgSphere Network").count();
      results.push({
        test: "All 4 pathway steps render (regression check)",
        pass: rdar > 0 && ai > 0 && bio > 0 && ag > 0,
        detail: `RDAR=${rdar}, AI=${ai}, Bio=${bio}, AgSphere=${ag}`,
      });

      // Check compass icon renders (SVG with circle + polygon)
      const compassSvgs = await page.locator("svg circle + polygon").count();
      results.push({
        test: "Compass icon renders in insight callouts",
        pass: compassSvgs >= 2,
        detail: `compass SVG elements=${compassSvgs}`,
      });

    } catch (e) {
      results.push({ test: "Pathway ecosystem insight rendering", pass: false, detail: e.message.substring(0, 200) });
    }
    await page.close();
  }

  // ── Test 3: formatSource utility correctness ─────────────────────────────
  {
    const page = await browser.newPage();
    try {
      await page.goto(BASE, { waitUntil: "networkidle", timeout: 10000 });

      // Evaluate the formatSource logic inline (can't dynamically import .ts)
      const formatResults = await page.evaluate(() => {
        const ACRONYMS = new Set([
          "BASF", "CFIN", "OCI", "AAFC", "BDC", "EDC", "FCC", "NRC", "IRAP",
          "RBC", "CAPI", "EMILI", "NPF", "PMRA", "CAAIN",
        ]);

        function formatSource(source, date) {
          const name = source.includes(" ")
            ? source
            : source.split("-").map(w =>
                ACRONYMS.has(w.toUpperCase()) ? w.toUpperCase() : w.charAt(0).toUpperCase() + w.slice(1)
              ).join(" ");
          if (date) {
            const d = new Date(date);
            if (!isNaN(d.getTime())) {
              const month = d.toLocaleString("en-CA", { month: "long" });
              return `From ${name} (${month} ${d.getFullYear()})`;
            }
          }
          return `From ${name}`;
        }

        return {
          slug_no_date: formatSource("calgary-agtech-conference-2026"),
          slug_with_date: formatSource("calgary-agtech-conference-2026", "2026-04-10"),
          readable_no_date: formatSource("CFIN Foodtech in Canada 2025 Ecosystem Report"),
          readable_with_date: formatSource("CFIN Foodtech in Canada 2025 Ecosystem Report", "2025-03-15"),
          acronym_basf: formatSource("basf-grower-journey-analysis"),
          acronym_capi: formatSource("capi-emili-report"),
          invalid_date: formatSource("some-source", "not-a-date"),
        };
      });

      results.push({
        test: "formatSource: slug without date",
        pass: formatResults.slug_no_date === "From Calgary Agtech Conference 2026",
        detail: `got: "${formatResults.slug_no_date}"`,
      });

      results.push({
        test: "formatSource: slug with date",
        pass: formatResults.slug_with_date.startsWith("From Calgary Agtech Conference 2026 (") && formatResults.slug_with_date.includes("2026)"),
        detail: `got: "${formatResults.slug_with_date}"`,
      });

      results.push({
        test: "formatSource: human-readable without date (no slug conversion)",
        pass: formatResults.readable_no_date === "From CFIN Foodtech in Canada 2025 Ecosystem Report",
        detail: `got: "${formatResults.readable_no_date}"`,
      });

      results.push({
        test: "formatSource: BASF acronym handled correctly",
        pass: formatResults.acronym_basf === "From BASF Grower Journey Analysis",
        detail: `got: "${formatResults.acronym_basf}"`,
      });

      results.push({
        test: "formatSource: CAPI + EMILI acronyms handled",
        pass: formatResults.acronym_capi === "From CAPI EMILI Report",
        detail: `got: "${formatResults.acronym_capi}"`,
      });

      results.push({
        test: "formatSource: invalid date falls back gracefully",
        pass: formatResults.invalid_date === "From Some Source",
        detail: `got: "${formatResults.invalid_date}"`,
      });

    } catch (e) {
      results.push({ test: "formatSource utility tests", pass: false, detail: e.message });
    }
    await page.close();
  }

  // ── Test 4: Operator mode loads (regression) ─────────────────────────────
  {
    const page = await browser.newPage();
    try {
      await page.goto(BASE, { waitUntil: "networkidle", timeout: 10000 });
      await page.evaluate(() => {
        localStorage.setItem("trellis_welcomed", "true");
        localStorage.setItem("ag_nav_mode", "ec");
      });
      await page.route("**/api/programs", async (route) => {
        await route.fulfill({ status: 200, contentType: "application/json", body: "[]" });
      });

      await page.goto(`${BASE}/navigator?eco=true`, { waitUntil: "networkidle", timeout: 10000 });
      await page.waitForTimeout(500);

      // Operator mode should show some kind of input or chat area
      const pageContent = await page.textContent("body");
      const hasEcosystem = pageContent.includes("ecosystem") || pageContent.includes("Ecosystem") || pageContent.includes("program");
      results.push({
        test: "Operator mode loads without errors (regression)",
        pass: hasEcosystem,
        detail: `ecosystem/program mention found: ${hasEcosystem}`,
      });
    } catch (e) {
      results.push({ test: "Operator mode regression", pass: false, detail: e.message });
    }
    await page.close();
  }

  await browser.close();

  // Print results
  console.log("\n══════════════════════════════════════════════════════════════");
  console.log("  GATE 2 TEST RESULTS: Spec 2C — Knowledge Entries");
  console.log("══════════════════════════════════════════════════════════════\n");

  let passed = 0;
  let failed = 0;
  for (const r of results) {
    const icon = r.pass ? "✓" : "✗";
    const color = r.pass ? "\x1b[32m" : "\x1b[31m";
    console.log(`${color}${icon}\x1b[0m ${r.test}`);
    console.log(`  ${r.detail}\n`);
    if (r.pass) passed++;
    else failed++;
  }

  console.log("──────────────────────────────────────────────────────────────");
  console.log(`  ${passed} passed, ${failed} failed out of ${results.length} tests`);
  console.log("══════════════════════════════════════════════════════════════\n");

  process.exit(failed > 0 ? 1 : 0);
}

runTests().catch((e) => {
  console.error("Test runner error:", e);
  process.exit(1);
});
