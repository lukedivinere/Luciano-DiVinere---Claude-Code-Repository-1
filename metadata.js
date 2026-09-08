// Metadata enrichment for identified (released) tracks — artwork, label, release date,
// service links — cached by track identity so we never re-fetch what we already have.
//
// Source priority (from the artwork/metadata spec): AudD (already in the recognition
// response) → iTunes Search (keyless; artwork + buy link) → Discogs (label; strong on
// electronic/vinyl, needs DISCOGS_TOKEN). Each fallback fires only to fill a gap, then the
// result is cached. `fetchImpl` is injectable so the fallback chain is unit-testable.
//
// NOTE: this sandbox's proxy blocks outbound to iTunes/Discogs/AudD, so live fetches only
// prove out on Render; the cache, rate-limiter, and fallback-order logic are unit-tested
// here with a mocked fetch.

import { readFile, writeFile, mkdir } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const CACHE_FILE = join(__dirname, "data", "metadata_cache.json");

// Normalize artist+title into a stable cache key (case/space/punctuation-insensitive).
export function identityKey(artist, title) {
  const norm = (s) => (s || "").toLowerCase().replace(/[^\p{L}\p{N}]+/gu, " ").trim();
  return `${norm(artist)}—${norm(title)}`;
}

// Sliding-window rate limiter: allow at most `max` calls per `windowMs`. Returns a function
// that returns true if a call is allowed now, false if it should be skipped.
export function makeRateLimiter(max, windowMs) {
  const hits = [];
  return (now = Date.now()) => {
    while (hits.length && now - hits[0] > windowMs) hits.shift();
    if (hits.length >= max) return false;
    hits.push(now);
    return true;
  };
}

// iTunes Search caps at 20 req/min; stay comfortably under.
const itunesAllowed = makeRateLimiter(18, 60_000);

async function readCache() {
  try { return JSON.parse(await readFile(CACHE_FILE, "utf8")); } catch { return {}; }
}
async function writeCache(c) {
  await mkdir(dirname(CACHE_FILE), { recursive: true });
  await writeFile(CACHE_FILE, JSON.stringify(c));
}

async function itunesLookup(artist, title, fetchImpl) {
  if (!itunesAllowed()) return {}; // over budget — skip, never block the result
  const term = encodeURIComponent(`${artist || ""} ${title || ""}`.trim());
  const resp = await fetchImpl(`https://itunes.apple.com/search?term=${term}&entity=song&limit=1`);
  const data = await resp.json();
  const r = data?.results?.[0];
  if (!r) return {};
  return {
    artwork: (r.artworkUrl100 || "").replace("100x100", "600x600") || null, // 600 for 3x rows
    itunes: r.trackViewUrl || null,
  };
}

async function discogsLookup(artist, title, fetchImpl) {
  const token = process.env.DISCOGS_TOKEN;
  if (!token) return {}; // no token configured — skip gracefully
  const q = encodeURIComponent(`${artist || ""} ${title || ""}`.trim());
  const resp = await fetchImpl(
    `https://api.discogs.com/database/search?q=${q}&type=release&per_page=1&token=${token}`,
    { headers: { "User-Agent": "Crate/0.1 (+https://crate)" } }
  );
  const data = await resp.json();
  return { label: data?.results?.[0]?.label?.[0] || null };
}

// Fill gaps in a base metadata object (from AudD) via cache → iTunes → Discogs.
// base: { artist, title, artwork?, label?, releaseDate?, serviceLinks? }
export async function enrich(base, { fetchImpl = fetch } = {}) {
  const key = identityKey(base.artist, base.title);
  const cache = await readCache();
  if (cache[key]) return { ...base, ...cache[key], fromCache: true }; // never re-fetch

  const out = { ...base, artworkSourcedFrom: base.artwork ? "audd" : null };

  if (!out.artwork) {
    const it = await itunesLookup(base.artist, base.title, fetchImpl).catch(() => ({}));
    if (it.artwork) { out.artwork = it.artwork; out.artworkSourcedFrom = "itunes"; }
    if (it.itunes) out.serviceLinks = { ...(out.serviceLinks || {}), itunes: it.itunes };
  }
  if (!out.label) {
    const dg = await discogsLookup(base.artist, base.title, fetchImpl).catch(() => ({}));
    if (dg.label) out.label = dg.label;
  }
  out.metadataFetchedAt = new Date().toISOString();

  cache[key] = {
    artwork: out.artwork ?? null,
    artworkSourcedFrom: out.artworkSourcedFrom ?? null,
    label: out.label ?? null,
    releaseDate: out.releaseDate ?? null,
    serviceLinks: out.serviceLinks ?? null,
    metadataFetchedAt: out.metadataFetchedAt,
  };
  await writeCache(cache);
  return out;
}
