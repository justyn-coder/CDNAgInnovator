/**
 * Gate 2 Playwright tests for Spec 2A: Save My Journey
 */

import { chromium } from "playwright";

const BASE = "http://localhost:3000";
const TIMEOUT = 90000;
// Token from a test journey we saved via curl earlier
const KNOWN_TOKEN = "41091e28-ddcb-4cb4-a2bd-6e009ebf70bd";

function log(label, msg) {
  console.log(`[${label}] ${msg}`);
}

async function runWizard(page, { stage, province, need }) {
  // Step 1: Description
  await page.locator("textarea").first().fill("I'm building a soil sensor for precision agriculture");
  await page.locator("button").filter({ hasText: /Next/ }).first().click();
  await page.waitForTimeout(500);

  // Step 2: Stage (auto-advances after click)
  await page.locator("button").filter({ hasText: stage }).first().click();
  await page.waitForTimeout(800);

  // Step 3: Province
  await page.locator("button").filter({ hasText: province }).first().click();
  await page.waitForTimeout(200);
  await page.locator("button").filter({ hasText: /Next/ }).first().click();
  await page.waitForTimeout(500);

  // Step 3B: Sector (auto-advances after click)
  await page.locator("button").filter({ hasText: "Crops" }).first().click();
  await page.waitForTimeout(800);

  // Step 4: Need (must click, then click "Generate my pathway")
  await page.locator("button").filter({ hasText: need }).first().click();
  await page.waitForTimeout(300);
  await page.locator("button").filter({ hasText: /Generate my pathway/ }).click();

  // Wait for pathway to render
  await page.waitForSelector("text=Your Innovation Pathway", { timeout: TIMEOUT });
}

async function test1_saveCardAppears(browser) {
  log("TEST 1", "Save card appears after pathway generation");
  const page = await browser.newPage();
  try {
    await page.goto(`${BASE}/navigator`, { waitUntil: "networkidle" });
    await runWizard(page, { stage: "MVP", province: "Alberta", need: "Money to build" });

    const saveCard = page.locator("text=Save your pathway");
    const visible = await saveCard.isVisible({ timeout: 10000 }).catch(() => false);

    log("TEST 1", visible ? "PASS" : "FAIL");
    if (!visible) await page.screenshot({ path: "/tmp/test1-debug.png" });
    return { pass: visible, reason: visible ? undefined : "Save card not visible" };
  } catch (e) {
    await page.screenshot({ path: "/tmp/test1-error.png" }).catch(() => {});
    log("TEST 1", `FAIL - ${e.message.substring(0, 100)}`);
    return { pass: false, reason: e.message.substring(0, 100) };
  } finally {
    await page.close();
  }
}

async function test2_saveFlow(browser) {
  log("TEST 2", "Save flow: email, submit, success state");
  const page = await browser.newPage();
  try {
    await page.goto(`${BASE}/navigator`, { waitUntil: "networkidle" });
    await runWizard(page, { stage: "MVP", province: "Alberta", need: "Money to build" });

    await page.waitForSelector("text=Save your pathway", { timeout: 10000 });

    // Fill email
    await page.locator('input[type="email"]').last().fill("playwright-gate2@example.com");
    // Fill name
    const nameInput = page.locator('input[placeholder*="name" i]').last();
    if (await nameInput.isVisible().catch(() => false)) {
      await nameInput.fill("Playwright Test");
    }
    // Click Save
    await page.locator("button").filter({ hasText: /^Save$/ }).last().click();

    // Wait for success
    const success = await page.locator("text=Your pathway is saved").isVisible({ timeout: 15000 }).catch(() => false);
    // Or update message (if email was already used)
    const updated = await page.locator("text=Your pathway has been updated").isVisible({ timeout: 2000 }).catch(() => false);

    const pass = success || updated;
    log("TEST 2", pass ? `PASS (${success ? "new save" : "update"})` : "FAIL");
    if (!pass) await page.screenshot({ path: "/tmp/test2-debug.png" });
    return { pass, reason: pass ? undefined : "No success/update state" };
  } catch (e) {
    await page.screenshot({ path: "/tmp/test2-error.png" }).catch(() => {});
    log("TEST 2", `FAIL - ${e.message.substring(0, 100)}`);
    return { pass: false, reason: e.message.substring(0, 100) };
  } finally {
    await page.close();
  }
}

async function test3_restoreFlow(browser) {
  log("TEST 3", "Restore: navigate to saved journey URL");
  const page = await browser.newPage();
  try {
    await page.goto(`${BASE}/navigator?journey=${KNOWN_TOKEN}`, { waitUntil: "networkidle" });
    await page.waitForTimeout(5000);

    const hasWelcome = await page.locator("text=Welcome back").isVisible().catch(() => false);
    const hasPathway = await page.locator("text=Your Innovation Pathway").isVisible().catch(() => false);
    // The saved test data had minimal pathway data, so check for any step content too
    const hasSteps = await page.locator("text=RDAR").isVisible().catch(() => false);

    const pass = hasWelcome || hasPathway || hasSteps;
    log("TEST 3", pass ? `PASS (welcome: ${hasWelcome}, pathway: ${hasPathway}, steps: ${hasSteps})` : "FAIL");
    if (!pass) {
      await page.screenshot({ path: "/tmp/test3-debug.png" });
      const text = await page.locator("body").innerText().catch(() => "");
      log("TEST 3", `Page text: ${text.substring(0, 300)}`);
    }
    return { pass, reason: pass ? undefined : "No restore UI visible" };
  } catch (e) {
    log("TEST 3", `FAIL - ${e.message.substring(0, 100)}`);
    return { pass: false, reason: e.message.substring(0, 100) };
  } finally {
    await page.close();
  }
}

