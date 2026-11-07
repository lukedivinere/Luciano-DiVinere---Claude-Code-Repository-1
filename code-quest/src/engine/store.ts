// The single progress store. Saved to localStorage on every change.
import { create } from 'zustand';
import { WORLDS } from '../content/registry';
import { newlyEarned, type Achievement } from './achievements';
import { dayKey } from './dates';
import { levelProgress } from './xp';
import { emptyProgress, levelComplete, migrate, totalXp, type ItemRecord, type ProgressData } from './progress';
import { rankFor } from './ranks';
import { answered, missed } from './srs';
import { exerciseXp, XP } from './xp';
import type { Exercise, Level, QuizQuestion } from './types';

export const STORAGE_KEY = 'code-quest-progress';

function load(): ProgressData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? migrate(JSON.parse(raw)) : emptyProgress();
  } catch {
    return emptyProgress();
  }
}

function save(p: ProgressData) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(p));
  } catch {
    /* storage full or blocked: progress stays in memory for this session */
  }
}

// ---------- celebration / notification events (not persisted) ----------
export type GameEvent =
  | { id: number; type: 'xp'; amount: number; reason: string }
  | { id: number; type: 'levelup'; level: number }
  | { id: number; type: 'rank'; name: string; icon: string }
  | { id: number; type: 'achievement'; a: Pick<Achievement, 'name' | 'icon' | 'description'> }
  | { id: number; type: 'boss'; title: string };

type NewEvent = GameEvent extends infer E ? (E extends GameEvent ? Omit<E, 'id'> : never) : never;

interface EventState {
  events: GameEvent[];
  push: (e: NewEvent) => void;
  dismiss: (id: number) => void;
}
let evSeq = 0;
export const useEvents = create<EventState>((set) => ({
  events: [],
  push: (e) => set((s) => ({ events: [...s.events, { ...e, id: ++evSeq } as GameEvent] })),
  dismiss: (id) => set((s) => ({ events: s.events.filter((x) => x.id !== id) })),
}));

// ---------- progress store ----------
interface Store {
  p: ProgressData;
  completeLearn: (id: string, level: Level) => void;
  submitExercise: (ex: Exercise, level: Level, passed: boolean) => number;
  revealHint: (exId: string, tier: number) => void;
  completeQuiz: (level: Level, results: { q: QuizQuestion; correct: boolean }[]) => number;
  answerReview: (q: QuizQuestion, correct: boolean) => void;
  saveCode: (key: string, code: string) => void;
  tick: (sec: number) => void;
  setSetting: <K extends keyof ProgressData['settings']>(k: K, v: ProgressData['settings'][K]) => void;
  reset: () => void;
  importData: (json: string) => boolean;
}

function rec(p: ProgressData, id: string): ItemRecord {
  return p.items[id] ?? { done: false, xp: 0, attempts: 0, hintsUsed: 0 };
}

/** Apply a change, award XP, then emit level-up/rank/achievement/boss events. */
function commit(prev: ProgressData, next: ProgressData, level?: Level): ProgressData {
  const ev = useEvents.getState();
  // Boss bonus when a boss level becomes complete.
  if (level?.kind === 'boss' && !levelComplete(prev, level) && levelComplete(next, level)) {
    next = { ...next, xpLog: [...next.xpLog, { t: Date.now(), xp: XP.bossComplete, reason: `boss:${level.id}` }] };
    ev.push({ type: 'boss', title: level.title });
  }
  const before = totalXp(prev);
  const after = totalXp(next);
  if (after > before) {
    next = { ...next, activeDays: next.activeDays.includes(dayKey()) ? next.activeDays : [...next.activeDays, dayKey()] };
    const lb = levelProgress(before).level;
    const la = levelProgress(after).level;
    if (la > lb) ev.push({ type: 'levelup', level: la });
    const rb = rankFor(before).rank;
    const ra = rankFor(after).rank;
    if (ra.name !== rb.name) ev.push({ type: 'rank', name: ra.name, icon: ra.icon });
  }
  const earned = newlyEarned(next, WORLDS);
  if (earned.length) {
    const ach = { ...next.achievements };
    for (const a of earned) {
      ach[a.id] = Date.now();
      ev.push({ type: 'achievement', a: { name: a.name, icon: a.icon, description: a.description } });
    }
    next = { ...next, achievements: ach };
  }
  return next;
}

