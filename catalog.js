// Crate's own unreleased-track catalog — the moat.
//
// Tracks are enrolled by FINGERPRINT, not audio: the browser fingerprints the clip on
// device (fingerprint.js) and sends only the hashes here. So we store landmark hashes +
// metadata, never the audio itself — legally clean and cheap. A later query (also
// fingerprinted in the browser) is matched against this index, letting Crate recognize
// unreleased tracks that exist in no public database.
//
// Storage is a JSON inverted index (Phase 0). Swap for a real DB before scale — and note
// free-tier disks are ephemeral, so re-enrollment/seed is expected after a restart.

import { readFile, writeFile, mkdir } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { matchHashes } from "./public/fingerprint.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const CATALOG_FILE = join(__dirname, "data", "catalog.json");
const PER_HASH_CAP = 8; // keep at most N occurrences of a hash per track (lean, discriminative)

async function read() {
  try { return JSON.parse(await readFile(CATALOG_FILE, "utf8")); }
  catch { return { tracks: {}, index: {} }; }
}
async function write(db) {
  await mkdir(dirname(CATALOG_FILE), { recursive: true });
  await writeFile(CATALOG_FILE, JSON.stringify(db));
}

// Enroll a fingerprinted track. `hashes` is [{h, t}] computed in the browser.
export async function enroll({ hashes, artist, title, sourceUrl, notes }) {
  if (!Array.isArray(hashes) || hashes.length < 50) {
    return { error: "That clip didn't fingerprint — too short or too quiet. Use a clearer 15s+ sample." };
  }
  if (!artist && !title) return { error: "Name at least the artist or the track." };
  if (sourceUrl && !/^https?:\/\/\S+$/i.test(sourceUrl)) return { error: "Source link must be a valid http(s) URL." };

  const db = await read();
  const trackId = Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
  const counts = {};
  let stored = 0;
  for (const { h, t } of hashes) {
    if ((counts[h] = (counts[h] || 0) + 1) > PER_HASH_CAP) continue;
    (db.index[h] || (db.index[h] = [])).push([trackId, t]);
    stored++;
  }
  db.tracks[trackId] = {
    artist: (artist || "").slice(0, 200).trim(),
    title: (title || "").slice(0, 200).trim(),
    sourceUrl: (sourceUrl || "").slice(0, 500).trim(),
    notes: (notes || "").slice(0, 400).trim(),
    enrolledAt: new Date().toISOString(),
    hashCount: stored,
  };
  await write(db);
  return { ok: true, trackId, hashCount: stored };
}

// Match a query fingerprint against the whole catalog. Returns track meta + score, or null.
export async function match(hashes) {
  if (!Array.isArray(hashes) || !hashes.length) return null;
  const db = await read();
  if (!Object.keys(db.index).length) return null;
  const res = matchHashes(hashes, db.index);
  if (!res) return null;
  const meta = db.tracks[res.trackId];
  if (!meta) return null;
  return { ...meta, trackId: res.trackId, peak: res.peak, ratio: res.ratio };
}

export async function listTracks() {
  const db = await read();
  return Object.entries(db.tracks)
    .map(([id, m]) => ({ id, ...m }))
    .sort((a, b) => b.enrolledAt.localeCompare(a.enrolledAt));
}
