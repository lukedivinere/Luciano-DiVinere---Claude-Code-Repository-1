import { describe, expect, it } from 'vitest';
import { exerciseXp, levelProgress, playerLevel } from '../../src/engine/xp';
import { rankFor } from '../../src/engine/ranks';
import { currentStreak, longestStreak } from '../../src/engine/streak';
import { answered, dueCards, missed } from '../../src/engine/srs';
import { addDays, DAY_MS } from '../../src/engine/dates';
import { emptyProgress, itemUnlocked, levelComplete, levelUnlocked, migrate, worldUnlocked } from '../../src/engine/progress';
import { levelItems } from '../../src/engine/content';
import { defineLevel, out } from '../../src/content/dsl';
import type { World } from '../../src/engine/types';

describe('XP', () => {
  it('gives base XP plus first-try and no-hint bonuses', () => {
    expect(exerciseXp('challenge', 0, true)).toBe(75); // 50 × 1.5
    expect(exerciseXp('challenge', 0, false)).toBe(63); // 50 × 1.25 → 62.5 rounds to 63
    expect(exerciseXp('practice', 0, true)).toBe(23);
  });
  it('reduces XP by hint tier but never to zero', () => {
    expect(exerciseXp('challenge', 1, true)).toBe(56); // 50 × 0.9 × 1.25
    expect(exerciseXp('challenge', 2, false)).toBe(38); // 50 × 0.75
    expect(exerciseXp('challenge', 3, false)).toBe(25); // 50 × 0.5
    expect(exerciseXp('boss-step', 3, false)).toBeGreaterThan(0);
  });
  it('maps XP to player levels', () => {
    expect(playerLevel(0)).toBe(1);
    expect(playerLevel(49)).toBe(1);
    expect(playerLevel(50)).toBe(2);
    expect(playerLevel(200)).toBe(3);
    const lp = levelProgress(125);
    expect(lp.level).toBe(2);
    expect(lp.into).toBe(75);
    expect(lp.needed).toBe(150);
  });
  it('maps XP to ranks', () => {
    expect(rankFor(0).rank.name).toBe('Script Kiddie');
    expect(rankFor(1000).rank.name).toBe('Junior Dev');
    expect(rankFor(999_999).rank.name).toBe('Architect');
    expect(rankFor(999_999).next).toBeUndefined();
  });
});

describe('streak', () => {
  const today = '2026-03-10';
  it('counts consecutive days ending today', () => {
    expect(currentStreak(['2026-03-08', '2026-03-09', '2026-03-10'], today)).toBe(3);
  });
  it('stays alive if yesterday was active but today not yet', () => {
    expect(currentStreak(['2026-03-08', '2026-03-09'], today)).toBe(2);
  });
  it('breaks after a missed day', () => {
    expect(currentStreak(['2026-03-07', '2026-03-08'], today)).toBe(0);
  });
  it('handles month boundaries and longest streak', () => {
    expect(addDays('2026-02-28', 1)).toBe('2026-03-01');
    expect(longestStreak(['2026-02-27', '2026-02-28', '2026-03-01', '2026-03-05'])).toBe(3);
  });
});

describe('spaced repetition', () => {
  const now = 1_000_000_000_000;
  it('missed cards are due immediately in box 1', () => {
    const c = missed(undefined, 'loops', now);
    expect(c.box).toBe(1);
    expect(dueCards({ a: c }, now)).toEqual(['a']);
  });
  it('correct answers move up a box and push the due date out', () => {
    const c = answered(missed(undefined, 'x', now), true, now);
    expect(c.box).toBe(2);
    expect(c.due).toBe(now + DAY_MS);
    expect(dueCards({ a: c }, now)).toEqual([]);
    const c3 = answered(c, true, now);
    expect(c3.box).toBe(3);
    expect(c3.due).toBe(now + 2 * DAY_MS);
  });
  it('a wrong answer sends the card back to box 1', () => {
    const c = answered(answered(missed(undefined, 'x', now), true, now), false, now);
    expect(c.box).toBe(1);
    expect(c.lapses).toBe(2);
  });
});

describe('unlocks', () => {
  const mk = (id: string, kind: 'level' | 'boss' = 'level') =>
    defineLevel({
      id, title: id, kind, icon: '', summary: '', lang: 'python', teaches: [], requires: [],
      learn: [{ title: 't', minutes: 1, analogy: '', body: '', example: { lang: 'python', code: '' } }],
      challenges: [{ title: 'c', minutes: 1, prompt: '', starter: '', solution: '', solutionExplain: '', hints: ['a', 'b'], tests: [out('x', 'x', 'x')] }],
      quiz: [],
    });
  const worlds: World[] = [
    { id: 'w1', number: 1, title: '', subtitle: '', theme: { accent: '', bg: '' }, languages: [], minMinutes: 0, levels: [mk('a'), mk('b', 'boss')] },
    { id: 'w2', number: 2, title: '', subtitle: '', theme: { accent: '', bg: '' }, languages: [], minMinutes: 0, levels: [mk('c')] },
  ];
  const doneAll = (p: ReturnType<typeof emptyProgress>, lvl: World['levels'][number]) => {
    for (const i of levelItems(lvl)) p.items[i.id] = { done: true, xp: 0, attempts: 1, hintsUsed: 0 };
  };

  it('opens levels in order and worlds only after the boss', () => {
    const p = emptyProgress();
    expect(levelUnlocked(p, worlds, 0, 0)).toBe(true);
    expect(levelUnlocked(p, worlds, 0, 1)).toBe(false);
    expect(worldUnlocked(p, worlds, 1)).toBe(false);
    doneAll(p, worlds[0].levels[0]);
    expect(levelComplete(p, worlds[0].levels[0])).toBe(true);
    expect(levelUnlocked(p, worlds, 0, 1)).toBe(true);
    expect(worldUnlocked(p, worlds, 1)).toBe(false);
    doneAll(p, worlds[0].levels[1]);
    expect(worldUnlocked(p, worlds, 1)).toBe(true);
    expect(levelUnlocked(p, worlds, 1, 0)).toBe(true);
  });
  it('opens items inside a level in order', () => {
    const p = emptyProgress();
    const lvl = worlds[0].levels[0];
    expect(itemUnlocked(p, lvl, 0)).toBe(true);
    expect(itemUnlocked(p, lvl, 1)).toBe(false);
    p.items[levelItems(lvl)[0].id] = { done: true, xp: 10, attempts: 0, hintsUsed: 0 };
    expect(itemUnlocked(p, lvl, 1)).toBe(true);
  });
});

describe('save migration', () => {
  it('fills missing fields without losing data', () => {
    const old = { items: { 'w1.l1.p1': { done: true, xp: 19, attempts: 1, hintsUsed: 0 } }, xpLog: [{ t: 1, xp: 19, reason: 'practice' }] };
    const p = migrate(old);
    expect(p.items['w1.l1.p1'].done).toBe(true);
    expect(p.settings.muted).toBe(false);
    expect(p.time.totalSec).toBe(0);
    expect(p.srs).toEqual({});
  });
  it('recovers from garbage', () => {
    expect(migrate('nonsense').items).toEqual({});
    expect(migrate(null).xpLog).toEqual([]);
  });
});
