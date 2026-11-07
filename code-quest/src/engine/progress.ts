// Progress data model + pure derived queries (unlocks, completion, mastery).
import { levelItems } from './content';
import type { Card } from './srs';
import { MASTERED_BOX } from './srs';
import type { Level, World } from './types';

export interface ItemRecord {
  done: boolean;
  completedAt?: number;
  xp: number;
  attempts: number; // graded submissions
  hintsUsed: number; // deepest hint tier revealed (0-3)
  firstTry?: boolean;
  bestQuiz?: number; // quiz: best number correct
}

export interface ProgressData {
  version: number;
  items: Record<string, ItemRecord>;
  code: Record<string, string>;
  xpLog: { t: number; xp: number; reason: string }[];
  activeDays: string[];
  time: { totalSec: number; byDay: Record<string, number> };
  quizStats: { answered: number; correct: number };
  srs: Record<string, Card>;
  achievements: Record<string, number>;
  settings: { muted: boolean; sandboxLang: string };
}

export const PROGRESS_VERSION = 1;

export function emptyProgress(): ProgressData {
  return {
    version: PROGRESS_VERSION,
    items: {},
    code: {},
    xpLog: [],
    activeDays: [],
    time: { totalSec: 0, byDay: {} },
    quizStats: { answered: 0, correct: 0 },
    srs: {},
    achievements: {},
    settings: { muted: false, sandboxLang: 'python' },
  };
}

/** Upgrade older saves. Unknown/missing fields are filled from defaults so
 *  new content and features never wipe existing progress. */
export function migrate(raw: unknown): ProgressData {
  const base = emptyProgress();
  if (!raw || typeof raw !== 'object') return base;
  const p = raw as Partial<ProgressData>;
  return {
    ...base,
    ...p,
    time: { ...base.time, ...(p.time ?? {}) },
    quizStats: { ...base.quizStats, ...(p.quizStats ?? {}) },
    settings: { ...base.settings, ...(p.settings ?? {}) },
    version: PROGRESS_VERSION,
  };
}

export function totalXp(p: ProgressData): number {
  return p.xpLog.reduce((s, e) => s + e.xp, 0);
}

export const isDone = (p: ProgressData, id: string) => !!p.items[id]?.done;

export function levelComplete(p: ProgressData, level: Level): boolean {
  return levelItems(level).every((i) => isDone(p, i.id));
}

export function levelDoneCount(p: ProgressData, level: Level): { done: number; total: number } {
  const items = levelItems(level);
  return { done: items.filter((i) => isDone(p, i.id)).length, total: items.length };
}

export function worldUnlocked(p: ProgressData, worlds: World[], wi: number): boolean {
  if (wi === 0) return true;
  const prev = worlds[wi - 1];
  const boss = prev.levels.filter((l) => l.kind === 'boss');
  return boss.length > 0 && boss.every((b) => levelComplete(p, b));
}

export function levelUnlocked(p: ProgressData, worlds: World[], wi: number, li: number): boolean {
  if (!worldUnlocked(p, worlds, wi)) return false;
  return li === 0 || levelComplete(p, worlds[wi].levels[li - 1]);
}

export function itemUnlocked(p: ProgressData, level: Level, idx: number): boolean {
  const items = levelItems(level);
  return idx === 0 || isDone(p, items[idx - 1].id);
}

/** Concepts mastered: every level teaching it is complete and no review card
 *  for it is still in a low box. */
export function masteredConcepts(p: ProgressData, worlds: World[]): string[] {
  const teachers = new Map<string, Level[]>();
  for (const w of worlds) for (const l of w.levels) for (const c of l.teaches) teachers.set(c, [...(teachers.get(c) ?? []), l]);
  const weak = new Set(Object.values(p.srs).filter((c) => c.box < MASTERED_BOX).map((c) => c.concept));
  return [...teachers.entries()].filter(([c, ls]) => !weak.has(c) && ls.every((l) => levelComplete(p, l))).map(([c]) => c);
}

export function exerciseAccuracy(p: ProgressData): { firstTry: number; done: number } {
  const recs = Object.values(p.items).filter((r) => r.done && r.attempts > 0);
  return { firstTry: recs.filter((r) => r.firstTry).length, done: recs.length };
}
