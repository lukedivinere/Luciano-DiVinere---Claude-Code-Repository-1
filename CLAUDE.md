# CLAUDE.md — Track ID app for house / EDM

> Drop this file at the root of the project. Claude Code reads it automatically at the
> start of every session. Keep it updated as decisions change — it is the project's memory.

---

## What this is

A mobile app that identifies house and EDM tracks played in DJ sets, **including unreleased
ones**. Think Shazam, but built for the specific failure mode Shazam has in a club.

There is also an artist side: producers get accounts, can claim tracks, control when an
unreleased ID is revealed, and promote upcoming releases.

## The core insight — read this before designing anything

Shazam matches a recording against a reference database of released tracks. **An unreleased
track has no reference recording.** There is nothing to match against, and no amount of
better AI changes that. This is a property of the problem, not a limitation of the tech.

So this app does something structurally different: it **clusters**.

1. A user records 30 seconds of an unknown track at a festival.
2. The system can't name it — but it stores a fingerprint.
3. Three weeks later, someone records the same track in Ibiza.
4. The system recognizes *those two recordings are the same song* and merges them into one
   cluster: "Unknown ID #4471", now with 2 sightings.
5. The community discusses it. Eventually someone who knows — often the producer — names it.
6. Every recording in that cluster, **past and future**, inherits the name retroactively.

The database of unknowns is the moat. It is proprietary, it compounds with every use, and a
competitor cannot copy it without also having the users. Protect this. When a feature
decision is ambiguous, favor whatever grows and improves the cluster database.

## The four hard problems, ranked

1. **Pitch and tempo shift.** DJs play tracks +2% to +8%, sometimes more. Classic
   Shazam-style constellation fingerprinting is *not* pitch-invariant — shift a track and the
   fingerprint stops matching. This is the technical crux of the entire product.
2. **Blended audio.** It's a DJ set. Many recordings capture two tracks layered mid-transition.
   The matcher must survive that and ideally return both.
3. **Cold start.** A cluster database with zero entries identifies nothing. The first
   thousand users get a product that shrugs at them. Seeding is a design problem, not a
   launch detail.
4. **False merges.** Wrongly fusing two clusters corrupts data permanently and is very hard
   to unwind. Merge conservatively. Human review at the confidence boundary.

## Key technical decision: don't invent it, don't buy it — use the research code

Problem #1 is solved, in open source, by academic work aimed at almost exactly this use case:

- **Panako** — uses key points in a **Constant-Q spectrogram**, so it is robust to
  pitch-shifting, time-stretching and speed change of **up to ~10%**. The authors explicitly
  list DJ-set analysis as a use case. Java. This is the primary candidate.
- **Olaf** — same author, landmark-based, lightweight, runs on embedded/browser. Faster but
  not pitch-robust in the same way. Useful for on-device pre-filtering later.

Panako is a *matcher*, not a *clusterer*. It answers "does this clip match something in my
index?" The clustering layer — deciding when two unknowns are the same track, maintaining
cluster identity, handling merges and splits — **is ours to build.** That layer is the
product. It is also considerably more tractable than reinventing pitch-robust fingerprinting.

For **released** tracks, license a commercial catalog matcher (ACRCloud is the standard,
~100M tracks) rather than building. Buy the commodity, own the moat.

## Released-track matching (the Shazam feature) — and why it runs in parallel

The app must also identify **released** tracks. This is the solved half: license it, don't
build it.

- **AudD** — cheap, fast to integrate, fine for prototype and early users. Start here.
- **ACRCloud** — ~100M track catalog, industry standard, more setup. Move here at scale.
- Shazam itself has no usable public API. Not an option.

### The critical design rule: one tap, two paths, run simultaneously

Do **not** build this as a separate feature or a mode the user selects. The user does not
know whether the track they're hearing is released — *that is why they are asking.* Making
them choose is asking them to answer the question they opened the app with.

Correct architecture — a single clip fans out to both paths at once:

```
                 ┌─→ Catalog matcher (AudD/ACRCloud) ─→ hit? → named track, done
   one recording ─┤
                 └─→ Panako index (unknowns)        ─→ hit? → existing cluster + sightings
                                                     miss? → NEW cluster, seeded by this clip
```

Whichever path returns wins. If both miss, the clip **still becomes a new unknown cluster.**

### Why this makes the two features feed each other

This is the part worth understanding, because it's where the product compounds:

**Every catalog miss is moat material.** When AudD shrugs at a clip, that is not a failure —
that is precisely the signal that you've captured something unreleased, which is exactly what
you exist to catalog. The Shazam feature's failures are the unknown-clustering feature's raw
input. A competitor running only a catalog matcher throws that data away. You keep it.

**Retroactive resolution comes free.** Periodically re-run unnamed clusters against the
catalog matcher. When an unreleased ID finally drops commercially, that re-check suddenly
matches — the cluster auto-resolves, and you notify every user who ever recorded it.

That is the *"you ID'd this at a festival eight months ago, it's out Friday"* moment already
on the roadmap. It is not a separate feature to build later. It falls directly out of running
both paths on the same clip and keeping the misses. Design for it now.

### Expectation-setting

