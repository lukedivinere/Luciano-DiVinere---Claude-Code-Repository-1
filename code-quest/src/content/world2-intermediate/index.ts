import type { World } from '../../engine/types';
import l01 from './levels/01-dicts';
import l02 from './levels/02-nested';
import l03 from './levels/03-functions-deeper';
import l04 from './levels/04-scope';
import l05 from './levels/05-reading-errors';
import l06 from './levels/06-try-except';
import l07 from './levels/07-string-manipulation';
import l08 from './levels/08-comprehensions';
import l09 from './levels/09-classes';
import l10 from './levels/10-debug-inventory';

export const world2: World = {
  id: 'w2',
  number: 2,
  title: 'Intermediate',
  subtitle: 'Python data structures, errors and classes — then JavaScript, side by side.',
  theme: { accent: '#5ec8ff', bg: 'linear-gradient(135deg, #10304a, #141833)' },
  languages: ['python', 'javascript'],
  minMinutes: 60,
  levels: [l01, l02, l03, l04, l05, l06, l07, l08, l09, l10],
};
