# Spec 004 — Unreleased-track identification (own catalog)

**Framework:** three-stage build framework. **Gating mode:** soft. This is the core moat:
recognizing tracks that exist in **no public database**.

---

## Stage 1 — System Architect Interview

**The job:** when someone hears an unreleased track (in a set, a clip, a club) and Shazam
gives up, Crate names it. Concretely: "That Jam Is Fresh" by Sydney Charles (on SoundCloud),
or Max Styler's six named-but-unreleased tracks (on Instagram).

**Who does this today:** humans in Discord/1001Tracklists comments. No app does it, because
fingerprint services only match *released* catalogs.

**The core realization:** you cannot fingerprint-match a track that isn't in a database — so
the only way to catch unreleased tracks is to **build the database yourself** from the very
sources where they live (SoundCloud rips, IG clips, artist-supplied files). The "AI" the
user imagined is really *audio fingerprinting against a catalog we assemble*.

**Two engines, different jobs:**
- **Exact catalog match** (built here): recognizes a *specific enrolled* unreleased track.
  Reliable, and exactly right for named tracks like the examples above.
- **Style guess** ("sounds like Max Styler"): audio-embedding similarity for tracks *not*
  enrolled. Fuzzy, a guess — deferred; house music is timbrally uniform so it's noisy.

**Failure cost:** a wrong ID is worse than no ID (propagates, gets screenshotted). So the
matcher must reject coincidences hard — better to say "not in the catalog yet" than to
guess wrong.

**Load-bearing assumptions:**
| Assumption | Status |
|---|---|
| Landmark fingerprinting can recognize an enrolled track from a degraded query | **Verified** in tests (matches noisy/short/quiet excerpts; rejects unrelated) |
| Someone will enroll the unreleased tracks (fans/artists) | Untested — the cold-start question, same as the community layer |
| On-device fingerprinting keeps us clear of hosting audio | Verified by design (only hashes leave the device) |
| Club-recording → clean-file robustness is good enough | **Partly** — v1 proven on same-source degradation; cross-source (loud club vs SoundCloud rip) needs real-world tuning |

---

## Stage 2 — Tech Stack & Scope Spec

### Problem statement
Recognize unreleased tracks that no public fingerprint database contains, without hosting
copyrighted audio, reliably enough that a match can be trusted.

### In scope
- **Self-hosted landmark fingerprint engine** (`public/fingerprint.js`): Shazam-style
  constellation + landmark hashing (Wang 2003). Proven in `test-fp.mjs`.
- **On-device fingerprinting**: the browser decodes and fingerprints; only hashes are sent.
  Raw audio never reaches the server — legally clean.
- **Enroll flow**: submit an unreleased track's audio + metadata → fingerprinted in-browser
  → stored as an inverted hash index (`catalog.js`). Audio discarded.
- **Match**: every identify also fingerprints the clip and matches it against the catalog as
  a pipeline source (`Crate catalog (unreleased)`), which can win the best guess.
- **Discrimination guard**: a match requires a sharp peak-above-background alignment (not a
  raw count), so unrelated audio is rejected.

### Out of scope (for now)
- The **style-guess** embedding model (separate, fuzzy, later).
- **Ingesting SoundCloud/IG audio automatically** — ToS/fragility (same wall as scraping);
  enrollment is by human/artist upload of a clip they have.
- A production vector/hash **database** — Phase 0 uses a JSON index (ephemeral on free tier).
- Cross-device fingerprint dedup, catalog moderation, artist verification.

### Stack
| Layer | Choice | Why | Rejected |
|---|---|---|---|
| Fingerprint algo | Own landmark hashing in JS | Fully ours, no gatekeeper, on-device | AudD custom-catalog needs special access (email api@audd.io) — kept as a future upgrade for robustness |
| Where it runs | Browser (Web Audio decode + FFT) | Free PCM decode; audio stays on device | Server-side decode needs ffmpeg + uploading audio |
| Match index | JSON inverted index | Simple, works now | A real DB — deferred to scale |

### Architecture
```
enroll:  browser: file → decodeAudioData → fingerprintPCM → hashes ─┐
                                                                     ├→ POST /api/catalog/enroll → catalog.json (hash→[track,t] + metadata)
identify: browser: clip → fingerprintPCM → hashes ─→ POST /api/identify (with audio for AudD)
                                                    → pipeline → catalog.match(hashes) → best guess
```

### Failure behavior
| Condition | Behavior |
|---|---|
| Query not in catalog | `no_match` — "enroll it and it'll match next time" |
| Coincidental hash overlap | Rejected by peak/background ratio guard |
| Undecodable clip | Fingerprint skipped; released-track (AudD) path still runs |
| Enrolled clip too short/quiet | Enroll rejected with a clear reason |

### Success criteria
- Enrolled track is re-identified from a noisy, shorter, quieter excerpt. **Met** (tests).
- Unrelated audio returns no match. **Met** (tests).
- No raw audio stored server-side for the catalog. **Met** (hashes only).

### Open risks
- **Real-world robustness** (loud club recording vs clean enrolled file) is the honest v1
  gap — tune peak-picking/thresholds against real recordings; or enable AudD custom catalog
  for their production-grade fingerprinting.
- **Cold start**: worthless until tracks are enrolled — seed with known IDs; artist opt-in
  ("your unreleased track, captured 47 times") is the acquisition pitch.
- **Ephemeral storage** wipes the catalog on redeploy — fine for testing, needs a real DB
  before it matters.
