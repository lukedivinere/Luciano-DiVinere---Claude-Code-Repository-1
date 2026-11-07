import confetti from 'canvas-confetti';

export function burst(big = false) {
  const opts = { particleCount: big ? 220 : 90, spread: big ? 110 : 70, origin: { y: 0.6 }, disableForReducedMotion: true };
  void confetti(opts);
  if (big) {
    setTimeout(() => void confetti({ ...opts, angle: 60, origin: { x: 0, y: 0.7 } }), 200);
    setTimeout(() => void confetti({ ...opts, angle: 120, origin: { x: 1, y: 0.7 } }), 350);
  }
}
