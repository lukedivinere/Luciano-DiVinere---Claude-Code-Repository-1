// Crate landmark audio fingerprinting — the engine that lets us recognize UNRELEASED
// tracks nobody else has in a database, by building our own catalog.
//
// Method: the Shazam-style "constellation + landmark hash" approach (Wang 2003).
//   audio -> resample to 8 kHz -> STFT (Hann window) -> pick spectral peaks ->
//   pair nearby peaks into compact integer hashes tied to a time offset.
// Two recordings of the same track produce many identical hashes even through noise,
// and matching aligns them by a consistent time delta (see matchHashes).
//
// ES module: imported by the browser (app.js computes fingerprints on-device, so raw
// audio never leaves the phone) and by the server (catalog.js runs matchHashes over the
// enrolled index). decodeAndFingerprint uses Web Audio and is browser-only — its browser
// APIs are referenced only inside the function, so importing this in Node is safe.

const TARGET_SR = 8000;   // fingerprint in the 0–4 kHz band where music energy lives
const FRAME = 1024;       // ~128 ms window at 8 kHz
const HOP = 512;          // 50% overlap -> ~64 ms time resolution
const PEAKS_PER_FRAME = 6; // strongest genuine local maxima kept per frame
const FAN = 5;            // pair each anchor peak with up to N later peaks
const TARGET_DT_MIN = 1;  // frames ahead to start pairing
const TARGET_DT_MAX = 40; // ...and stop (bounded so hashes stay local/robust)

export { TARGET_SR, FRAME, HOP };

// ---- FFT (iterative radix-2) ----------------------------------------------
function fft(re, im) {
  const n = re.length;
  for (let i = 1, j = 0; i < n; i++) {
    let bit = n >> 1;
    for (; j & bit; bit >>= 1) j ^= bit;
    j ^= bit;
    if (i < j) { const tr = re[i]; re[i] = re[j]; re[j] = tr; const ti = im[i]; im[i] = im[j]; im[j] = ti; }
  }
  for (let len = 2; len <= n; len <<= 1) {
    const ang = (-2 * Math.PI) / len;
    const wr = Math.cos(ang), wi = Math.sin(ang);
    for (let i = 0; i < n; i += len) {
      let cwr = 1, cwi = 0;
      for (let k = 0; k < len / 2; k++) {
        const a = i + k, b = i + k + len / 2;
        const xr = re[b] * cwr - im[b] * cwi;
        const xi = re[b] * cwi + im[b] * cwr;
        re[b] = re[a] - xr; im[b] = im[a] - xi;
        re[a] += xr; im[a] += xi;
        const ncwr = cwr * wr - cwi * wi;
        cwi = cwr * wi + cwi * wr; cwr = ncwr;
      }
    }
  }
}

// ---- resample (linear) to TARGET_SR ---------------------------------------
function resampleMono(pcm, sampleRate) {
  if (sampleRate === TARGET_SR) return pcm;
  const ratio = sampleRate / TARGET_SR;
  const outLen = Math.floor(pcm.length / ratio);
  const out = new Float32Array(outLen);
  for (let i = 0; i < outLen; i++) {
    const pos = i * ratio;
    const i0 = Math.floor(pos);
    const frac = pos - i0;
    out[i] = pcm[i0] * (1 - frac) + (pcm[i0 + 1] || 0) * frac;
  }
  return out;
}

const hann = (() => {
  const w = new Float32Array(FRAME);
  for (let i = 0; i < FRAME; i++) w[i] = 0.5 * (1 - Math.cos((2 * Math.PI * i) / (FRAME - 1)));
  return w;
})();

