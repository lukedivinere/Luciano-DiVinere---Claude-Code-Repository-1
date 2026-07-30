# Crate — house-music track ID (Phase 0)

A Shazam-style track finder built for house heads, with the thing Shazam can't do:
**name the unreleased tracks** that only live in DJ sets and SoundCloud rips.

This repo is at **Phase 0** — a cheap demand test. Before building an iPhone app, we
want to learn one thing: *will people actually contribute unreleased IDs?* This web
uploader exists to measure that.

See [`VALIDATION.md`](./VALIDATION.md) for the full feasibility read (competitors, API
costs, legal exposure, AI-feature realism, and the phased roadmap).

## What it does

1. **Identify a clip** — upload a short audio clip; it's matched against released tracks
   via a fingerprint API. Audio is used transiently and **never stored**.
2. **Name an unreleased track** — the community layer. Submit an ID + a link out to the
   source (SoundCloud, a set). We store **metadata and the link only — never the audio**.
3. **Upvote** — confirm others' IDs. Engagement here is the Phase-0 signal we care about.

## Non-negotiable design rules (why the code is shaped this way)

- **Never host audio.** Uploads live in memory only; community entries store metadata +
  an outbound link. Unreleased music is copyrighted — we send people to the artist's own
  page, never redistribute files. (See VALIDATION.md §5.)
- **AI/similarity output is always a "guess," never a fact.**

## Run it

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
| `POST` | `/api/identify` | multipart `clip` → match result. Audio not persisted. |
| `POST` | `/api/submit` | JSON `{trackTitle, artistGuess, sourceUrl, notes}` → new community ID. |
| `GET`  | `/api/submissions` | Recent community IDs. |
| `POST` | `/api/submissions/:id/vote` | Upvote an ID. |
| `GET`  | `/api/stats` | Demand counters: clips tried, IDs added, upvotes. |

## What Phase 0 is measuring

The `/api/stats` counters. If people upload clips but never contribute IDs, the
community moat isn't real and the whole concept needs a rethink *before* any app is
built. If they do contribute — that's the green light for Phase 1.
