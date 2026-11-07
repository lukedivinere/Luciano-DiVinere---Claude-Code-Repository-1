// Tiny synthesized sound effects (Web Audio) — no audio files needed.
import { useProgress } from '../engine/store';

let ctx: AudioContext | null = null;
function ac(): AudioContext | null {
  try {
    ctx ??= new AudioContext();
    if (ctx.state === 'suspended') void ctx.resume();
    return ctx;
  } catch {
    return null;
  }
}

function tone(freq: number, start: number, dur: number, type: OscillatorType = 'sine', vol = 0.12) {
  const c = ac();
  if (!c) return;
  const o = c.createOscillator();
  const g = c.createGain();
  o.type = type;
  o.frequency.value = freq;
  const t = c.currentTime + start;
  g.gain.setValueAtTime(0, t);
  g.gain.linearRampToValueAtTime(vol, t + 0.01);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g).connect(c.destination);
  o.start(t);
  o.stop(t + dur + 0.02);
}

const SOUNDS = {
  click: () => tone(660, 0, 0.06, 'triangle', 0.05),
  pass: () => [523, 659, 784].forEach((f, i) => tone(f, i * 0.08, 0.18, 'triangle')),
  fail: () => [220, 185].forEach((f, i) => tone(f, i * 0.12, 0.2, 'sawtooth', 0.05)),
  xp: () => tone(988, 0, 0.12, 'sine', 0.08),
  levelup: () => [523, 659, 784, 1047, 1319].forEach((f, i) => tone(f, i * 0.09, 0.3, 'triangle', 0.1)),
  boss: () => [392, 523, 659, 784, 659, 784, 1047].forEach((f, i) => tone(f, i * 0.11, 0.35, 'square', 0.06)),
  achievement: () => [784, 988, 1175].forEach((f, i) => tone(f, i * 0.07, 0.25, 'sine', 0.1)),
};

export type SoundName = keyof typeof SOUNDS;

export function play(name: SoundName) {
  if (useProgress.getState().p.settings.muted) return;
  SOUNDS[name]();
}
