# BRAIN.md — semantic memory layer

Durable, high-signal map of this project's topology and open decisions. Read this first so a
new session starts with a tight map instead of re-deriving it. Update it when a load-bearing
fact or decision changes. Confidence tracks evidence.

---

## Identity
**Crate** — a house/EDM track-ID app ("Shazam for house, including *unreleased* IDs").
Live web prototype: **https://crate-2u8a.onrender.com** (Render, free tier — cold-starts ~50s).
Repo branch of record: `claude/house-music-shazam-app-nmmfhu`.

## THE ANCHOR — two sources of truth diverge (highest-signal fact)
There are two descriptions of this project and they do **not** match:
- **CLAUDE.md (intended target):** Python/FastAPI + Postgres + **Panako** (CQT, pitch-robust) in
  Docker + S3/R2 + Swift iOS. Core mechanic = **clustering unknown fingerprints** into
  "Unknown ID #N, M sightings", named later, retro-resolved. Roadmap = **Stage 0 first**
  (measure matching on +4% pitched/noisy phone audio, >70%) before building.
- **What is actually built (this repo):** Node/Express + flat JSON files + a **self-built JS
  Shazam-style landmark fingerprinter** (`public/fingerprint.js`, NOT pitch-robust) + a web app.
  No Postgres, no Panako, no clustering, no Swift.

**Unresolved decision:** PIVOT (rebuild toward CLAUDE.md stack, clustering-first) vs ADAPT
(keep Node app, rewrite specs to match, build clustering in JS). Recommended tiebreaker:
run **Stage 0** — it produces the numbers (Panako vs AudD vs our JS engine on identical
pitched/noisy clips) that decide it with evidence. Confidence: HIGH that this fork is the
real blocker; building features before resolving it is building on a soft floor.

## CURRENT TOPOLOGY (the bridges) — what actually exists
Entry: `server.js` (Express). Fans one clip across sources in `pipeline.js` → `runPipeline(buffer, filename, hashes)`.
- `pipeline.js` sources: `fingerprint` (AudD, released), `catalog` (our unreleased fingerprint
  DB), `tracklists`/`soundcloud` (pending, return nothing), `instagram` (submitted drops as context).
  Best-guess = highest-confidence non-context candidate; `context` candidates can't win.
- `catalog.js` — enroll/match against our own fingerprint index (`data/catalog.json`).
  Fingerprints computed **on-device** (browser); server stores hashes + metadata, **never audio**.
- `public/fingerprint.js` — ES module, landmark hashing (FFT→peaks→paired hashes) +
  `matchHashes` (peak-above-background alignment). Imported by browser (app.js) AND server
  (catalog.js). Proven by `test-fp.mjs` (`node test-fp.mjs`) on noise/gain/shift-in-time — **but
  NOT pitch-robust by design** (exact FFT bins move under pitch shift).
- `instagram.js` — IG drop ingestion (URL validation + metadata; no scraping).
- `public/app.js` (ES module) + `index.html` + `styles.css` — tap-to-ID, Auto-ID loop, on-device
  history (IndexedDB), enroll screen, IG drops, community naming, notify.
- Data (all gitignored, ephemeral on Render): `submissions/stats/ig_drops/notifications/catalog/misses.json`.

## INVARIANTS / GROUND RULES (do not violate)
- **A guess is always a guess.** Only a catalog match or an artist's own account may read as
  confirmed. Enforced structurally, not by copy.
- **Audio handling** (per specs 001/004): transient match copy (deleted after matching);
  on-device 32kbps *memory copy* (never leaves device); server-side degraded 8kHz *re-index
  fragment* for future re-fingerprinting. NOTE: the re-index fragment is **not built yet**;
  currently the server stores NO audio at all. Earlier "never store any audio" framing was
  stricter than the specs actually intend.
- **Never scrape Instagram / 1001Tracklists / YouTube.** Ingest only via user submission or
  official APIs (Graph, YouTube Data). Same lesson repeats across features.
- **Set context is irreversible** — every capture must record timestamp + coarse location +
  optional "whose set". NOT built yet; cannot be backfilled. Cheap; do early.
- Secrets in env vars only; `.env` gitignored. (No `dotenv` loaded — Render injects env vars.)

## STATUS — built / partial / unbuilt
- **Built & working:** released matching via AudD (when key valid); one-tap parallel pipeline;
  own fingerprint catalog + enroll (on-device); session reconciliation + miss logging;
  cover-art + where-to-find links; mic-input picker + silence detection; community naming feed;
  notify-me capture; IG drop URL submission.
- **Partial vs specs:** community naming lacks the spec-002 provenance/3-tier/dup-collapse design;
  IG ingestion lacks the parser/OCR (see clips-and-feed build prompt); pipeline shape matches
  spec-001 but the unreleased path is enroll-catalog, not unknown-CLUSTERING.
- **Unbuilt (core):** clustering of unknowns + sightings + retroactive resolution (THE moat);
  pitch-robust matching (Panako); set-context capture; re-index fragment; artist portal
  (claim/reveal/suppress); YouTube artist-sets; the spec-004 theme token system.
- **Never run:** Stage 0 validation. The assumption everything rests on is unmeasured.

## DEPLOYMENT / EXTERNAL
- Render service: `srv-d9p1e7942hec73cqahq0`. Public app `crate-2u8a.onrender.com`.
  Env var `AUDD_API_TOKEN` set in Render dashboard (not committed; `render.yaml` declares it `sync:false`).
- **This sandbox's proxy blocks outbound to `onrender.com` and `api.audd.io`** — cannot verify
  the live app or AudD from here; verify via the browser/Render logs.

## KNOWN ISSUE (open)
- **AudD returns auth failure** ("api_token incorrect/invalid/inactive"). Token IS reaching AudD
  (so it's populated) but rejected → either malformed in Render (quotes/whitespace) or the token
  is invalid/inactive. Diagnostics added: redacted token logged at boot + per request; auth
  errors now pause AudD for the run (guard against burning the 300 free requests under Auto-ID).
  Next: read the redacted boot log to tell malformed-value from dud-token.

## SPEC FILES (in `/specs`) and BUILD PROMPTS (in `/prompts`)
- specs: 001 dual-path pipeline · 002 name-suggestion flow · 003 monetization ·
  004 artists/storage/theme · 006 co-occurrence clustering + demand · 007 venue detection + design.
- prompts (build instructions, not specs): build-prompt-template · library-view · artwork-and-metadata.
- **Numbering clash:** `spec-003-agent-sdk-skill.md` and `spec-004-unreleased-id.md` are older
  session artifacts on unrelated topics (a skill; the earlier JS fingerprint design). The
  `agent-sdk` skill is unrelated to Crate and is a candidate for removal/renaming.

## CONVERGENCE (why Stage 0 is now non-optional)
Every recent artifact — library, artwork, spec-006, spec-007 — depends on the SAME unbuilt
foundation: **clustering + Unknown IDs + sightings + capture context**, and on **Stage 0
calibration**. spec-006 states it outright: thresholds (T_SOFT/T_HARD/C_MIN) are undefined
until Stage 0 runs, and "anyone who hands you specific numbers here is guessing." CLAUDE.md
(now the active project memory) mandates Panako + clustering + "Stage 0 first, do not skip
ahead." So the current Node/JS app (no clustering, non-pitch-robust matcher, Stage 0 unrun)
is the soft floor under all of it. **Next action = Stage 0**, which both decides pivot/adapt
and calibrates spec-006.
