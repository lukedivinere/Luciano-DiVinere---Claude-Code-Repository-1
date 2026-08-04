// Prove the fingerprint engine: a noisy, gain-changed, time-shifted excerpt of a track
// must match the enrolled full track; unrelated audio must not.
import { fingerprintPCM, matchHashes } from "./public/fingerprint.js";

const SR = 44100;

// A synthetic "song": several partials whose frequencies drift on a continuous random walk
// (no segment grid, so no shared transients / clicks). Continuous phase = no artifacts;
// a different seed is a genuinely different track. Real house tracks have even more entropy.
function makeSong(seconds, seed = 1) {
  const n = seconds * SR;
  const pcm = new Float32Array(n);
  let s = seed >>> 0;
  const rnd = () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296);
  const K = 5;
  const parts = Array.from({ length: K }, () => ({ f: 150 + rnd() * 1500, tf: 150 + rnd() * 1500, a: 0.3 + rnd() * 0.5, phase: rnd() * 6.283 }));
  const retarget = Math.floor(SR / 12); // pick new target frequencies ~12x/sec
  for (let i = 0; i < n; i++) {
    let v = 0;
    for (const p of parts) {
      if (i % retarget === 0) p.tf = 150 + rnd() * 1500;
      p.f += (p.tf - p.f) * 0.0008;               // glide toward target
      p.phase += (2 * Math.PI * p.f) / SR;         // continuous phase -> no clicks
      v += p.a * Math.sin(p.phase);
    }
    pcm[i] = v / K;
  }
  return pcm;
}

function excerpt(pcm, startSec, lenSec, noise = 0.15, gain = 0.7) {
  const start = startSec * SR;
  const out = new Float32Array(lenSec * SR);
  let s = 99;
  const rnd = () => (s = (s * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff;
  for (let i = 0; i < out.length; i++) out[i] = (pcm[start + i] || 0) * gain + (rnd() * 2 - 1) * noise;
  return out;
}

function buildIndex(hashes, trackId) {
  const index = {};
  for (const { h, t } of hashes) (index[h] || (index[h] = [])).push([trackId, t]);
  return index;
}

// Enroll a small CATALOG of distinct tracks into one shared index.
const catalog = [
  ["sydney-charles-that-jam-is-fresh", makeSong(20, 7)],
  ["max-styler-id-1", makeSong(18, 42)],
  ["max-styler-id-2", makeSong(22, 100)],
];
const index = {};
for (const [trackId, song] of catalog) {
  const hs = fingerprintPCM(song, SR);
  for (const { h, t } of hs) (index[h] || (index[h] = [])).push([trackId, t]);
}
console.log(`enrolled ${catalog.length} tracks, ${Object.keys(index).length} unique hashes`);

let pass = true;
function check(label, got, wantTrack) {
  const ok = wantTrack ? got && got.trackId === wantTrack : got === null;
  pass = pass && ok;
  console.log(`  ${ok ? "✓" : "✗"} ${label}:`, got ? `${got.trackId} (peak ${got.peak}, ratio ${got.ratio.toFixed(1)})` : "no match");
}

// positive: noisy 7s excerpt of track 1, picked out of the 3-track catalog
check("clean-ish 7s excerpt of track1", matchHashes(fingerprintPCM(excerpt(catalog[0][1], 6, 7, 0.15, 0.7), SR), index), "sydney-charles-that-jam-is-fresh");
// harder: short 5s excerpt, heavier noise, of track 2 -> must pick track2 specifically
check("noisy 5s excerpt of track2", matchHashes(fingerprintPCM(excerpt(catalog[1][1], 3, 5, 0.3, 0.6), SR), index), "max-styler-id-2".replace("-2", "-1"));
// track 3, low gain
check("quiet 6s excerpt of track3", matchHashes(fingerprintPCM(excerpt(catalog[2][1], 10, 6, 0.2, 0.4), SR), index), "max-styler-id-2");
// negatives: unrelated tracks not in the catalog must return null
check("unrelated track (seed 999)", matchHashes(fingerprintPCM(makeSong(7, 999), SR), index), null);
check("unrelated track (seed 555)", matchHashes(fingerprintPCM(makeSong(6, 555), SR), index), null);

console.log(pass ? "\nPASS ✓ identifies the right track among several, rejects unrelated audio" : "\nFAIL ✗");
process.exit(pass ? 0 : 1);
