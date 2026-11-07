// End-to-end smoke test in real Chromium (Playwright).
// Starts the Vite dev server, then checks: map loads, a lesson's Python
// example runs, an exercise can be passed through the UI, XP is saved and
// survives a reload, locked worlds stay locked, and every sandbox language runs.
// Run: npm run e2e        (SHOTS=1 to save screenshots to test-results/)
import { spawn } from 'node:child_process';
import { mkdirSync } from 'node:fs';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { chromium } = require('playwright');

const PORT = 5179;
const URL = `http://localhost:${PORT}/`;
const SHOTS = !!process.env.SHOTS;
mkdirSync('test-results', { recursive: true });

const server = spawn(process.execPath, ['node_modules/vite/bin/vite.js', '--port', String(PORT), '--strictPort'], { stdio: ['ignore', 'pipe', 'pipe'] });
await new Promise((resolve, reject) => {
  const t = setTimeout(() => reject(new Error('vite did not start')), 60000);
  server.stdout.on('data', (d) => { if (String(d).includes('Local')) { clearTimeout(t); resolve(); } });
});

let failures = 0;
const step = async (name, fn) => {
  try { await fn(); console.log(`  ✔ ${name}`); }
  catch (e) { failures++; console.log(`  ✘ ${name}\n    ${String(e.message).split('\n').slice(0, 6).join('\n    ')}`); }
};

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1366, height: 768 }, deviceScaleFactor: 1 });
const consoleErrors = [];
page.on('pageerror', (e) => consoleErrors.push(String(e)));
const shot = (n) => SHOTS && page.screenshot({ path: `test-results/${n}.png` });

async function typeInEditor(text, nth = 0) {
  await page.waitForSelector('.editor');
  await page.evaluate(([t, i]) => {
    const host = [...document.querySelectorAll('.editor')].filter((e) => !e.closest('.solution-code, .compare-code'))[i];
    const view = host.__cmView;
    view.dispatch({ changes: { from: 0, to: view.state.doc.length, insert: t } });
  }, [text, nth]);
}

console.log('Code Quest e2e');
await step('world map loads with level nodes and minutes', async () => {
  await page.goto(URL);
  await page.waitForSelector('.path .stop');
  const first = await page.locator('.stop').first().innerText();
  if (!first.includes('Hello, Code')) throw new Error('first level missing: ' + first);
  if (!(await page.locator('.minutes-pill').innerText()).includes('min')) throw new Error('no minutes total');
  await shot('01-map');
});

await step('locked levels and worlds are not clickable', async () => {
  const locked = await page.locator('.stop.locked a').count();
  if (locked !== 0) throw new Error('locked level has a link');
  const tabs = page.locator('.world-tab');
  if ((await tabs.count()) > 1 && !(await tabs.nth(1).getAttribute('class')).includes('locked')) throw new Error('world 2 should be locked');
});

await step('Learn: Python example runs in the browser (Pyodide)', async () => {
  await page.locator('.stop').first().locator('a').click();
  await page.waitForSelector('.learn');
  await page.getByRole('button', { name: '▶ Run' }).click();
  await page.waitForSelector('.stdout', { timeout: 90000 });
  const out = await page.locator('.stdout').innerText();
  if (!out.includes('Hello, world!')) throw new Error('unexpected output: ' + out);
  await shot('02-learn');
});

await step('Learn → +10 XP and saved', async () => {
  await page.getByRole('button', { name: /Got it/ }).click();
  await page.waitForSelector('.toast-xp');
  const saved = await page.evaluate(() => JSON.parse(localStorage.getItem('code-quest-progress') || '{}'));
  await page.waitForTimeout(400);
  const saved2 = await page.evaluate(() => JSON.parse(localStorage.getItem('code-quest-progress') || '{}'));
  const xp = (saved2.xpLog || saved.xpLog || []).reduce((s, e) => s + e.xp, 0);
  if (xp !== 10) throw new Error('expected 10 XP saved, got ' + xp);
});

await step('Python error is explained in plain English', async () => {
  await page.waitForSelector('.learn');
  await typeInEditor('Print("hi")');
  await page.getByRole('button', { name: '▶ Run' }).click();
  await page.waitForSelector('.error-box');
  const t = await page.locator('.error-box').innerText();
  if (!t.includes('Unknown name')) throw new Error('error not translated: ' + t);
});

