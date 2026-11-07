// Copies the Pyodide runtime and the sql.js WASM file into public/ so the app
// runs fully offline after `npm install`.
import { cpSync, mkdirSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const nm = join(root, 'node_modules');
const pub = join(root, 'public');

const pyFiles = ['pyodide.mjs', 'pyodide.js', 'pyodide.asm.js', 'pyodide.asm.wasm', 'python_stdlib.zip', 'pyodide-lock.json'];
mkdirSync(join(pub, 'pyodide'), { recursive: true });
for (const f of pyFiles) {
  const src = join(nm, 'pyodide', f);
  if (!existsSync(src)) { console.warn(`[copy-assets] missing ${src}`); continue; }
  cpSync(src, join(pub, 'pyodide', f));
}
mkdirSync(join(pub, 'sqljs'), { recursive: true });
cpSync(join(nm, 'sql.js', 'dist', 'sql-wasm.wasm'), join(pub, 'sqljs', 'sql-wasm.wasm'));
console.log('[copy-assets] Pyodide + sql.js copied to public/');
