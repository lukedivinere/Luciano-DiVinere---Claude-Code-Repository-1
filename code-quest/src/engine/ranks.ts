export interface Rank {
  name: string;
  minXp: number;
  icon: string;
}

export const RANKS: Rank[] = [
  { name: 'Script Kiddie', minXp: 0, icon: '🐣' },
  { name: 'Code Cadet', minXp: 300, icon: '🧭' },
  { name: 'Junior Dev', minXp: 1000, icon: '🛠️' },
  { name: 'Developer', minXp: 2500, icon: '💻' },
  { name: 'Senior Dev', minXp: 5000, icon: '🧠' },
  { name: 'Staff Engineer', minXp: 8000, icon: '🏗️' },
  { name: 'Architect', minXp: 12000, icon: '🏛️' },
];

export function rankFor(xp: number): { rank: Rank; next?: Rank } {
  let i = 0;
  while (i + 1 < RANKS.length && xp >= RANKS[i + 1].minXp) i++;
  return { rank: RANKS[i], next: RANKS[i + 1] };
}
