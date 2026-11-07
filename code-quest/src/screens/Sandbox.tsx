import { useState } from 'react';
import { useProgress } from '../engine/store';
import { CodeRunner } from '../components/CodeRunner';
import { Editor } from '../components/Editor';
import { SANDBOX_DB } from '../content/sandboxDb';
import type { Lang } from '../engine/types';

const TABS = [
  { id: 'python', label: '🐍 Python', lang: 'python' as Lang, starter: '# Free Code: experiment with anything!\nname = input("What is your name? ")\nprint(f"Hello, {name}!")\n\nfor i in range(3):\n    print("Loop number", i)\n' },
  { id: 'javascript', label: '🟨 JavaScript', lang: 'javascript' as Lang, starter: '// Free Code: experiment with anything!\nconst fruits = ["apple", "banana", "cherry"];\nfor (const f of fruits) {\n  console.log(f.toUpperCase());\n}\n' },
  { id: 'web', label: '🌐 Web page', lang: 'javascript' as Lang, starter: '// This JavaScript runs on the page above.\nconst btn = document.querySelector("#btn");\nlet clicks = 0;\nbtn.addEventListener("click", () => {\n  clicks++;\n  document.querySelector("#msg").textContent = `Clicked ${clicks} times`;\n});\n' },
  { id: 'sql', label: '🗄️ SQL', lang: 'sql' as Lang, starter: '-- Free Code: query the sample shop database.\nSELECT name, city FROM customers ORDER BY name;\n' },
];
const WEB_HTML = '<h1>My page</h1>\n<button id="btn">Click me</button>\n<p id="msg">Not clicked yet.</p>\n';

export function Sandbox() {
  const p = useProgress((s) => s.p);
  const { saveCode, setSetting } = useProgress.getState();
  const [tab, setTab] = useState(TABS.find((t) => t.id === p.settings.sandboxLang) ?? TABS[0]);
  const key = `sandbox:${tab.id}`;
  const code = p.code[key] ?? tab.starter;
  const html = p.code['sandbox:web-html'] ?? WEB_HTML;

  return (
    <div className="sandbox">
      <div className="sandbox-head">
        <h1>🧪 Free Code</h1>
        <div className="tabs">
          {TABS.map((t) => (
            <button
              key={t.id}
              className={t.id === tab.id ? 'on' : ''}
              onClick={() => {
                setTab(t);
                setSetting('sandboxLang', t.id);
              }}
            >
              {t.label}
            </button>
          ))}
        </div>
        <span className="muted small">No tests, no XP — just play. Your code is saved automatically.</span>
      </div>
      {tab.id === 'web' && (
        <details className="html-editor">
          <summary>Edit the page HTML</summary>
          <div className="html-editor-box">
            <Editor value={html} lang="html" onChange={(v) => saveCode('sandbox:web-html', v)} />
          </div>
        </details>
      )}
      {tab.id === 'sql' && (
        <details className="schema">
          <summary>🗄️ Tables: customers, products, orders</summary>
          <pre>{SANDBOX_DB.match(/CREATE TABLE[^;]+;/gi)?.join('\n')}</pre>
        </details>
      )}
      <div className="sandbox-runner">
        <CodeRunner
          key={tab.id}
          lang={tab.lang}
          code={code}
          layout="split"
          onChange={(c) => saveCode(key, c)}
          onReset={() => saveCode(key, tab.starter)}
          dom={tab.id === 'web' ? { html } : undefined}
          sqlSetup={tab.id === 'sql' ? SANDBOX_DB : undefined}
        />
      </div>
    </div>
  );
}
