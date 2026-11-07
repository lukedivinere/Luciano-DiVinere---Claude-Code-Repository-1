import type { World } from '../../engine/types';
import l01 from './levels/01-hello';

export const world1: World = {
  id: 'w1',
  number: 1,
  title: 'Beginner',
  subtitle: 'Python from zero: print, variables, decisions, loops, lists and functions.',
  theme: { accent: '#34d399', bg: 'linear-gradient(135deg, #12372b, #141833)' },
  languages: ['python'],
  minMinutes: 30,
  levels: [l01],
};
