import type { World } from '../../engine/types';
import l01 from './levels/01-hello';
import l02 from './levels/02-variables';
import l03 from './levels/03-strings';
import l04 from './levels/04-math';
import l05 from './levels/05-input';
import l06 from './levels/06-decisions';
import l07 from './levels/07-logic';
import l08 from './levels/08-for-loops';
import l09 from './levels/09-while-loops';
import l10 from './levels/10-lists';
import l11 from './levels/11-functions';
import l12 from './levels/12-bug-hunt';
import boss from './levels/13-boss';

export const world1: World = {
  id: 'w1',
  number: 1,
  title: 'Beginner',
  subtitle: 'Python from zero: print, variables, decisions, loops, lists and functions.',
  theme: { accent: '#34d399', bg: 'linear-gradient(135deg, #12372b, #141833)' },
  languages: ['python'],
  minMinutes: 30,
  levels: [l01, l02, l03, l04, l05, l06, l07, l08, l09, l10, l11, l12, boss],
};