await step('Exercise: wrong answer shows failing test, right answer passes', async () => {
  await page.getByRole('button', { name: /Got it/ }).click();
  await page.waitForSelector('.exercise');
  await typeInEditor('print("Hello")');
  await page.getByRole('button', { name: /Check answer/ }).click();
  await page.waitForSelector('.tests-summary');
  if (!(await page.locator('.tests-summary').innerText()).includes('0 of 1')) throw new Error('should fail');
  await shot('03-fail');
  await typeInEditor('print("Hello, my name is Robo")');
  await page.getByRole('button', { name: /Check answer/ }).click();
  await page.waitForSelector('.tests-summary.pass');
  await shot('04-pass');
});

await step('Hints reveal in tiers, solution last', async () => {
  await page.getByRole('button', { name: 'Continue →' }).click();
  await page.waitForSelector('.exercise');
  await page.getByRole('button', { name: /Hint 1/ }).click();
  await page.getByRole('button', { name: /Hint 2/ }).click();
  await page.getByRole('button', { name: /Show solution/ }).click();
  await page.waitForSelector('.hint.solution');
});

await step('Infinite loop is stopped with a friendly timeout', async () => {
  await typeInEditor('while True:\n    pass');
  await page.getByRole('button', { name: '▶ Run' }).click();
  await page.waitForSelector('.error-box', { timeout: 30000 });
  const t = await page.locator('.error-box').innerText();
  if (!t.includes('never finished')) throw new Error(t);
  // Python restarts afterwards and works again.
  await typeInEditor('print(1+1)');
  await page.getByRole('button', { name: '▶ Run' }).click();
  await page.waitForSelector('.stdout', { timeout: 90000 });
  if ((await page.locator('.stdout').innerText()).trim() !== '2') throw new Error('python did not recover');
});

await step('XP survives a reload', async () => {
  await page.waitForTimeout(500);
  await page.reload();
  await page.waitForSelector('.xpbar-label');
  const label = await page.locator('.xpbar-label').innerText();
  if (!/\b(2[0-9]|[3-9][0-9])\b XP|[1-9][0-9]{2,} XP/.test(label)) throw new Error('xp label after reload: ' + label);
});

for (const [tab, codeText, expect] of [
  ['🐍 Python', 'print(sum([1, 2, 3]))', '6'],
  ['🟨 JavaScript', 'console.log([1,2,3].map(x => x * 2))', '[ 2, 4, 6 ]'],
  ['🗄️ SQL', 'SELECT COUNT(*) AS n FROM customers;', '5'],
]) {
  await step(`Sandbox runs ${tab}`, async () => {
    await page.goto(URL + '#/sandbox');
    await page.getByRole('button', { name: tab }).click();
    await typeInEditor(codeText);
    await page.getByRole('button', { name: '▶ Run' }).click();
    const sel = tab.includes('SQL') ? '.sql-table' : '.stdout';
    await page.waitForSelector(sel, { timeout: 90000 });
    const got = await page.locator(sel).innerText();
    if (!got.includes(expect)) throw new Error(`expected ${expect}, got ${got}`);
  });
}

await step('Sandbox web page runs JS against the DOM', async () => {
  await page.goto(URL + '#/sandbox');
  await page.getByRole('button', { name: '🌐 Web page' }).click();
  await page.getByRole('button', { name: '▶ Run' }).click();
  const frame = page.frameLocator('.dom-preview');
  await frame.locator('#btn').click();
  const msg = await frame.locator('#msg').innerText();
  if (!msg.includes('Clicked 1')) throw new Error(msg);
  await shot('05-sandbox-web');
});

await step('Other screens render', async () => {
  for (const r of ['review', 'achievements', 'dashboard', 'settings']) {
    await page.goto(URL + '#/' + r);
    await page.waitForSelector('h1');
    if (SHOTS) await shot('06-' + r);
  }
});

await step('No uncaught page errors', async () => {
  if (consoleErrors.length) throw new Error(consoleErrors.join('\n'));
});

await browser.close();
server.kill();
console.log(failures ? `\n❌ ${failures} e2e step(s) failed` : '\n✅ e2e passed');
process.exit(failures ? 1 : 0);
