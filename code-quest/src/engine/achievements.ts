// Badges. Each one is a predicate over progress; the store awards a badge the
// first time its predicate becomes true.
import { levelItems } from './content';
import { exerciseAccuracy, levelComplete, totalXp, type ProgressData } from './progress';
import { currentStreak, longestStreak } from './streak';
import type { World } from './types';

export interface Achievement {
  id: string;
  name: string;
  icon: string;
  description: string;
  earned: (p: ProgressData, worlds: World[]) => boolean;
}

const allExercises = (worlds: World[]) =>
  worlds.flatMap((w) => w.levels.flatMap((l) => [...l.practice, ...l.challenges]));

const doneOfType = (p: ProgressData, worlds: World[], pred: (e: ReturnType<typeof allExercises>[number]) => boolean) =>
  allExercises(worlds).filter((e) => pred(e) && p.items[e.id]?.done);

const bossOf = (worlds: World[], n: number) => worlds[n - 1]?.levels.filter((l) => l.kind === 'boss') ?? [];

export const ACHIEVEMENTS: Achievement[] = [
  { id: 'first-steps', name: 'First Steps', icon: '👣', description: 'Complete your first item.', earned: (p) => Object.values(p.items).some((r) => r.done) },
  { id: 'hello-world', name: 'Hello, World', icon: '👋', description: 'Pass your first coding exercise.', earned: (p, w) => doneOfType(p, w, () => true).length >= 1 },
  { id: 'level-1', name: 'Level Cleared', icon: '🏁', description: 'Finish a whole level.', earned: (p, w) => w.some((x) => x.levels.some((l) => levelComplete(p, l))) },
  { id: 'no-hint-hero', name: 'No-Hint Hero', icon: '🦸', description: 'Pass 10 challenges without using any hints.', earned: (p, w) => doneOfType(p, w, (e) => e.type !== 'practice').filter((e) => p.items[e.id].hintsUsed === 0).length >= 10 },
  { id: 'first-try-5', name: 'Sharpshooter', icon: '🎯', description: 'Pass 5 exercises on the first try.', earned: (p) => exerciseAccuracy(p).firstTry >= 5 },
  { id: 'first-try-25', name: 'Sniper', icon: '🏹', description: 'Pass 25 exercises on the first try.', earned: (p) => exerciseAccuracy(p).firstTry >= 25 },
  { id: 'bug-squasher', name: 'Bug Squasher', icon: '🐞', description: 'Fix 5 pieces of broken code (Debug Mode).', earned: (p, w) => doneOfType(p, w, (e) => e.type === 'debug').length >= 5 },
  { id: 'exterminator', name: 'Exterminator', icon: '🧯', description: 'Fix 15 pieces of broken code.', earned: (p, w) => doneOfType(p, w, (e) => e.type === 'debug').length >= 15 },
  { id: 'perfect-quiz', name: 'Perfect Quiz', icon: '💯', description: 'Answer every question in a quiz correctly on your first go.', earned: (p, w) => w.some((x) => x.levels.some((l) => l.quiz.length > 0 && p.items[`${l.id}.quiz`]?.bestQuiz === l.quiz.length)) },
  { id: 'streak-3', name: 'On a Roll', icon: '🔥', description: 'Reach a 3-day streak.', earned: (p) => longestStreak(p.activeDays) >= 3 || currentStreak(p.activeDays) >= 3 },
  { id: 'streak-7', name: 'Week Warrior', icon: '📅', description: 'Reach a 7-day streak.', earned: (p) => longestStreak(p.activeDays) >= 7 },
  { id: 'streak-30', name: 'Habit Formed', icon: '🗓️', description: 'Reach a 30-day streak.', earned: (p) => longestStreak(p.activeDays) >= 30 },
  { id: 'reviewer', name: 'Memory Builder', icon: '🧩', description: 'Answer 10 review questions correctly.', earned: (p) => p.xpLog.filter((e) => e.reason === 'review').length >= 10 },
  { id: 'polyglot', name: 'Polyglot', icon: '🌐', description: 'Pass a JavaScript exercise.', earned: (p, w) => doneOfType(p, w, (e) => e.lang === 'javascript').length >= 1 },
  { id: 'dom-tamer', name: 'DOM Tamer', icon: '🖱️', description: 'Pass an exercise that changes a web page.', earned: (p, w) => doneOfType(p, w, (e) => !!e.dom).length >= 1 },
  { id: 'query-master', name: 'Query Master', icon: '🗄️', description: 'Pass 5 SQL exercises.', earned: (p, w) => doneOfType(p, w, (e) => e.lang === 'sql').length >= 5 },
  { id: 'boss-1', name: 'Beginner Boss Slain', icon: '🐉', description: 'Beat the World 1 Boss.', earned: (p, w) => bossOf(w, 1).length > 0 && bossOf(w, 1).every((b) => levelComplete(p, b)) },
  { id: 'boss-2', name: 'Intermediate Boss Slain', icon: '🐲', description: 'Beat the World 2 Boss.', earned: (p, w) => bossOf(w, 2).length > 0 && bossOf(w, 2).every((b) => levelComplete(p, b)) },
  { id: 'boss-3', name: 'Expert Boss Slain', icon: '👑', description: 'Beat the World 3 capstone.', earned: (p, w) => bossOf(w, 3).length > 0 && bossOf(w, 3).every((b) => levelComplete(p, b)) },
  { id: 'xp-1000', name: 'Four Digits', icon: '⭐', description: 'Earn 1,000 XP.', earned: (p) => totalXp(p) >= 1000 },
  { id: 'xp-5000', name: 'XP Hoarder', icon: '🌟', description: 'Earn 5,000 XP.', earned: (p) => totalXp(p) >= 5000 },
  { id: 'hour', name: 'Time Invested', icon: '⏱️', description: 'Spend 1 hour coding in Code Quest.', earned: (p) => p.time.totalSec >= 3600 },
  { id: 'completionist', name: 'Completionist', icon: '🏆', description: 'Complete every item in every world.', earned: (p, w) => w.every((x) => x.levels.every((l) => levelItems(l).every((i) => p.items[i.id]?.done))) },
];

export function newlyEarned(p: ProgressData, worlds: World[]): Achievement[] {
  return ACHIEVEMENTS.filter((a) => !p.achievements[a.id] && a.earned(p, worlds));
}
