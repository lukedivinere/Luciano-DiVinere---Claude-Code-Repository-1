// Ordered list of worlds. To add World 4: create src/content/world4-*/index.ts
// exporting a World, import it here, and append it to WORLDS.
import type { World } from '../engine/types';
import { world1 } from './world1-beginner';

export const WORLDS: World[] = [world1];
