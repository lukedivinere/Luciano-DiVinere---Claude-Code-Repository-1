// Unit tests for metadata.js — cache reuse, rate limiter, fallback chain, label omission.
// Uses a mocked fetch so no network is needed (the sandbox blocks it anyway).
import { rm } from "node:fs/promises";
import { identityKey, makeRateLimiter, enrich } from "./metadata.js";

const CACHE = new URL("./data/metadata_cache.json", import.meta.url);
await rm(CACHE, { force: true });

let pass = true;
const ok = (name, cond) => { pass = pass && cond; console.log(`  ${cond ? "✓" : "✗"} ${name}`); };

// identity key: case/punctuation-insensitive, stable
ok("identityKey normalizes case + punctuation",
  identityKey("Michael Bibi", "Chemicals (Unreleased)") === identityKey("michael  bibi", "chemicals   unreleased"));

// rate limiter: 18/min cap
const rl = makeRateLimiter(18, 60_000);
let allowed = 0;
for (let i = 0; i < 25; i++) if (rl(1_000)) allowed++;      // all "now" = 1000ms
ok("rate limiter caps at 18 in window", allowed === 18);
ok("rate limiter allows again after window", rl(70_000) === true);

// mock fetch that counts calls and answers iTunes/Discogs by URL fragment
function mockFetch(responses) {
  const fn = async (url) => {
    fn.count++;
    for (const [frag, body] of Object.entries(responses)) if (url.includes(frag)) return { json: async () => body };
    return { json: async () => ({}) };
  };
  fn.count = 0;
  return fn;
}

// AudD already has artwork + label → NO fallback fetches
const spy1 = mockFetch({});
const full = await enrich(
  { artist: "Fisher", title: "Losing It", artwork: "https://audd/art.jpg", label: "Catch & Release", releaseDate: "2018", serviceLinks: { spotify: "s" } },
  { fetchImpl: spy1 }
);
ok("no fetch when AudD is complete", spy1.count === 0);
ok("artworkSourcedFrom = audd", full.artworkSourcedFrom === "audd");

// cache reuse → a second enrich of the SAME identity issues zero fetches
const spy2 = mockFetch({});
const cached = await enrich({ artist: "Fisher", title: "Losing It" }, { fetchImpl: spy2 });
ok("second lookup served from cache (0 fetches)", spy2.count === 0 && cached.fromCache === true);

// missing artwork → iTunes fallback fills it (600x600) and adds the itunes link
await rm(CACHE, { force: true });
const spy3 = mockFetch({ "itunes.apple.com": { results: [{ artworkUrl100: "https://itu/100x100bb.jpg", trackViewUrl: "https://itu/buy" }] } });
const enriched = await enrich({ artist: "Someone", title: "Track X" }, { fetchImpl: spy3 });
ok("iTunes fallback fires when artwork missing", enriched.artwork === "https://itu/600x600bb.jpg");
ok("iTunes buy link captured", enriched.serviceLinks?.itunes === "https://itu/buy");

// no label anywhere (no Discogs token) → label stays null (UI omits the line)
ok("label omitted when unavailable", enriched.label == null);

await rm(CACHE, { force: true });
console.log(pass ? "\nMETADATA PASS ✓" : "\nMETADATA FAIL ✗");
process.exit(pass ? 0 : 1);
