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
// HONESTY RULE (ground rule #3): a source only returns a candidate when it actually has
// one. `fingerprint` is the one live matcher (when AUDD_API_TOKEN is set). The
// tracklists/soundcloud adapters have no live backend yet, so they report `pending` and
// return NOTHING — they must never fabricate a guess, or the app "identifies" songs it
// never heard. `instagram` surfaces real submitted drops as context only.
//
// Result: with no key, an identify honestly returns "no confident match" and drives the
// community flow. With a key, a real released track matches; an unreleased one honestly
// doesn't (no fingerprinter can ID it — that's what the community layer is for).
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

    // AudD returns {status:"error", error:{...}} for bad token, quota, etc. Don't
    // swallow that as a genuine "no match" — surface it so it's diagnosable.
    if (data.status === "error") {
      console.error("AudD API error:", data.error);
      const msg = data.error?.error_message || "matching service error";
      return {
        key: "fingerprint",
        label: "Fingerprint match",
        status: "error",
        note: `Matching service: ${msg}`,
        candidates: [],
      };
    }

    // Genuine success with no result — the track isn't in the released catalog.
    return {
      key: "fingerprint",
      label: "Fingerprint match",
      status: "no_match",
      note: "No released-track match — likely unreleased or an edit.",
      candidates: [],
    };
  } catch (err) {
    console.error("Fingerprint lookup failed:", err);
    return {
      key: "fingerprint",
      label: "Fingerprint match",
      status: "error",
      note: "Fingerprint lookup failed (couldn't reach the matching service).",
      candidates: [],
    };
  }
}

// --- adapters without a live backend yet -----------------------------------
// These deliberately return NO candidates. Fabricating one would make the app claim to
// identify tracks it can't. When a real integration lands, it produces candidates here.

async function sourceTracklists() {
  return {
    key: "tracklists",
    label: "1001Tracklists / set indexes",
    status: "pending",
    note: "Live tracklist search isn't connected yet.",
    candidates: [],
  };
}

async function sourceSoundcloud() {
  return {
    key: "soundcloud",
    label: "SoundCloud",
    status: "pending",
    note: "Live SoundCloud search isn't connected yet.",
    candidates: [],
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
    sourceTracklists(),
    sourceSoundcloud(),
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
