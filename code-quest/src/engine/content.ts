// Helpers that flatten worlds/levels into an ordered list of completable items.
import type { ItemRef, Level, World } from './types';

export function levelItems(level: Level): ItemRef[] {
  const items: ItemRef[] = [];
  for (const card of level.learn) items.push({ kind: 'learn', id: card.id, minutes: card.minutes, card });
  for (const ex of level.practice) items.push({ kind: 'exercise', id: ex.id, minutes: ex.minutes, ex });
  for (const ex of level.challenges) items.push({ kind: 'exercise', id: ex.id, minutes: ex.minutes, ex });
  if (level.quiz.length) items.push({ kind: 'quiz', id: `${level.id}.quiz`, minutes: level.quizMinutes, questions: level.quiz });
  return items;
}

export function levelMinutes(level: Level): number {
  return levelItems(level).reduce((s, i) => s + i.minutes, 0);
}

export function worldMinutes(world: World): number {
  return world.levels.reduce((s, l) => s + levelMinutes(l), 0);
}
