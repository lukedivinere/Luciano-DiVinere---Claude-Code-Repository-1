// Stage 0 — "Does the matching work at all?" (CLAUDE.md's mandated first step).
//
// Measures whether the app's own JS landmark fingerprinter (public/fingerprint.js)
// reliably identifies SHORT clips (3s/5s/10s — the owner wants Shazam-grade ~5s IDs)
// that have been pitch/speed-shifted (simulating a DJ pitch fader, ±2-8%) and mixed
// with background noise (simulating a club/room recording).
//
// Why this matters: fingerprint.js hashes raw FFT bin indices. A pitch/speed shift
// moves every frequency by the same ratio, so bins land in different indices and
// hashes stop matching exactly — this script measures how badly, and at what point
// (if any) it breaks, using real audio instead of guessing.
//
// Panako (the pitch-robust engine CLAUDE.md wants evaluated alongside this) could not
// be built in this sandbox — two of its dependencies live on hosts this environment's
// network policy blocks (see BRAIN.md). This script covers the half of Stage 0 that
// IS runnable here: is what's already shipped good enough, or does it fall over.
//
// Usage: node scripts/stage0.mjs [audio-dir]   (default: stage0-audio/)
// Input: put a handful of real audio files (mp3/wav/m4a/etc, any length) in that dir.
// Output: prints a results table and writes STAGE0_RESULTS.md + stage0-results.json.

import { execFileSync } from "node:child_process";
import { readdirSync, mkdirSync, rmSync, writeFileSync, existsSync, readFileSync } from "node:fs";
import { join, basename, extname } from "node:path";
import wav from "node-wav";
import { fingerprintPCM, matchHashes } from "../public/fingerprint.js";

const SR = 44100;
const AUDIO_DIR = process.argv[2] || "stage0-audio";
const TMP_DIR = "stage0-tmp";
const DURATIONS = [3, 5, 10]; // seconds — the owner wants sub-5s IDs like Shazam
const CONDITIONS = [
  { id: "clean", speed: 1.0, noise: 0 },
  { id: "speed_minus4", speed: 0.96, noise: 0 },
  { id: "speed_plus4", speed: 1.04, noise: 0 },
  { id: "speed_plus8", speed: 1.08, noise: 0 },
  { id: "noise_only", speed: 1.0, noise: 0.08 },
  { id: "speed_plus4_noise", speed: 1.04, noise: 0.08 }, // realistic club/DJ-set case
];
// Where in each reference track to pull the query window from (fraction of duration),
// picked to land past intros/silence on most dance tracks.
const OFFSET_FRACTION = 0.35;

function sh(cmd, args) {
  execFileSync(cmd, args, { stdio: ["ignore", "ignore", "pipe"] });
}

function probeDuration(file) {
  const out = execFileSync("ffprobe", [
    "-v", "error", "-show_entries", "format=duration",
    "-of", "default=noprint_wrappers=1:nokey=1", file,
  ]).toString().trim();
  return parseFloat(out);
}

function decodeWav(file) {
  const { channelData, sampleRate } = wav.decode(readFileSync(file));
  const mono = channelData.length > 1
    ? channelData[0].map((v, i) => channelData.reduce((s, ch) => s + ch[i], 0) / channelData.length)
    : channelData[0];
  return { pcm: Float32Array.from(mono), sampleRate };
}

function toReferenceWav(input, outPath) {
  sh("ffmpeg", ["-y", "-i", input, "-ac", "1", "-ar", String(SR), outPath]);
}

// Applies the DJ-pitch-fader simulation (asetrate = speed AND pitch change together,
// exactly how a turntable/CDJ pitch fader works) plus optional pink noise, in one pass.
function degrade(input, outPath, { speed, noise }) {
  const filters = [];
  let label = "[0:a]";
  if (speed !== 1.0) {
    filters.push(`${label}asetrate=${SR}*${speed},aresample=${SR}[sped]`);
    label = "[sped]";
  }
  if (noise > 0) {
    filters.push(`anoisesrc=color=pink:amplitude=${noise}:sample_rate=${SR}[noise]`);
    filters.push(`${label}[noise]amix=inputs=2:duration=first:dropout_transition=0[mixed]`);
    label = "[mixed]";
  }
  if (filters.length === 0) {
    sh("ffmpeg", ["-y", "-i", input, "-ac", "1", "-ar", String(SR), outPath]);
    return;
  }
  filters.push(`${label}anull[out]`);
  sh("ffmpeg", ["-y", "-i", input, "-filter_complex", filters.join(";"), "-map", "[out]", "-ac", "1", "-ar", String(SR), outPath]);
}

