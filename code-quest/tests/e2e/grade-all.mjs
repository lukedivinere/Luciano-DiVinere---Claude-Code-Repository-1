// Grades EVERY exercise's reference solution (and starter) inside real
// Chromium, through the same runners the app uses (Pyodide worker, JS worker,
// sandboxed DOM iframe, sql.js worker).  Run: npm run e2e:grade
// Optional: ONLY=w2. to limit to ids with that prefix.
import { spawn } from 'node:child_process';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { chromium } = require('playwright');

const PORT = 5181;
const server = spawn(process.execPath, ['node_modules/vite/bin/vite.js', '--port', String(PORT), '--strictPort'], { stdio: ['ignore', 'pipe', 'pipe'] });
await new Promise((res, rej) => {
  const t = setTimeout(() => rej(new Error('vite did not start')), 60000);
  server.stdout.on('data', (d) => { if (String(d).includes('Local')) { clearTimeout(t); res(); } });
});
const browser = await chromium.launch();
const page = await browser.newPage();
page.on('pageerror', (e) => console.log('pageerror:', e.message));
await page.goto(`http://localhost:${PORT}/`);
await page.waitForFunction(() => window.__cq);

const only = process.env.ONLY ?? '';
const ids = await page.evaluate((only) => window.__cq.WORLDS.flatMap((w) => w.levels.flatMap((l) => [...l.practice, ...l.challenges])).map((e) => e.id).filter((id) => id.startsWith(only)), only);
let bad = 0;
for (const id of ids) {
  const r = await page.evaluate(async (id) => {
    const ex = window.__cq.WORLDS.flatMap((w) => w.levels.flatMap((l) => [...l.practice, ...l.challenges])).find((e) => e.id === id);
    const sol = await window.__cq.gradeExercise(ex, ex.solution);
    const start = await window.__cq.gradeExercise(ex, ex.starter);
    const why = sol.fatal ? `${sol.fatal.type}: ${sol.fatal.message}` : sol.results.filter((x) => !x.passed).map((x) => `${x.name} (got ${x.got ?? x.error?.message})`).join('; ');
    return { ok: sol.passed && !start.passed, sol: sol.passed, start: start.passed, why };
  }, id);
  if (!r.ok) { bad++; console.log(`✘ ${id}: solution ${r.sol ? 'passes' : 'FAILS'}, starter ${r.start ? 'PASSES' : 'fails'} ${r.why}`); }
}
console.log(`\nGraded ${ids.length} exercises in Chromium: ${ids.length - bad} OK, ${bad} problems.`);
await browser.close();
server.kill();
process.exit(bad ? 1 : 0);
