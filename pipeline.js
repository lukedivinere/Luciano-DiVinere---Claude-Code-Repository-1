// Recognition pipeline — the "run what you heard through everything" engine.
//
// The idea: one clip goes in, and we fan it out across several sources instead of a
// single fingerprint database. Each source is an *adapter* with the same shape, so a
// real scraper/API can replace a stub without touching the rest of the app.
//
// Sources:
//   - fingerprint  : exact-match released tracks (AudD). LIVE when AUDD_API_TOKEN is set.
//   - tracklists   : 1001Tracklists-style set indexes (where unreleased IDs get named).
//   - soundcloud   : SoundCloud rips / official unreleased uploads.
//   - instagram    : short clips DJs post that fans ID in the comments.
//
// IMPORTANT: only `fingerprint` is a live integration here. The scraping adapters return
// clearly-labelled *demo* candidates so the full result UX is visible end-to-end. Real
// Instagram/1001Tracklists/SoundCloud harvesting needs dedicated services and carries
// ToS/legal constraints (see VALIDATION.md) — those adapters are where that work lands.
//
// Audio is passed through transiently and never persisted.

import { recentDrops } from "./instagram.js";

const AUDD_TOKEN = process.env.AUDD_API_TOKEN || "";

// --- adapter: fingerprint (AudD) -------------------------------------------

async function sourceFingerprint(buffer, filename) {
  if (!AUDD_TOKEN) {
    return {
      key: "fingerprint",
      label: "Fingerprint match",
      status: "demo",
      note: "Demo mode — set AUDD_API_TOKEN for live released-track matching.",
      candidates: [],
    };
  }

  try {
    const form = new FormData();
    form.append("api_token", AUDD_TOKEN);
    form.append("return", "apple_music,spotify");
    form.append("file", new Blob([buffer]), filename || "clip.audio");

    const resp = await fetch("https://api.audd.io/", { method: "POST", body: form });
    const data = await resp.json();

    if (data.status === "success" && data.result) {
      const r = data.result;
      return {
        key: "fingerprint",
        label: "Fingerprint match",
        status: "match",
        note: "Exact match against released catalog.",
        candidates: [
          {
            title: r.title,
            artist: r.artist,
            confidence: 0.99,
            unreleased: false,
            url: r.spotify?.external_urls?.spotify || r.apple_music?.url || null,
            sourceLabel: "Released catalog",
          },
        ],
      };
    }
    return {
      key: "fingerprint",
      label: "Fingerprint match",
      status: "no_match",
      note: "No released-track match — likely unreleased or an edit.",
      candidates: [],
    };
  } catch (err) {
    return {
      key: "fingerprint",
      label: "Fingerprint match",
      status: "error",
      note: "Fingerprint lookup failed.",
      candidates: [],
    };
  }
}

// --- demo data for the scraping adapters -----------------------------------
// Illustrative only — tagged `demo: true` so the UI can badge it honestly.

const DEMO_POOL = [
  { title: "ID - ID", artist: "Max Styler", url: "https://soundcloud.com/maxstyler", unreleased: true },
  { title: "Untitled Dub", artist: "Chris Stussy", url: "https://soundcloud.com/chrisstussy", unreleased: true },
  { title: "ID (Forthcoming)", artist: "Dom Dolla", url: "https://soundcloud.com/domdolla", unreleased: true },
  { title: "Rework", artist: "John Summit", url: "https://soundcloud.com/johnsummitmusic", unreleased: true },
];

// Deterministic pick so the same clip feels consistent across a session.
function pick(buffer, offset = 0) {
  const seed = (buffer?.length || 7) + offset * 31;
  return DEMO_POOL[seed % DEMO_POOL.length];
}

async function sourceTracklists(buffer) {
  const c = pick(buffer, 1);
  return {
    key: "tracklists",
    label: "1001Tracklists / set indexes",
    status: "demo",
    note: "Illustrative result — live tracklist search not yet connected.",
    candidates: [
      { ...c, confidence: 0.71, sourceLabel: "1001Tracklists", demo: true, url: c.url },
    ],
  };
}

async function sourceSoundcloud(buffer) {
  const c = pick(buffer, 2);
  return {
    key: "soundcloud",
    label: "SoundCloud",
    status: "demo",
    note: "Illustrative result — live SoundCloud search not yet connected.",
    candidates: [
      { ...c, confidence: 0.64, sourceLabel: "SoundCloud upload", demo: true },
    ],
  };
}

async function sourceInstagram() {
  // We surface unreleased IDs submitted from Instagram posts. These are catalog
  // *context*, not audio matches to this clip — matching them needs the reel audio
  // fingerprinted (roadmap). They're flagged `context` so they can't win best-guess.
  const drops = await recentDrops(4);
  if (!drops.length) {
    return {
      key: "instagram",
      label: "Instagram drops",
      status: "pending",
      note: "No IG drops yet. Submit an artist's unreleased-ID post and it shows up here.",
      candidates: [],
    };
  }
  return {
    key: "instagram",
    label: "Instagram drops",
    status: "catalog",
    note: "Recent unreleased IDs submitted from Instagram. Audio-matching to your clip is on the roadmap (needs the reel fingerprinted) — shown here as context.",
    candidates: drops.map((d) => ({
      title: d.trackTitle || "Untitled ID",
      artist: d.artist || "unknown",
      confidence: 0,
      unreleased: true,
      context: true,
      url: d.url,
      sourceLabel: "Instagram",
    })),
  };
}

// --- orchestration ----------------------------------------------------------

export async function runPipeline(buffer, filename) {
  const sources = await Promise.all([
    sourceFingerprint(buffer, filename),
    sourceTracklists(buffer),
    sourceSoundcloud(buffer),
    sourceInstagram(),
  ]);

  // Best guess = highest-confidence candidate across all sources.
  // `context` candidates (e.g. IG catalog entries) are never eligible to win.
  let best = null;
  for (const s of sources) {
    for (const c of s.candidates) {
      if (c.context) continue;
      if (!best || c.confidence > best.confidence) {
        best = { ...c, source: s.label };
      }
    }
  }

  return { sources, best };
}
