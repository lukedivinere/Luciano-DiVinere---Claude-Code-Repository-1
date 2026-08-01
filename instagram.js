// Instagram ingestion — the *legal* version of "scrape IG for unreleased IDs".
//
// We do NOT scrape Instagram. Meta's ToS prohibits it and it's legally fragile. Instead
// this module ingests Instagram posts that a person (a fan, or the artist) explicitly
// submits by URL, and stores ONLY the link + the track metadata they name — never audio,
// never a re-hosted copy of the post.
//
// Roadmap this is a stepping stone toward:
//   - Artist opt-in via the official Instagram Graph API (their drops flow in on consent).
//   - Fingerprinting the reel's audio (from a clip the submitter provides) so an IG drop
//     becomes matchable by the Shazam-style flow. That closes the loop.
//
// For now: a submitted-URL catalog of unreleased IDs, with everything pointing back to
// the original Instagram post.

import { readFile, writeFile, mkdir } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const DROPS_FILE = join(__dirname, "data", "ig_drops.json");

// Accept only real Instagram post/reel URLs. Returns the shortcode or null.
export function parseInstagramUrl(url) {
  if (typeof url !== "string") return null;
  const m = url.match(/instagram\.com\/(?:p|reel|reels|tv)\/([A-Za-z0-9_-]+)/i);
  return m ? m[1] : null;
}

async function readDrops() {
  try {
    return JSON.parse(await readFile(DROPS_FILE, "utf8"));
  } catch {
    return [];
  }
}

async function writeDrops(drops) {
  await mkdir(dirname(DROPS_FILE), { recursive: true });
  await writeFile(DROPS_FILE, JSON.stringify(drops, null, 2));
}

// Save a submitted IG drop. Metadata + link only.
export async function addDrop({ url, artist, trackTitle, note }) {
  const shortcode = parseInstagramUrl(url);
  if (!shortcode) {
    return { error: "That doesn't look like an Instagram post/reel URL." };
  }
  if (!artist && !trackTitle) {
    return { error: "Name at least the artist or the track." };
  }

  const drops = await readDrops();
  const entry = {
    id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
    shortcode,
    url: url.trim().slice(0, 500),
    artist: (artist || "").slice(0, 200).trim(),
    trackTitle: (trackTitle || "").slice(0, 200).trim(),
    note: (note || "").slice(0, 400).trim(),
    fingerprinted: false, // becomes true once we ingest the reel's audio (roadmap)
    submittedAt: new Date().toISOString(),
  };
  drops.unshift(entry);
  await writeDrops(drops.slice(0, 500));
  return { ok: true, entry };
}

export async function listDrops() {
  return readDrops();
}

// Recent drops, for the pipeline's Instagram adapter to surface as context.
export async function recentDrops(limit = 4) {
  return (await readDrops()).slice(0, limit);
}
