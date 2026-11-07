// Runs learner JavaScript against an HTML page inside a sandboxed iframe
// (scripts allowed, but no access to the app, its storage, or the network origin).
import type { RunError, Test } from '../engine/types';
import { buildDomDoc, type DomPayload } from './harness/domHarness';

let previewMount: HTMLElement | null = null;

/** The output panel registers where the live page preview should appear. */
export function setPreviewMount(el: HTMLElement | null) {
  previewMount = el;
}

export function runDom(
  html: string,
  code: string,
  tests: Test[] | null,
  timeoutMs: number,
): Promise<DomPayload & { error?: RunError | null }> {
  const { doc, codeLine } = buildDomDoc(html, code, tests);
  const iframe = document.createElement('iframe');
  iframe.setAttribute('sandbox', 'allow-scripts allow-modals');
  iframe.title = 'Page preview';
  iframe.className = 'dom-preview';
  const visible = !tests && previewMount;
  if (visible) {
    previewMount!.replaceChildren(iframe);
  } else {
    iframe.style.cssText = 'position:absolute;width:400px;height:300px;left:-9999px;top:0;';
    document.body.appendChild(iframe);
  }
  return new Promise((resolve) => {
    const cleanup = () => {
      window.removeEventListener('message', onMsg);
      clearTimeout(timer);
      if (!visible) iframe.remove();
    };
    const onMsg = (ev: MessageEvent) => {
      if (ev.source !== iframe.contentWindow || !ev.data?.__cq) return;
      cleanup();
      const p = ev.data.payload as DomPayload;
      if (p.error?.line) {
        const l = p.error.line - codeLine + 1;
        p.error.line = l > 0 ? l : undefined;
      }
      resolve(p);
    };
    const timer = setTimeout(() => {
      cleanup();
      iframe.remove();
      resolve({
        logs: [],
        error: { type: 'Timeout', message: 'The page script ran too long and was stopped.' },
      });
    }, timeoutMs);
    window.addEventListener('message', onMsg);
    iframe.srcdoc = doc;
  });
}
