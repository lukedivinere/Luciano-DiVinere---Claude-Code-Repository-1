import { addDays, dayKey } from './dates';

/** Current streak: consecutive active days ending today (or yesterday, if
 *  today has no activity yet — the streak is still alive until midnight). */
export function currentStreak(activeDays: string[], today: string = dayKey()): number {
  const set = new Set(activeDays);
  let d = set.has(today) ? today : addDays(today, -1);
  let n = 0;
  while (set.has(d)) {
    n++;
    d = addDays(d, -1);
  }
  return n;
}

export function longestStreak(activeDays: string[]): number {
  const days = [...new Set(activeDays)].sort();
  let best = 0;
  let run = 0;
  let prev = '';
  for (const d of days) {
    run = prev && addDays(prev, 1) === d ? run + 1 : 1;
    best = Math.max(best, run);
    prev = d;
  }
  return best;
}
