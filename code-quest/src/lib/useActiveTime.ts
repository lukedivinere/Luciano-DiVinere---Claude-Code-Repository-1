import { useEffect } from 'react';
import { useProgress } from '../engine/store';

const TICK = 15; // seconds
const IDLE_AFTER = 90_000; // ms without input = not studying

/** Counts time only while the tab is visible and the learner was recently active. */
export function useActiveTime() {
  useEffect(() => {
    let last = Date.now();
    const bump = () => (last = Date.now());
    const evs = ['keydown', 'mousedown', 'mousemove', 'wheel', 'touchstart'];
    evs.forEach((e) => window.addEventListener(e, bump, { passive: true }));
    const id = setInterval(() => {
      if (document.visibilityState === 'visible' && Date.now() - last < IDLE_AFTER) {
        useProgress.getState().tick(TICK);
      }
    }, TICK * 1000);
    return () => {
      clearInterval(id);
      evs.forEach((e) => window.removeEventListener(e, bump));
    };
  }, []);
}