async function test4_invalidToken(browser) {
  log("TEST 4", "Invalid token shows error");
  const page = await browser.newPage();
  try {
    await page.goto(`${BASE}/navigator?journey=00000000-0000-0000-0000-000000000000`, { waitUntil: "networkidle" });

    const errorMsg = await page.locator("text=This link is no longer valid").isVisible({ timeout: 10000 }).catch(() => false);
    const startBtn = await page.locator("button").filter({ hasText: /Start a new pathway/i }).isVisible({ timeout: 3000 }).catch(() => false);

    log("TEST 4", errorMsg ? `PASS (start button: ${startBtn})` : "FAIL");
    return { pass: errorMsg, reason: errorMsg ? undefined : "No error message" };
  } catch (e) {
    log("TEST 4", `FAIL - ${e.message.substring(0, 100)}`);
    return { pass: false, reason: e.message.substring(0, 100) };
  } finally {
    await page.close();
  }
}

async function test5_flokk(browser) {
  log("TEST 5", "Flokk: Alberta, Idea, full pathway + save card");
  const page = await browser.newPage();
  try {
    await page.goto(`${BASE}/navigator`, { waitUntil: "networkidle" });
    await runWizard(page, { stage: "Idea", province: "Alberta", need: "Money to build" });

    const pathway = await page.locator("text=Your Innovation Pathway").isVisible({ timeout: 5000 }).catch(() => false);
    const saveCard = await page.locator("text=Save your pathway").isVisible({ timeout: 5000 }).catch(() => false);

    const pass = pathway && saveCard;
    log("TEST 5", pass ? "PASS" : `FAIL (pathway: ${pathway}, save: ${saveCard})`);
    return { pass, reason: pass ? undefined : `pathway: ${pathway}, save: ${saveCard}` };
  } catch (e) {
    await page.screenshot({ path: "/tmp/test5-error.png" }).catch(() => {});
    log("TEST 5", `FAIL - ${e.message.substring(0, 100)}`);
    return { pass: false, reason: e.message.substring(0, 100) };
  } finally {
    await page.close();
  }
}

async function test6_operatorNotAffected(browser) {
  log("TEST 6", "Operator view: no save card, no interference");
  const page = await browser.newPage();
  try {
    await page.goto(`${BASE}/navigator`, { waitUntil: "networkidle" });
    await page.evaluate(() => localStorage.setItem("ag_nav_mode", "ec"));
    await page.goto(`${BASE}/navigator`, { waitUntil: "networkidle" });

    const eco = await page.locator("text=Ecosystem Intelligence").isVisible({ timeout: 5000 }).catch(() => false);
    const save = await page.locator("text=Save your pathway").isVisible({ timeout: 2000 }).catch(() => false);

    await page.evaluate(() => localStorage.setItem("ag_nav_mode", "e"));

    const pass = eco && !save;
    log("TEST 6", pass ? "PASS" : `FAIL (eco: ${eco}, save visible: ${save})`);
    return { pass, reason: pass ? undefined : `eco: ${eco}, save: ${save}` };
  } catch (e) {
    log("TEST 6", `FAIL - ${e.message.substring(0, 100)}`);
    return { pass: false, reason: e.message.substring(0, 100) };
  } finally {
    await page.close();
  }
}

async function main() {
  const browser = await chromium.launch({ headless: true });
  const results = {};

  try {
    results["1_save_card_appears"] = await test1_saveCardAppears(browser);
    results["2_save_flow"] = await test2_saveFlow(browser);
    results["3_restore_flow"] = await test3_restoreFlow(browser);
    results["4_invalid_token"] = await test4_invalidToken(browser);
    results["5_flokk_scenario"] = await test5_flokk(browser);
    results["6_operator_not_affected"] = await test6_operatorNotAffected(browser);
  } finally {
    await browser.close();
  }

  console.log("\n========================================");
  console.log("  GATE 2 RESULTS: Save My Journey");
  console.log("========================================");
  let allPass = true;
  for (const [name, result] of Object.entries(results)) {
    const icon = result.pass ? "PASS" : "FAIL";
    console.log(`  ${icon}: ${name}${result.reason ? ` -- ${result.reason}` : ""}`);
    if (!result.pass) allPass = false;
  }
  console.log("========================================");
  console.log(`  Overall: ${allPass ? "ALL PASS" : "SOME FAILURES"}`);
  console.log("========================================\n");

  process.exit(allPass ? 0 : 1);
}

main().catch(e => {
  console.error("Test runner error:", e);
  process.exit(1);
});
