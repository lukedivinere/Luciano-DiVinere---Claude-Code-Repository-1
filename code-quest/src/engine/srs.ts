// Leitner-box spaced repetition for quiz questions you got wrong.
// Box 1 = due right away; each correct answer moves the card up a box and
// pushes the next review further out. A wrong answer sends it back to box 1.
import { DAY_MS } from './dates';

export interface Card {
  box: number; // 1..6
  due: number; // epoch ms
  concept: string;
  lapses: number;
}

export const BOX_INTERVAL_DAYS: Record<number, number> = { 1: 0, 2: 1, 3: 2, 4: 4, 5: 7, 6: 14 };
export const MAX_BOX = 6;
export const MASTERED_BOX = 3;

export function missed(card: Card | undefined, concept: string, now: number): Card {
  return { box: 1, due: now, concept, lapses: (card?.lapses ?? 0) + 1 };
}

export function answered(card: Card, correct: boolean, now: number): Card {
  if (!correct) return missed(card, card.concept, now);
  const box = Math.min(MAX_BOX, card.box + 1);
  return { ...card, box, due: now + BOX_INTERVAL_DAYS[box] * DAY_MS };
}

export function dueCards(cards: Record<string, Card>, now: number): string[] {
  return Object.entries(cards)
    .filter(([, c]) => c.due <= now)
    .sort((a, b) => a[1].box - b[1].box || a[1].due - b[1].due)
    .map(([id]) => id);
}
