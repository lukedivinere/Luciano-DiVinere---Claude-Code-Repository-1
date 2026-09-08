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
import { match as catalogMatch } from "./catalog.js";
import { enrich } from "./metadata.js";

const AUDD_TOKEN = process.env.AUDD_API_TOKEN || "";
let auddDisabled = false; // set true after an auth failure, so we stop burning the free quota

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

  // Guard (point 5): once the token was rejected, stop calling AudD. An invalid token never
  // becomes valid, and each attempt — especially under Auto-ID's loop — can burn the 300
  // free requests. Retrying an auth error is pure waste.
  if (auddDisabled) {
    return {
      key: "fingerprint",
      label: "Fingerprint match",
      status: "error",
      note: "AudD paused for this run — AUDD_API_TOKEN was rejected. Fix the token and restart the service.",
      candidates: [],
    };
  }

  try {
    // Redacted proof (point 2): confirm the token is actually populated at request time —
    // not empty, undefined, or wrapped in quotes. Only first/last 4 chars are logged.
    console.log(
      `AudD request → api_token length ${AUDD_TOKEN.length}, value "${AUDD_TOKEN.slice(0, 4)}…${AUDD_TOKEN.slice(-4)}"; sent as a multipart FORM FIELD to POST https://api.audd.io/`
    );
    const form = new FormData();
    form.append("api_token", AUDD_TOKEN);
    form.append("return", "apple_music,spotify,deezer"); // one call → artwork, label, links
    form.append("file", new Blob([buffer]), filename || "clip.audio");

    const resp = await fetch("https://api.audd.io/", { method: "POST", body: form });
    const data = await resp.json();

    if (data.status === "success" && data.result) {
      const r = data.result;
      const apple = r.apple_music;
      const spotify = r.spotify;
      const deezer = r.deezer;
      // Album art — Apple's URL is a {w}x{h} template; Spotify and Deezer give sized images.
      let artwork = null;
      if (apple?.artwork?.url) artwork = apple.artwork.url.replace("{w}", "500").replace("{h}", "500");
      else if (spotify?.album?.images?.length) artwork = spotify.album.images[0].url;
      else if (deezer?.album?.cover_xl || deezer?.album?.cover_big) artwork = deezer.album.cover_xl || deezer.album.cover_big;

      // Enrich: fill any gaps (artwork via iTunes, label via Discogs) and cache by identity.
      const base = {
        artist: r.artist,
        title: r.title,
        artwork,
        label: r.label || null,
        releaseDate: r.release_date || null,
        serviceLinks: {
          appleMusic: apple?.url || null,
          spotify: spotify?.external_urls?.spotify || null,
          deezer: deezer?.link || null,
        },
      };
      const meta = await enrich(base).catch(() => base); // never let enrichment block a match

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
            url: meta.serviceLinks?.spotify || meta.serviceLinks?.appleMusic || r.song_link || null,
            spotify: meta.serviceLinks?.spotify || null,
            appleMusic: meta.serviceLinks?.appleMusic || null,
            deezer: meta.serviceLinks?.deezer || null,
            itunes: meta.serviceLinks?.itunes || null,
            artwork: meta.artwork || null,
            label: meta.label || null,
            album: r.album || null,
            releaseDate: meta.releaseDate || null,
            sourceLabel: "Released catalog",
          },
        ],
      };
    }

    // AudD returns {status:"error", error:{...}} for bad token, quota, etc. Don't
    // swallow that as a genuine "no match" — surface it so it's diagnosable.
    if (data.status === "error") {
      const code = data.error?.error_code;
      const msg = data.error?.error_message || "matching service error";
      console.error("AudD API error:", code, msg);
      // Stop retrying on AUTH errors specifically (point 5). AudD uses error_code 900 for a
      // bad api_token; match the message too as a fallback. Non-auth errors still surface
      // but don't disable AudD (they may be transient).
      const isAuthError = code === 900 || /api[_ ]?token|authoriz|inactive|incorrect|invalid/i.test(msg);
      if (isAuthError) {
        auddDisabled = true;
        console.error("AudD auth error → pausing AudD for this run to protect the free quota.");
        return {
          key: "fingerprint",
          label: "Fingerprint match",
          status: "error",
          note: `Auth failed — AUDD_API_TOKEN rejected: ${msg}. Paused AudD for this run to protect your quota.`,
          candidates: [],
        };
      }
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

// --- adapter: Crate's own unreleased catalog (self-hosted fingerprints) ----
// The moat: matches the query fingerprint against tracks the community/artists enrolled.
// This is how Crate recognizes UNRELEASED tracks no public database has.
async function sourceCatalog(hashes) {
  if (!Array.isArray(hashes) || !hashes.length) {
    return { key: "catalog", label: "Crate catalog (unreleased)", status: "pending", note: "No fingerprint sent with this clip.", candidates: [] };
  }
  const m = await catalogMatch(hashes);
  if (!m) {
    return { key: "catalog", label: "Crate catalog (unreleased)", status: "no_match", note: "Not in the unreleased catalog yet — enroll it and it'll match next time.", candidates: [] };
  }
  // Map alignment strength to a confidence. A clean match sits well above the ~8 ratio floor.
  const confidence = Math.max(0.55, Math.min(0.98, 0.55 + Math.min(m.ratio, 60) / 140));
  return {
    key: "catalog",
    label: "Crate catalog (unreleased)",
    status: "match",
    note: "Matched a track enrolled in Crate's unreleased catalog.",
    candidates: [{
      title: m.title || "Untitled ID",
      artist: m.artist || "unknown",
      confidence,
      unreleased: true,
      url: m.sourceUrl || null,
      sourceLabel: "Crate catalog",
    }],
  };
}

// --- orchestration ----------------------------------------------------------

export async function runPipeline(buffer, filename, hashes) {
  const sources = await Promise.all([
    sourceFingerprint(buffer, filename),
    sourceCatalog(hashes),
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