function main() {
  if (!existsSync(AUDIO_DIR)) {
    console.error(`No ${AUDIO_DIR}/ directory found. Add a few real audio clips there first.`);
    process.exit(1);
  }
  const files = readdirSync(AUDIO_DIR).filter((f) => !f.startsWith("."));
  if (files.length === 0) {
    console.error(`${AUDIO_DIR}/ is empty. Add a few real audio clips (mp3/wav/m4a/etc) and re-run.`);
    process.exit(1);
  }

  rmSync(TMP_DIR, { recursive: true, force: true });
  mkdirSync(TMP_DIR, { recursive: true });

  console.log(`Found ${files.length} reference track(s): ${files.join(", ")}\n`);

  // 1. Enroll every reference track into one shared index (mirrors production: one
  // catalog, queries must find the RIGHT track among all of them, not just "a" track).
  const index = {};
  const trackMeta = {};
  for (const f of files) {
    const trackId = basename(f, extname(f));
    const refWav = join(TMP_DIR, `ref_${trackId}.wav`);
    toReferenceWav(join(AUDIO_DIR, f), refWav);
    const { pcm, sampleRate } = decodeWav(refWav);
    const duration = pcm.length / sampleRate;
    trackMeta[trackId] = { duration, refWav };
    const hashes = fingerprintPCM(pcm, sampleRate);
    for (const { h, t } of hashes) (index[h] || (index[h] = [])).push([trackId, t]);
    console.log(`enrolled ${trackId} (${duration.toFixed(1)}s, ${hashes.length} hashes)`);
  }
  console.log(`\nShared index: ${Object.keys(index).length} unique hashes across ${files.length} tracks\n`);

  // 2. For every track x condition x duration, cut a degraded query window and match.
  const results = []; // {trackId, condition, duration, hit, matchedTrack, peak, ratio}
  for (const trackId of Object.keys(trackMeta)) {
    const { duration: fullDur, refWav } = trackMeta[trackId];
    for (const cond of CONDITIONS) {
      const degradedPath = join(TMP_DIR, `${trackId}_${cond.id}.wav`);
      degrade(refWav, degradedPath, cond);
      const degradedDur = probeDuration(degradedPath);
      for (const dur of DURATIONS) {
        if (dur > degradedDur + 0.05) continue; // source shorter than this query window entirely
        // Prefer a window offset into the clip (avoids intros), but clamp so short
        // source clips (the owner's plan: ~10s or under) still yield a valid window
        // instead of being skipped.
        const maxStart = Math.max(0, degradedDur - dur);
        const start = Math.min(degradedDur * OFFSET_FRACTION, maxStart);
        const clipPath = join(TMP_DIR, `${trackId}_${cond.id}_${dur}s.wav`);
        sh("ffmpeg", ["-y", "-ss", String(start), "-t", String(dur), "-i", degradedPath, "-ac", "1", "-ar", String(SR), clipPath]);
        const { pcm, sampleRate } = decodeWav(clipPath);
        const queryHashes = fingerprintPCM(pcm, sampleRate);
        const match = matchHashes(queryHashes, index);
        const hit = !!match && match.trackId === trackId;
        results.push({
          trackId, condition: cond.id, duration: dur, hit,
          matchedTrack: match ? match.trackId : null,
          peak: match ? match.peak : 0,
          ratio: match ? Number(match.ratio.toFixed(1)) : 0,
          queryHashCount: queryHashes.length,
        });
      }
    }
  }

  // 3. Report.
  printAndSave(results, files.length);
}

function printAndSave(results, trackCount) {
  const byCell = {}; // "condition|duration" -> {hit, total}
  for (const r of results) {
    const key = `${r.condition}|${r.duration}`;
    byCell[key] = byCell[key] || { hit: 0, total: 0 };
    byCell[key].total++;
    if (r.hit) byCell[key].hit++;
  }

  const conditions = [...new Set(results.map((r) => r.condition))];
  const durations = [...new Set(results.map((r) => r.duration))].sort((a, b) => a - b);

  let md = `# Stage 0 results\n\n`;
  md += `Reference tracks: ${trackCount}. Query hash counts and per-clip detail in stage0-results.json.\n\n`;
  md += `Hit rate = % of degraded query clips that matched their own (correct) track in a shared index of all reference tracks.\n\n`;
  md += `| condition \\ clip length | ${durations.map((d) => `${d}s`).join(" | ")} |\n`;
  md += `|---|${durations.map(() => "---").join("|")}|\n`;

  console.log("\n=== Stage 0 hit rate: condition x clip length ===\n");
  const header = `condition`.padEnd(22) + durations.map((d) => `${d}s`.padStart(8)).join("");
  console.log(header);

  for (const c of conditions) {
    let row = c.padEnd(22);
    let mdRow = `| ${c} |`;
    for (const d of durations) {
      const cell = byCell[`${c}|${d}`];
      const pct = cell ? Math.round((100 * cell.hit) / cell.total) : null;
      row += (pct === null ? "  n/a".padStart(8) : `${pct}%`.padStart(8));
      mdRow += ` ${pct === null ? "n/a" : pct + "%"} |`;
    }
    console.log(row);
    md += mdRow + "\n";
  }

  md += `\n## Success criterion (CLAUDE.md Stage 0)\n\n`;
  md += `>70% correct identification on +4% pitched, moderately noisy recordings.\n\n`;
  const target = byCell["speed_plus4_noise|5"] || byCell["speed_plus4|5"];
  if (target) {
    const pct = Math.round((100 * target.hit) / target.total);
    md += `**5s clip, +4% speed + noise: ${pct}%** — ${pct >= 70 ? "MEETS" : "MISSES"} the 70% bar.\n`;
  }

  writeFileSync("STAGE0_RESULTS.md", md);
  writeFileSync("stage0-results.json", JSON.stringify(results, null, 2));
  console.log(`\nWrote STAGE0_RESULTS.md and stage0-results.json`);
}

main();