Catalog matchers underperform in clubs regardless of vendor — heavy EQ, crowd noise, PA
distortion, pitch shift, and blended transitions all hurt. Do not assume Shazam-grade hit
rates. Measure it in Stage 0 alongside the Panako testing, on the same recordings, so you
know the real number before users find it for you.

## Stack

Chosen for a first-time builder working with Claude Code. Boring on purpose.

| Layer | Choice | Why |
|---|---|---|
| Backend | **Python + FastAPI** | Most readable language to learn in; huge audio ecosystem |
| Database | **Postgres** | Clusters, sightings, users, votes. Relational fits this well |
| Fingerprint service | **Panako in Docker** | Java, wrapped as a small HTTP service the Python app calls |
| Clip storage | S3-compatible (Cloudflare R2 / Backblaze) | Cheap audio blob storage |
| Hosting | **Railway** or **Render** | Deploy from git, managed Postgres, no devops rabbit hole |
| Auth | **Clerk** or **Supabase Auth** | Never hand-roll auth. Never |
| iOS app | **Swift + SwiftUI**, AVAudioEngine for capture | Native mic access is the one thing that must not be janky |

**Do not** start with a microservice architecture, Kubernetes, GraphQL, or a custom ML
training pipeline. One Python service, one database, one fingerprint container.

## Staged roadmap

Each stage exists to **retire the biggest remaining risk** as cheaply as possible. Do not
skip ahead. Do not start Stage 2 before Stage 1 demonstrably works.

### Stage 0 — Does the matching work at all? (no app, no accounts, no UI)

A command-line script on a laptop.

- Take 10 house tracks you own.
- Index them with Panako.
- Play them through a speaker, record on a phone in a room with noise, pitched +4%.
- Ask Panako to identify the recordings. Measure how many it gets right.

**This is the single most important step in the project.** If pitch-shifted, noisy,
phone-captured audio does not match reliably, the product does not work, and you learn it in
week two rather than month eight. Everything downstream assumes this succeeds.

Success criterion: >70% correct identification on +4% pitched, moderately noisy recordings.

### Stage 1 — Does clustering work? (still no app)

- Gather 50–100 recordings of *unknown* tracks (your own phone, friends, festival clips).
- Build the clustering logic: fingerprint each, compare pairwise, group matches.
- Manually check the groupings. Count false merges and missed merges.

Success criterion: clusters are mostly correct, and false merges are rare (they're the
expensive error).

### Stage 2 — Thinnest possible real app

- FastAPI backend: `POST /clip` (upload + fingerprint + cluster), `GET /cluster/{id}`.
- iOS app: one button, records 30s, uploads, shows "Unknown ID #4471 — 3 sightings" or a name.
- Community naming: suggest a name, vote on suggestions.
- ACRCloud integration so released tracks return an actual title.

### Stage 3 — Artists

- Artist accounts with verification.
- Claim a cluster, name it, set reveal date, or **suppress** it.

### Stage 4 — Growth

- Sighting maps, festival pages, "IDs from this set", notifications on reveal.

## Why the artist portal is a legal shield, not a feature

Unreleased IDs are contested ground. Some producers love the hype — the mystery *is* the
marketing. Others treat a circulating unreleased track as a leak that torched an exclusive
or a label deal. An app that indexes unreleased music without asking will meet lawyers.

Artist accounts with **claim / reveal / suppress** controls flip the posture: this is not a
leak site, it is where artists control the reveal. That is simultaneously the legal defense,
the differentiator, and probably the best growth loop. Design it in early; do not bolt it on.

Also settle before launch: audio clips are user recordings of copyrighted works. Store clips
as short, low-bitrate fragments used for matching, never as downloadable or streamable audio.
Get real legal advice before public launch — nothing here is legal advice.

## Prior art — study before building

- **1001Tracklists** — the incumbent community tracklist database.
- **setlist.id / Mixprism / trakd** — mix-analysis tools built on ACRCloud catalogs.
- **r/trackid, r/EDM** — where IDs actually get solved today, by humans.

All of the automated ones share the same gap: they match against commercial catalogs, so
unreleased tracks come back empty. That gap is the opening. It is also worth knowing that
some of them are moving toward this space — check what they currently ship before committing.

## Conventions

- Python: type hints on function signatures, `ruff` for linting, `pytest` for tests.
- Every audio-processing function gets a test with a real audio fixture. Audio code fails
  silently and subtly; tests are how you find out.
- Cluster merges are **logged and reversible**. Never destructively merge.
- Secrets in environment variables, never committed. `.env` goes in `.gitignore` on day one.
- Commit often with plain-language messages.

## Working agreements with Claude Code

- Start non-trivial work in **plan mode** (Shift+Tab).
- Explain the *why*, not just the code — the goal is that the owner understands this codebase.
- Prefer boring, well-documented libraries over clever ones.
- When a step assumes something unverified about audio behavior, **say so and test it**
  rather than building on the assumption.

## Glossary

- **ID** — an unidentified track in a DJ set. "Anyone got the ID at 42:00?"
- **Cluster** — a group of recordings believed to be the same track, named or not.
- **Sighting** — one recording of a track at a time and place.
- **Fingerprint** — compact hash of audio content, robust to noise and (with Panako) pitch shift.
- **Reveal** — when an unknown ID gets an official name, ideally by the artist.
