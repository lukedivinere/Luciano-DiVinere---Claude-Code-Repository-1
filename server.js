// Crate — Phase-0 web uploader for house-music track ID.
//
// Design constraints (from VALIDATION.md, non-negotiable):
//   1. NEVER persist uploaded audio. Uploads live in memory only, are sent to the
//      fingerprint API if configured, and are discarded when the request ends.
//   2. Community submissions store METADATA + an outbound source link only — never
//      the audio file itself. We point people at the artist's own page.
//   3. AI / similarity output is always framed as a *guess*, never a fact.
//
// The point of this build is to measure demand: do people try to ID tracks, and —
// more importantly — do they contribute unreleased IDs back? Those two counters are
// the Phase-0 signal.

import express from "express";
import multer from "multer";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { readFile, writeFile, mkdir } from "node:fs/promises";
import { runPipeline } from "./pipeline.js";
import { addDrop, listDrops } from "./instagram.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_DIR = join(__dirname, "data");
const SUBMISSIONS_FILE = join(DATA_DIR, "submissions.json");
const STATS_FILE = join(DATA_DIR, "stats.json");
const NOTIFICATIONS_FILE = join(DATA_DIR, "notifications.json");
const SEED_FILE = join(__dirname, "seed.json");

const PORT = process.env.PORT || 3000;
const AUDD_TOKEN = process.env.AUDD_API_TOKEN || ""; // optional; demo mode without it

const app = express();
app.use(express.json());
app.use(express.static(join(__dirname, "public")));

// Audio stays in RAM only — we never write it to disk. 15 MB cap keeps it to short clips.
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 15 * 1024 * 1024 },
});

// ---- tiny JSON persistence (Phase-0; swap for a real DB later) --------------

async function readJson(file, fallback) {
  try {
    return JSON.parse(await readFile(file, "utf8"));
  } catch {
    return fallback;
  }
}

async function writeJson(file, data) {
  await mkdir(DATA_DIR, { recursive: true });
  await writeFile(file, JSON.stringify(data, null, 2));
}

async function bumpStat(key) {
  const stats = await readJson(STATS_FILE, { identifyAttempts: 0, submissions: 0, votes: 0 });
  stats[key] = (stats[key] || 0) + 1;
  await writeJson(STATS_FILE, stats);
  return stats;
}

// ---- routes ----------------------------------------------------------------

app.get("/api/config", (_req, res) => {
  res.json({ fingerprintConfigured: Boolean(AUDD_TOKEN) });
});

app.get("/api/stats", async (_req, res) => {
  const stats = await readJson(STATS_FILE, { identifyAttempts: 0, submissions: 0, votes: 0 });
  res.json(stats);
});

// Identify: the recorded clip is fanned out across every source by the pipeline,
// used transiently and never stored.
app.post("/api/identify", upload.single("clip"), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: "No audio clip provided." });
  await bumpStat("identifyAttempts");
  try {
    const result = await runPipeline(req.file.buffer, req.file.originalname);
    res.json(result);
  } catch (err) {
    console.error("identify error:", err);
    res.status(502).json({ error: "Recognition failed. Try again." });
  }
  // req.file.buffer goes out of scope here — audio is not persisted anywhere.
});

// Community unreleased-ID submission. Metadata + outbound link only.
app.post("/api/submit", async (req, res) => {
  const { trackTitle, artistGuess, sourceUrl, notes } = req.body || {};

  if (!artistGuess && !trackTitle) {
    return res.status(400).json({ error: "Give at least a track title or an artist." });
  }
  // We link out to the source; we do not host audio. Reject anything that isn't a URL.
  if (sourceUrl && !/^https?:\/\/\S+$/i.test(sourceUrl)) {
    return res.status(400).json({ error: "Source link must be a valid http(s) URL." });
  }

  const submissions = await readJson(SUBMISSIONS_FILE, []);
  const entry = {
    id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
    trackTitle: (trackTitle || "").slice(0, 200).trim(),
    artistGuess: (artistGuess || "").slice(0, 200).trim(),
    sourceUrl: (sourceUrl || "").slice(0, 500).trim(),
    notes: (notes || "").slice(0, 500).trim(),
    votes: 0,
    submittedAt: new Date().toISOString(),
  };
  submissions.unshift(entry);
  await writeJson(SUBMISSIONS_FILE, submissions.slice(0, 500));
  await bumpStat("submissions");
  res.json({ ok: true, entry });
});