// ---- fingerprint PCM -> [{h, t}] ------------------------------------------
export function fingerprintPCM(pcm, sampleRate) {
  const sig = resampleMono(pcm, sampleRate);
  const re = new Float64Array(FRAME);
  const im = new Float64Array(FRAME);
  const mag = new Float64Array(FRAME / 2);
  const peaks = []; // {t, f}
  const nFrames = Math.max(0, 1 + Math.floor((sig.length - FRAME) / HOP));

  for (let fr = 0; fr < nFrames; fr++) {
    const off = fr * HOP;
    for (let i = 0; i < FRAME; i++) { re[i] = sig[off + i] * hann[i]; im[i] = 0; }
    fft(re, im);

    // magnitude spectrum + this frame's peak energy (for an adaptive floor)
    let frameMax = 0;
    for (let k = 1; k < FRAME / 2; k++) {
      const m = re[k] * re[k] + im[k] * im[k];
      mag[k] = m;
      if (m > frameMax) frameMax = m;
    }
    if (frameMax < 1e-9) continue; // near-silent frame -> no peaks
    const floor = frameMax * 0.04; // ignore anything <4% of the frame's strongest bin

    // genuine local maxima across the whole spectrum, then keep the strongest few.
    // (Adaptive + spread beats fixed log bands, which kept re-picking the same low bins
    // every frame and made hashes non-specific.)
    const cands = [];
    for (let k = 2; k < FRAME / 2 - 1; k++) {
      if (mag[k] > floor && mag[k] > mag[k - 1] && mag[k] >= mag[k + 1]) cands.push(k);
    }
    cands.sort((a, b) => mag[b] - mag[a]);
    const keep = Math.min(PEAKS_PER_FRAME, cands.length);
    for (let z = 0; z < keep; z++) peaks.push({ t: fr, f: cands[z] });
  }

  const hashes = [];
  for (let i = 0; i < peaks.length; i++) {
    const a = peaks[i];
    let paired = 0;
    for (let j = i + 1; j < peaks.length && paired < FAN; j++) {
      const b = peaks[j];
      const dt = b.t - a.t;
      if (dt < TARGET_DT_MIN) continue;
      if (dt > TARGET_DT_MAX) break;
      const f1 = a.f & 0x1ff, f2 = b.f & 0x1ff, d = dt & 0x3f; // f1(9) | f2(9) | dt(6)
      hashes.push({ h: (f1 << 15) | (f2 << 6) | d, t: a.t });
      paired++;
    }
  }
  return hashes;
}

// ---- match query hashes against an inverted index -------------------------
// index: { [hash]: [[trackId, t], ...] }. Returns {trackId, score, ratio} or null.
//
// A TRUE match concentrates many hashes at one time delta (tRef - tQuery) — a sharp spike
// far above the histogram's background. A coincidental overlap between unrelated tracks
// produces a diffuse, low plateau. So we require both an absolute peak and a strong
// peak-above-background ratio; raw count alone would false-positive on the plateau.
export function matchHashes(queryHashes, index, opts = {}) {
  const { minPeak = 15, minRatio = 8 } = opts;
  const votes = new Map(); // trackId -> Map(delta -> count)
  for (const { h, t } of queryHashes) {
    const bucket = index[h];
    if (!bucket) continue;
    for (const [trackId, tRef] of bucket) {
      const delta = tRef - t;
      let m = votes.get(trackId);
      if (!m) { m = new Map(); votes.set(trackId, m); }
      m.set(delta, (m.get(delta) || 0) + 1);
    }
  }
  let best = null;
  for (const [trackId, m] of votes) {
    let peak = 0, sum = 0, cnt = 0;
    for (const c of m.values()) { if (c > peak) peak = c; sum += c; cnt++; }
    const bg = cnt ? sum / cnt : 1;
    const ratio = peak / (bg || 1);
    if (!best || peak > best.peak) best = { trackId, peak, ratio, score: peak };
  }
  if (!best) return null;
  return best.peak >= minPeak && best.ratio >= minRatio ? best : null;
}

// ---- browser-only: decode a file/blob ArrayBuffer and fingerprint it ------
export async function decodeAndFingerprint(arrayBuffer) {
  const ctx = new (self.AudioContext || self.webkitAudioContext)();
  const audio = await ctx.decodeAudioData(arrayBuffer.slice(0));
  if (ctx.close) ctx.close();
  const ch = audio.numberOfChannels;
  const len = audio.length;
  const mono = new Float32Array(len);
  for (let c = 0; c < ch; c++) {
    const data = audio.getChannelData(c);
    for (let i = 0; i < len; i++) mono[i] += data[i] / ch;
  }
  return fingerprintPCM(mono, audio.sampleRate);
}
