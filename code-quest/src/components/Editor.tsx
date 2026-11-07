import { useEffect, useRef } from 'react';
import { EditorView, basicSetup } from 'codemirror';
import { EditorState, Compartment } from '@codemirror/state';
import { keymap, Decoration } from '@codemirror/view';
import { indentWithTab } from '@codemirror/commands';
import { python } from '@codemirror/lang-python';
import { javascript } from '@codemirror/lang-javascript';
import { sql } from '@codemirror/lang-sql';
import { html } from '@codemirror/lang-html';
import { oneDark } from '@codemirror/theme-one-dark';
import type { Lang } from '../engine/types';

function langExt(lang: Lang) {
  if (lang === 'python') return python();
  if (lang === 'sql') return sql();
  if (lang === 'html') return html();
  return javascript();
}

interface Props {
  value: string;
  lang: Lang;
  onChange?: (v: string) => void;
  onRun?: () => void;
  readOnly?: boolean;
  errorLine?: number;
  ariaLabel?: string;
  minimal?: boolean;
}

const errorTheme = EditorView.baseTheme({
  '.cm-errorLine': { backgroundColor: 'rgba(248,113,113,0.18)' },
});

export function Editor({ value, lang, onChange, onRun, readOnly, errorLine, ariaLabel, minimal }: Props) {
  const host = useRef<HTMLDivElement>(null);
  const view = useRef<EditorView | null>(null);
  const langComp = useRef(new Compartment());
  const lineComp = useRef(new Compartment());
  const cb = useRef({ onChange, onRun });
  cb.current = { onChange, onRun };

  useEffect(() => {
    const state = EditorState.create({
      doc: value,
      extensions: [
        basicSetup,
        keymap.of([
          { key: 'Mod-Enter', run: () => (cb.current.onRun?.(), true) },
          { key: 'Shift-Enter', run: () => (cb.current.onRun?.(), true) },
          indentWithTab,
        ]),
        EditorState.tabSize.of(4),
        langComp.current.of(langExt(lang)),
        lineComp.current.of([]),
        oneDark,
        errorTheme,
        EditorView.editable.of(!readOnly),
        EditorState.readOnly.of(!!readOnly),
        EditorView.contentAttributes.of({ 'aria-label': ariaLabel ?? `${lang} code editor` }),
        EditorView.updateListener.of((u) => {
          if (u.docChanged) cb.current.onChange?.(u.state.doc.toString());
        }),
        EditorView.theme({
          '&': { height: '100%', fontSize: minimal ? '13px' : '14px' },
          '.cm-scroller': { fontFamily: 'var(--mono)', overflow: 'auto' },
        }),
      ],
    });
    view.current = new EditorView({ state, parent: host.current! });
    // Handle for automated UI tests (tests/e2e) to set editor text.
    (host.current as unknown as { __cmView?: EditorView }).__cmView = view.current;
    return () => view.current?.destroy();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [readOnly]);

  // External value changes (reset, show solution).
  useEffect(() => {
    const v = view.current;
    if (v && v.state.doc.toString() !== value) {
      v.dispatch({ changes: { from: 0, to: v.state.doc.length, insert: value } });
    }
  }, [value]);

  useEffect(() => {
    view.current?.dispatch({ effects: langComp.current.reconfigure(langExt(lang)) });
  }, [lang]);

  useEffect(() => {
    const v = view.current;
    if (!v) return;
    if (errorLine && errorLine <= v.state.doc.lines) {
      const line = v.state.doc.line(errorLine);
      v.dispatch({
        effects: lineComp.current.reconfigure(EditorView.decorations.of(Decoration.set([errDeco.range(line.from)]))),
      });
    } else {
      v.dispatch({ effects: lineComp.current.reconfigure([]) });
    }
  }, [errorLine, value]);

  return <div className="editor" ref={host} />;
}

const errDeco = Decoration.line({ class: 'cm-errorLine' });
