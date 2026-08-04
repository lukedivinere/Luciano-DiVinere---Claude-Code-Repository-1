# Crate — house-music track ID (Phase 0)

A Shazam-style track finder built for house heads, with the thing Shazam can't do:
**name the unreleased tracks** that only live in DJ sets and SoundCloud rips.

This repo is at **Phase 0** — a cheap demand test. Before building an iPhone app, we
want to learn one thing: *will people actually contribute unreleased IDs?* This web
uploader exists to measure that.

See [`VALIDATION.md`](./VALIDATION.md) for the full feasibility read (competitors, API
costs, legal exposure, AI-feature realism, and the phased roadmap).

## What it does

A tap-to-listen screen (like Shazam, house-centered) that fans one clip out across
multiple sources instead of a single database.

1. **Tap to ID / Auto-ID** — record from the mic once, or toggle Auto-ID to keep
   listening on a loop (like Auto Shazam). Audio is sent for matching and **never stored
   on the server**.
2. **Multi-source pipeline** — each clip runs through several *adapters* (see
   `pipeline.js`): fingerprint (AudD), 1001Tracklists-style set indexes, SoundCloud, and
   Instagram drops. The highest-confidence real match becomes the "best guess".
3. **My IDs (on-device history)** — every clip you ID is saved in IndexedDB **on your
   device only**, with the recording, so you can replay it. Flag a track **"watch for
   release"** — the hook for a later "you ID'd this months ago, it drops this weekend"
   notification.
4. **Instagram ID drops** — submit an Instagram post/reel URL + the unreleased IDs it
   contains. We store the **link + metadata only, never the audio**, and it surfaces in
   the pipeline. This is the *legal* alternative to scraping: opt-in by whoever posts.
5. **Name an unreleased track** — the community layer. Submit an ID + a source link, and
   upvote others'. Engagement here is the Phase-0 signal we care about.

## Non-negotiable design rules (why the code is shaped this way)

- **Never host audio on the server.** Uploads live in memory only; community entries and
  IG drops store metadata + an outbound link. Unreleased music is copyrighted — we send
  people to the artist's own page, never redistribute files. (See VALIDATION.md §5.)
- **Personal recordings stay on the user's device** (IndexedDB), never uploaded — the
  private-history vs. public-catalog line is what keeps this legal.
- **We do not scrape Instagram.** IG drops are opt-in submissions by URL. Real automated
  harvesting would need the official Graph API with artist consent (roadmap).
- **AI/similarity output is always a "guess," never a fact.** Instagram catalog entries
  are shown as *context* and can never win the "best guess".

## Deploy (public link for the demand test)

The repo is deploy-ready via a Render Blueprint (`render.yaml`). To get a public URL:

1. Go to **[render.com](https://render.com)** and sign in with GitHub (free).
2. **New → Blueprint**, pick this repo, click **Apply**.
3. Render reads `render.yaml`, builds, and gives you a public `https://…onrender.com` URL.

Notes for the test:
- **HTTPS matters** — the mic (tap-to-ID) only works on a secure origin, so the deployed
  version is more functional than local.
- **Free tier sleeps** after inactivity (~50s cold start on first hit) — fine for a Discord test.
- **Storage is ephemeral** — community submissions/IG drops reset on redeploy. Fine for a
  short demand test; swap in a real DB before anything durable.
- To turn on live matching later, add an `AUDD_API_TOKEN` in the Render dashboard (no redeploy
  needed for the env var beyond a restart).

## Run it locally

```bash
npm install
npm start           # http://localhost:3000
```

By default it runs in **demo mode** — no fingerprint match, which exercises the community
flow (the interesting part). To enable live released-track matching, get an
[AudD](https://audd.io/) token and set it:

```bash
AUDD_API_TOKEN=your_token npm start
```

## How it's built

- **Node/Express** single server (`server.js`), no framework on the front end
  (`public/`). Deliberately minimal — this is a throwaway demand test, not the product.
- **Storage:** flat JSON files under `data/` (gitignored). Swap for a real DB at Phase 1.
- **Fingerprinting:** rented via AudD, not built. Cheap as-you-go pricing means a launch
  costs single-digit dollars.

## API

| Method | Route | Purpose |
|---|---|---|
| `GET`  | `/api/config` | Whether the fingerprint API is configured (live vs demo). |
| `POST` | `/api/identify` | multipart `clip` → full pipeline result (`{best, sources}`). Audio not persisted. |
| `POST` | `/api/submit` | JSON `{trackTitle, artistGuess, sourceUrl, notes}` → new community ID. |
| `GET`  | `/api/submissions` | Recent community IDs. |
| `POST` | `/api/submissions/:id/vote` | Upvote an ID. |
| `POST` | `/api/ig-drops` | JSON `{url, artist, trackTitle, note}` → new Instagram ID drop (URL validated). |
| `GET`  | `/api/ig-drops` | Recent Instagram ID drops. |
| `POST` | `/api/catalog/enroll` | JSON `{hashes, artist, title, sourceUrl, notes}` → enroll an unreleased track by fingerprint (audio never sent). |
| `GET`  | `/api/catalog` | Tracks enrolled in the unreleased catalog. |
| `GET`  | `/api/stats` | Demand counters: clips tried, IDs added, upvotes, IG drops. |

## Code map

- `server.js` — Express app + routes.
- `pipeline.js` — the multi-source recognition engine (one adapter per source).
- `instagram.js` — Instagram drop ingestion (URL validation + metadata store).
- `catalog.js` — Crate's own unreleased-track catalog: enroll + match by fingerprint.
- `public/fingerprint.js` — landmark audio fingerprinting (Shazam-style); runs in the
  browser (on-device) and the server (matching). Tested by `test-fp.mjs` (`node test-fp.mjs`).
- `public/` — the front end: tap-to-ID, auto-loop, on-device history, enroll, drops, community.

## What Phase 0 is measuring

The `/api/stats` counters. If people upload clips but never contribute IDs, the
community moat isn't real and the whole concept needs a rethink *before* any app is
built. If they do contribute — that's the green light for Phase 1.