export const useProgress = create<Store>((set, get) => ({
  p: load(),

  completeLearn: (id, level) => {
    const prev = get().p;
    if (rec(prev, id).done) return;
    const next: ProgressData = {
      ...prev,
      items: { ...prev.items, [id]: { ...rec(prev, id), done: true, completedAt: Date.now(), xp: XP.learn } },
      xpLog: [...prev.xpLog, { t: Date.now(), xp: XP.learn, reason: 'learn' }],
    };
    useEvents.getState().push({ type: 'xp', amount: XP.learn, reason: 'Lesson read' });
    set({ p: commit(prev, next, level) });
  },

  submitExercise: (ex, level, passed) => {
    const prev = get().p;
    const r = rec(prev, ex.id);
    const attempts = r.attempts + 1;
    if (r.done || !passed) {
      set({ p: { ...prev, items: { ...prev.items, [ex.id]: { ...r, attempts } } } });
      return 0;
    }
    const firstTry = attempts === 1;
    const xp = exerciseXp(ex.type, r.hintsUsed, firstTry);
    const next: ProgressData = {
      ...prev,
      items: { ...prev.items, [ex.id]: { ...r, attempts, done: true, completedAt: Date.now(), xp, firstTry } },
      xpLog: [...prev.xpLog, { t: Date.now(), xp, reason: ex.type }],
    };
    const bonus = [firstTry ? 'first try' : '', r.hintsUsed === 0 ? 'no hints' : ''].filter(Boolean).join(' + ');
    useEvents.getState().push({ type: 'xp', amount: xp, reason: bonus ? `Passed! (${bonus} bonus)` : 'Passed!' });
    set({ p: commit(prev, next, level) });
    return xp;
  },

  revealHint: (exId, tier) => {
    const prev = get().p;
    const r = rec(prev, exId);
    if (r.done || r.hintsUsed >= tier) return;
    set({ p: { ...prev, items: { ...prev.items, [exId]: { ...r, hintsUsed: tier } } } });
  },

  completeQuiz: (level, results) => {
    const prev = get().p;
    const id = `${level.id}.quiz`;
    const r = rec(prev, id);
    const correct = results.filter((x) => x.correct).length;
    const now = Date.now();
    const srs = { ...prev.srs };
    for (const { q, correct: ok } of results) if (!ok) srs[q.id] = missed(srs[q.id], q.concept, now);
    const xp = r.done ? 0 : correct * XP.quizPerCorrect;
    const next: ProgressData = {
      ...prev,
      srs,
      quizStats: { answered: prev.quizStats.answered + results.length, correct: prev.quizStats.correct + correct },
      items: {
        ...prev.items,
        [id]: { ...r, done: true, completedAt: r.completedAt ?? now, xp: r.xp + xp, attempts: r.attempts + 1, bestQuiz: r.done ? r.bestQuiz : correct },
      },
      xpLog: xp ? [...prev.xpLog, { t: now, xp, reason: 'quiz' }] : prev.xpLog,
    };
    if (xp) useEvents.getState().push({ type: 'xp', amount: xp, reason: `Quiz: ${correct}/${results.length}` });
    set({ p: commit(prev, next, level) });
    return xp;
  },

  answerReview: (q, correct) => {
    const prev = get().p;
    const card = prev.srs[q.id] ?? missed(undefined, q.concept, Date.now());
    const next: ProgressData = {
      ...prev,
      srs: { ...prev.srs, [q.id]: answered(card, correct, Date.now()) },
      quizStats: { answered: prev.quizStats.answered + 1, correct: prev.quizStats.correct + (correct ? 1 : 0) },
      xpLog: correct ? [...prev.xpLog, { t: Date.now(), xp: XP.review, reason: 'review' }] : prev.xpLog,
    };
    if (correct) useEvents.getState().push({ type: 'xp', amount: XP.review, reason: 'Review' });
    set({ p: commit(prev, next) });
  },

  saveCode: (key, code) => {
    const prev = get().p;
    if (prev.code[key] === code) return;
    set({ p: { ...prev, code: { ...prev.code, [key]: code } } });
  },

  tick: (sec) => {
    const prev = get().p;
    const k = dayKey();
    set({
      p: {
        ...prev,
        time: { totalSec: prev.time.totalSec + sec, byDay: { ...prev.time.byDay, [k]: (prev.time.byDay[k] ?? 0) + sec } },
      },
    });
  },

  setSetting: (k, v) => {
    const prev = get().p;
    set({ p: { ...prev, settings: { ...prev.settings, [k]: v } } });
  },

  reset: () => set({ p: emptyProgress() }),

  importData: (json) => {
    try {
      set({ p: migrate(JSON.parse(json)) });
      return true;
    } catch {
      return false;
    }
  },
}));

let saveTimer: ReturnType<typeof setTimeout> | undefined;
useProgress.subscribe((s) => {
  clearTimeout(saveTimer);
  saveTimer = setTimeout(() => save(s.p), 250);
});
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', () => save(useProgress.getState().p));
}
