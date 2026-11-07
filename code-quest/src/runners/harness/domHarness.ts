// Builds a self-contained HTML document that runs learner JavaScript against a
// page, then (optionally) runs DOM checks and reports results.
// In the app it runs inside a sandboxed iframe (dom-sandbox.ts); in the
// validator it runs inside jsdom. Results are delivered through
// window.__cqReport(payload), which each host defines.
import type { Test } from '../../engine/types';

export interface DomPayload {
  logs: string[];
  error?: { type: string; message: string; line?: number };
  results?: { name: string; passed: boolean; got?: string; error?: { type: string; message: string } }[];
}

const PRELUDE = `
window.__cq = { logs: [], error: null };
if (!window.__cqReport) window.__cqReport = function(p){ parent.postMessage({ __cq: true, payload: p }, '*'); };
(function(){
  function fmt(v){ if (typeof v === 'string') return v; try { return JSON.stringify(v); } catch(e) { return String(v); } }
  var log = function(){ window.__cq.logs.push(Array.prototype.map.call(arguments, fmt).join(' ')); };
  console.log = log; console.info = log; console.warn = log; console.error = log;
  window.addEventListener('error', function(ev){
    if (!window.__cq.error) window.__cq.error = { type: (ev.error && ev.error.name) || 'Error', message: (ev.error && ev.error.message) || ev.message, line: ev.lineno };
  });
  window.assert = function(c, m){ if(!c){ var e = new Error(m || 'Assertion failed'); e.name = 'AssertionError'; throw e; } };
  window.click = function(sel){ var el = document.querySelector(sel); if(!el) throw new Error('Could not find ' + sel + ' on the page'); el.dispatchEvent(new MouseEvent('click', {bubbles:true})); };
  window.typeInto = function(sel, text){ var el = document.querySelector(sel); if(!el) throw new Error('Could not find ' + sel + ' on the page'); el.value = text; el.dispatchEvent(new Event('input', {bubbles:true})); el.dispatchEvent(new Event('change', {bubbles:true})); };
  window.submitForm = function(sel){ var el = document.querySelector(sel); if(!el) throw new Error('Could not find ' + sel + ' on the page'); el.dispatchEvent(new Event('submit', {bubbles:true, cancelable:true})); };
  window.textOf = function(sel){ var el = document.querySelector(sel); return el ? el.textContent.trim() : null; };
})();
`;

function escapeScript(s: string): string {
  return s.replace(/<\/script/gi, '<\\/script');
}

/** Returns the full HTML doc and the line number where learner code starts. */
export function buildDomDoc(html: string, code: string, tests: Test[] | null): { doc: string; codeLine: number } {
  const checks = (tests ?? []).filter((t) => t.kind === 'check') as Extract<Test, { kind: 'check' }>[];
  const runner = `
(async function(){
  await new Promise(function(r){ setTimeout(r, 20); });
  var payload = { logs: window.__cq.logs, error: window.__cq.error };
  ${
    tests
      ? `payload.results = [];
  var checks = ${JSON.stringify(checks.map((c) => ({ name: c.name, code: c.code })))};
  if (!window.__cq.error) {
    for (var i = 0; i < checks.length; i++) {
      var c = checks[i];
      try {
        var fn = new (Object.getPrototypeOf(async function(){}).constructor)(c.code);
        await fn();
        payload.results.push({ name: c.name, passed: true });
      } catch (e) {
        if (e && e.name === 'AssertionError') payload.results.push({ name: c.name, passed: false, got: e.message });
        else payload.results.push({ name: c.name, passed: false, error: { type: (e && e.name) || 'Error', message: (e && e.message) || String(e) } });
      }
    }
  }`
      : ''
  }
  window.__cqReport(payload);
})();`;
  const head = `<!doctype html><html><head><meta charset="utf-8"><style>body{font-family:system-ui,sans-serif;color:#1d2433;background:#fff;padding:12px;margin:0}button{cursor:pointer}</style><script>${PRELUDE}</script></head><body>\n${html}\n`;
  const before = head + '<script>\n';
  const codeLine = before.split('\n').length;
  const doc = `${before}${escapeScript(code)}\n</script><script>${runner}</script></body></html>`;
  return { doc, codeLine };
}
