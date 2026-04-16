/**
 * Gate 2 functional test: Part B date/conference features
 * Run with: node test-gate2.mjs
 */
import { chromium } from "playwright";

const BASE = "http://localhost:3000";

async function run() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const page = await context.newPage();

  // Collect console errors
  const consoleErrors = [];
  page.on("console", msg => {
    if (msg.type() === "error") consoleErrors.push(msg.text());
  });
  page.on("pageerror", err => consoleErrors.push(err.message));

  // Navigate directly to Browse Programs via query param
  console.log("--- Test 1: Open Browse Programs panel ---");
  await page.goto(BASE + "/navigator?browse=true", { waitUntil: "networkidle" });
  await page.waitForTimeout(2000);
  await page.screenshot({ path: "/tmp/gate2-01-browse.png", fullPage: false });
  console.log("Screenshot saved: /tmp/gate2-01-browse.png");

  // Check for DateFilter dropdown
  console.log("\n--- Test 2: DateFilter dropdown ---");
  const dateSelect = page.locator("select").filter({ hasText: "All Dates" });
  const dateVisible = await dateSelect.isVisible();
  console.log("DateFilter dropdown visible:", dateVisible);

  // Check for Sort dropdown
  const sortSelect = page.locator("select").filter({ hasText: "Sort: Default" });
  const sortVisible = await sortSelect.isVisible();
  console.log("Sort dropdown visible:", sortVisible);

  // Check existing filter dropdowns still work
  const catSelect = page.locator("select").filter({ hasText: "All Types" });
  console.log("Category filter visible:", await catSelect.isVisible());
  const stageSelect = page.locator("select").filter({ hasText: "All Stages" });
  console.log("Stage filter visible:", await stageSelect.isVisible());
  const provSelect = page.locator("select").filter({ hasText: "All Provinces" });
  console.log("Province filter visible:", await provSelect.isVisible());

  // Check for date badges
  console.log("\n--- Test 3: Date badges on program cards ---");
  const soonBadges = page.locator("span").filter({ hasText: /Happening soon|Happening today/ });
  const daysBadges = page.locator("span").filter({ hasText: /In \d+ days?/ });
  const deadlineBadges = page.locator("span").filter({ hasText: /Deadline/ });
  const soonCount = await soonBadges.count();
  const daysCount = await daysBadges.count();
  const deadlineCount = await deadlineBadges.count();
  console.log("'Happening soon' badges:", soonCount);
  console.log("'In X days' badges:", daysCount);
  console.log("'Deadline' badges:", deadlineCount);
  const totalBadges = soonCount + daysCount + deadlineCount;
  if (totalBadges > 0) {
    const allBadges = page.locator("span").filter({ hasText: /Happening|In \d+ days?|Deadline/ });
    for (let i = 0; i < Math.min(await allBadges.count(), 8); i++) {
      console.log("  Badge text:", await allBadges.nth(i).textContent());
    }
  }

  // Test: Apply "Next 3 months" date filter
  console.log("\n--- Test 4: Apply 'Next 3 months' filter ---");
  if (dateVisible) {
    // Get count before filter
    const countBefore = page.locator(".text-text-tertiary").filter({ hasText: /of \d+/ }).first();
    const countTextBefore = await countBefore.textContent();
    console.log("Count before filter:", countTextBefore?.trim());

    await dateSelect.selectOption("next_3_months");
    await page.waitForTimeout(500);

    const countTextAfter = await countBefore.textContent();
    console.log("Count after 'Next 3 months':", countTextAfter?.trim());
    await page.screenshot({ path: "/tmp/gate2-02-filtered.png", fullPage: false });
    console.log("Screenshot saved: /tmp/gate2-02-filtered.png");

    // Reset
    await dateSelect.selectOption("all");
    await page.waitForTimeout(300);
  }

  // Test: Sort by upcoming dates
  console.log("\n--- Test 5: Sort by upcoming dates ---");
  if (sortVisible) {
    await sortSelect.selectOption("upcoming");
    await page.waitForTimeout(500);
    await page.screenshot({ path: "/tmp/gate2-03-sorted.png", fullPage: false });
    console.log("Screenshot saved: /tmp/gate2-03-sorted.png");

    // Get first 3 visible program names
    const programNames = page.locator(".font-medium.text-\\[0\\.94rem\\]");
    const nameCount = await programNames.count();
    console.log("First programs after sort:");
    for (let i = 0; i < Math.min(nameCount, 5); i++) {
      const name = await programNames.nth(i).textContent();
      console.log(`  ${i + 1}. ${name?.trim()}`);
    }

    // Reset
    await sortSelect.selectOption("default");
    await page.waitForTimeout(300);
  }

  // Test: Custom date range inputs
  console.log("\n--- Test 6: Custom date range picker ---");
  if (dateVisible) {
    await dateSelect.selectOption("custom");
    await page.waitForTimeout(300);
    const dateInputs = page.locator("input[type='date']");
    const inputCount = await dateInputs.count();
    console.log("Date range inputs visible:", inputCount);
    if (inputCount >= 2) {
      await dateInputs.first().fill("2026-05-01");
      await dateInputs.nth(1).fill("2026-07-31");
      await page.waitForTimeout(500);
      const countText = await page.locator(".text-text-tertiary").filter({ hasText: /of \d+/ }).first().textContent();
      console.log("Count after custom range (May-Jul 2026):", countText?.trim());
      await page.screenshot({ path: "/tmp/gate2-04-custom.png", fullPage: false });
      console.log("Screenshot saved: /tmp/gate2-04-custom.png");
    }
  }

  // Test: Operator flow still renders
  console.log("\n--- Test 7: Operator flow verification ---");
  await page.goto(BASE + "/navigator?eco=true", { waitUntil: "networkidle" });
  await page.waitForTimeout(2000);
  await page.screenshot({ path: "/tmp/gate2-05-operator.png", fullPage: false });
  console.log("Screenshot saved: /tmp/gate2-05-operator.png");
  const ecoHeader = page.locator("text=Ecosystem Intelligence").first();
  console.log("Operator 'Ecosystem Intelligence' heading visible:", await ecoHeader.isVisible());

  // Console errors report
  console.log("\n--- Console Errors ---");
  if (consoleErrors.length === 0) {
    console.log("PASS: No console errors");
  } else {
    console.log(`FAIL: ${consoleErrors.length} console error(s):`);
    consoleErrors.forEach(e => console.log("  ERROR:", e));
  }

  await browser.close();
  console.log("\n--- Gate 2 Test Complete ---");
}

run().catch(e => { console.error("Test failed:", e.message); process.exit(1); });
