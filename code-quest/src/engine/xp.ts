// XP rules. Pure functions — unit-tested in tests/engine/xp.test.ts.
import type { Exercise } from './types';

export const XP = {
  learn: 10,
  practice: 15,
  challenge: 50,
  debug: 50,
  'boss-step': 75,
  quizPerCorrect: 5,
  bossComplete: 150,
  review: 5,
} as const;

/** Fraction of XP lost for the deepest hint tier used (0 = none, 3 = full solution). */
export const HINT_PENALTY = [0, 0.1, 0.25, 0.5] as const;
export const FIRST_TRY_BONUS = 0.25;
export const NO_HINT_BONUS = 0.25;

export function exerciseXp(type: Exercise['type'], hintsUsed: number, firstTry: boolean): number {
  const base = XP[type];
  const h = Math.max(0, Math.min(3, hintsUsed));
  const mult = (1 - HINT_PENALTY[h]) * (1 + (firstTry ? FIRST_TRY_BONUS : 0) + (h === 0 ? NO_HINT_BONUS : 0));
  return Math.round(base * mult);
}

/** Player level: 1 at 0 XP, then each level needs more XP (50·(L-1)²). */
export function playerLevel(xp: number): number {
  return Math.floor(Math.sqrt(Math.max(0, xp) / 50)) + 1;
}
export function xpForLevel(level: number): number {
  return 50 * (level - 1) ** 2;
}
export function levelProgress(xp: number): { level: number; into: number; needed: number; pct: number } {
  const level = playerLevel(xp);
  const lo = xpForLevel(level);
  const hi = xpForLevel(level + 1);
  return { level, into: xp - lo, needed: hi - lo, pct: (xp - lo) / (hi - lo) };
}