app.get("/api/submissions", async (_req, res) => {
  const submissions = await readJson(SUBMISSIONS_FILE, []);
  // Attach how many people asked to be notified about each ID — social proof + demand data.
  const notifs = await readJson(NOTIFICATIONS_FILE, []);
  const counts = {};
  for (const n of notifs) if (n.submissionId) counts[n.submissionId] = (counts[n.submissionId] || 0) + 1;
  res.json(submissions.map((s) => ({ ...s, watchers: counts[s.id] || 0 })));
});

// "Notify me" — capture who wants an update when an ID gets a confirmed name or a
// release date, and how to reach them. This is the intent-capture layer; the actual send
// is a backend job wired once those events exist (community-consensus + release-watch).
// We store only the email + the two event flags — nothing else, for this purpose only.
app.post("/api/notify", async (req, res) => {
  const { submissionId, email, onNamed, onDrop } = req.body || {};
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ error: "Enter a valid email." });
  }
  if (!onNamed && !onDrop) {
    return res.status(400).json({ error: "Pick at least one update to get." });
  }
  const subs = await readJson(SUBMISSIONS_FILE, []);
  const sub = subs.find((s) => s.id === submissionId);
  const list = await readJson(NOTIFICATIONS_FILE, []);
  list.unshift({
    id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
    submissionId: submissionId || null,
    trackTitle: sub ? sub.trackTitle : null, // denormalized so the list is readable later
    email: String(email).slice(0, 200).trim(),
    onNamed: Boolean(onNamed),
    onDrop: Boolean(onDrop),
    createdAt: new Date().toISOString(),
  });
  await writeJson(NOTIFICATIONS_FILE, list.slice(0, 2000));
  await bumpStat("notifySignups");
  res.json({ ok: true });
});

// Instagram ID drops — submit a post URL + the IDs it contains. Metadata + link only.
app.post("/api/ig-drops", async (req, res) => {
  const { url, artist, trackTitle, note } = req.body || {};
  const result = await addDrop({ url, artist, trackTitle, note });
  if (result.error) return res.status(400).json({ error: result.error });
  await bumpStat("igDrops");
  res.json(result);
});

app.get("/api/ig-drops", async (_req, res) => {
  res.json(await listDrops());
});

// Upvote — the reputation/engagement signal that tells us the community loop works.
app.post("/api/submissions/:id/vote", async (req, res) => {
  const submissions = await readJson(SUBMISSIONS_FILE, []);
  const entry = submissions.find((s) => s.id === req.params.id);
  if (!entry) return res.status(404).json({ error: "Not found." });
  entry.votes += 1;
  await writeJson(SUBMISSIONS_FILE, submissions);
  await bumpStat("votes");
  res.json({ ok: true, votes: entry.votes });
});

// Load starter content ONLY when the community store is empty. Because free-tier hosts
// have ephemeral disks, this re-runs after a restart so the shared link is never an empty
// room. Seeded rows carry `seed: true` so the UI can badge them as examples, not truth.
async function seedIfEmpty() {
  const seed = await readJson(SEED_FILE, null);
  const existing = await readJson(SUBMISSIONS_FILE, []);
  if (!seed || !Array.isArray(seed.submissions) || existing.length) return;
  const base = Date.now();
  const rows = seed.submissions.map((s, i) => ({
    id: "seed-" + i,
    trackTitle: (s.trackTitle || "").slice(0, 200),
    artistGuess: (s.artistGuess || "").slice(0, 200),
    sourceUrl: (s.sourceUrl || "").slice(0, 500),
    notes: (s.notes || "").slice(0, 500),
    votes: s.votes || 0,
    seed: true,
    submittedAt: new Date(base - i * 3_600_000).toISOString(),
  }));
  await writeJson(SUBMISSIONS_FILE, rows);
  console.log(`Seeded ${rows.length} example community IDs.`);
}

seedIfEmpty().finally(() => {
  app.listen(PORT, () => {
    console.log(`Crate uploader running on http://localhost:${PORT}`);
    console.log(`Fingerprint API: ${AUDD_TOKEN ? "configured (live)" : "demo mode (set AUDD_API_TOKEN to enable)"}`);
  });
});
