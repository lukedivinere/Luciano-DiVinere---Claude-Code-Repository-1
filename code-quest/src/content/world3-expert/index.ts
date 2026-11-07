import type { World } from '../../engine/types';
import l01 from './levels/01-big-o';
import l02 from './levels/02-searching';
import l03 from './levels/03-sorting';
import l04 from './levels/04-recursion';
import l05 from './levels/05-inheritance';
import l06 from './levels/06-composition';
import l07 from './levels/07-json';
import l08 from './levels/08-apis';
import l09 from './levels/09-promises';
import l10 from './levels/10-async-await';
import l11 from './levels/11-sql-basics';
import l12 from './levels/12-sql-aggregate';
import l13 from './levels/13-sql-join';
import l14 from './levels/14-testing';
import l15 from './levels/15-refactoring';
import l16 from './levels/16-projects-git';
import l17 from './levels/17-debug-incident';
import boss from './levels/18-capstone';

export const world3: World = {
  id: 'w3',
  number: 3,
  title: 'Expert',
  subtitle: 'Algorithms, OOP design, JSON & APIs, async JS, SQL, testing and real-project skills.',
  theme: { accent: '#c084fc', bg: 'linear-gradient(135deg, #34184a, #141833)' },
  languages: ['python', 'javascript', 'sql'],
  minMinutes: 90,
  levels: [l01, l02, l03, l04, l05, l06, l07, l08, l09, l10, l11, l12, l13, l14, l15, l16, l17, boss],
};
