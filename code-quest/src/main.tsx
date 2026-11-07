import React from 'react';
import ReactDOM from 'react-dom/client';
import { App } from './App';
import './styles/app.css';
import { WORLDS } from './content/registry';
import { gradeExercise } from './runners/runner';

// Dev-only hook used by tests/e2e/grade-all.mjs to grade every solution in a real browser.
if (import.meta.env.DEV) {
  (window as unknown as { __cq: unknown }).__cq = { WORLDS, gradeExercise };
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
