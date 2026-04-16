import { chromium } from 'playwright';

const results = [];
function log(name, pass, detail = '') {
  results.push({ name, pass });
  console.log(`${pass ? '✓' : '✗'} ${name}${detail ? ' - ' + detail : ''}`);
}

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage();

try {
  // 1. Home page
  await page.goto('http://localhost:3001');
  const title = await page.title();
  log('Home page loads', title.includes('Trellis'), title);

  // 2. Home page cards
  const pathwayCard = await page.locator('text=Your pathway, not a directory').isVisible();
  const aiCard = await page.locator('text=Ask it anything').isVisible();
  const gapCard = await page.locator('text=Gaps nobody talks about').isVisible();
  log('Home value prop cards', pathwayCard && aiCard && gapCard);

  // 3. Navigator/Wizard
  await page.goto('http://localhost:3001/navigator');
  await page.waitForTimeout(3000);
  const wizard = await page.locator('text=What are you building').isVisible().catch(() => false);
  log('Wizard loads', wizard);

  // 4. Trust banner
  const trust = await page.locator('text=Your information stays with you').isVisible().catch(() => false);
  log('Trust banner visible', trust);

  // 5. Skip links
  const skipBrowse = await page.locator('text=Browse all programs').isVisible().catch(() => false);
  const skipChat = await page.locator('text=Skip to AI chat').isVisible().catch(() => false);
  log('Skip links visible', skipBrowse && skipChat);

  // 6. Programs API
  const programs = await page.evaluate(() => fetch('/api/programs').then(r => r.json()));
  log('Programs API', Array.isArray(programs) && programs.length > 400, `${programs.length} programs`);

  // 7. BioEnterprise in data
  const bioPrograms = programs.filter(p => p.name.toLowerCase().includes('bioenterprise'));
  log('BioEnterprise in DB', bioPrograms.length >= 3, `${bioPrograms.length} entries`);

  // 8. Operator dashboard
  await page.evaluate(() => localStorage.setItem('ag_nav_mode', 'ec'));
  await page.goto('http://localhost:3001/navigator?eco=true');
  await page.waitForTimeout(3000);
  const dashboard = await page.locator('text=Ecosystem Intelligence').isVisible().catch(() => false);
  log('Operator dashboard', dashboard);

  // 9. Founder tabs (no Gap Map)
  await page.evaluate(() => localStorage.setItem('ag_nav_mode', 'e'));
  await page.goto('http://localhost:3001/navigator');
  await page.waitForTimeout(2000);
  // Dismiss tour if showing
  const gotIt = page.locator('text=Got it');
  if (await gotIt.isVisible().catch(() => false)) await gotIt.click();
  await page.waitForTimeout(500);

  // 10. Pathway API (quick test)
  const pathwayResp = await page.evaluate(() =>
    fetch('/api/pathway', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ stage: 'Idea', provinces: ['ON'], need: 'non-dilutive-capital', description: 'test' })
    }).then(r => r.json())
  );
  log('Pathway API', !!pathwayResp?.pathway, pathwayResp?.pathway?.pathway_title || 'no pathway');

  // 11. Chat API
  const chatResp = await page.evaluate(() =>
    fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages: [{ role: 'user', content: 'What is Bioenterprise Canada?' }], mode: 'ec' })
    }).then(r => r.text()).then(t => t.substring(0, 200))
  );
  log('Chat API', chatResp.length > 50, `${chatResp.length} chars`);

  // 12. Gaps API
  const gapsResp = await page.evaluate(() => fetch('/api/gaps').then(r => r.json()));
  log('Gaps API', !!gapsResp?.matrix, `${gapsResp?.summary?.emptyCells} gaps`);

} catch (e) {
  console.error('TEST CRASH:', e.message);
} finally {
  await browser.close();

  const passed = results.filter(r => r.pass).length;
  const total = results.length;
  console.log(`\n${passed}/${total} tests passed`);
  if (passed < total) {
    console.log('FAILED:', results.filter(r => !r.pass).map(r => r.name).join(', '));
  }
}
