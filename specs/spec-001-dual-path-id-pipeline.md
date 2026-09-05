# Spec 001 — Dual-path ID pipeline

Framework: three-stage build framework. Gating mode: **soft** — all three stages run in
sequence; concerns flagged inline rather than halting.

---

# Stage 1 — System Architect Interview

Answers marked **[known]** are drawn from existing project context. Answers marked **[open]**
need your confirmation; each carries a recommended default so you can accept and move.

## Purpose

**What job does this do, in one sentence?**
[known] Take one audio recording from a club or festival and return the track's identity —
whether it is commercially released or an unreleased ID that exists in no catalog anywhere.

**Who has this problem, and what do they do today?**
[known] House and EDM listeners. Today: Shazam (fails on unreleased and on blended mixes),
begging in Discord and Reddit, 1001Tracklists comment threads. The workflow is fragmented
across four places and mostly fails.

**How will we know it worked?**
[open] Recommended: **identified-rate on real club recordings**, split by path — catalog hits
and cluster hits reported separately. A single blended "success rate" would hide the fact that
catalog matching is bought and cluster matching is the actual product. Track them apart or
you'll congratulate yourself for AudD's work.

## Boundaries

**Explicitly not in this unit of work:** artist accounts, reveal/suppress controls, release
notifications, Instagram ingestion, social features. Those consume the pipeline's output;
they aren't the pipeline.

**Smallest version that still tests the core idea:** one clip in, two paths run, four outcome
states out, unknowns persisted as clusters. No accounts required to record.

## Data

**In:** ~15–30s of mono audio from a phone mic, in a loud room, likely pitch-shifted +2–8%,
possibly containing two tracks mid-transition.

**Stored:** fingerprint vectors, cluster membership, sighting metadata (timestamp, coarse
location, optional venue/set), community name suggestions and votes.

**Discarded:** the full-quality recording, server-side. Personal copies stay on device.

**⚠ Conflict flagged — this one matters.** The existing ground rule "never host audio on the
server" is legally sound but forecloses re-indexing. If the fingerprint algorithm changes —
and it will, nobody gets pitch-robust clustering right first try — every historical clip
becomes unmatchable and the accumulated database is dead weight.

Recommended resolution: retain a **degraded re-index fragment** — mono, ~8kHz, band-limited,
heavily compressed, never served to any client, never playable as music. Enough to
re-fingerprint, useless as a recording. Decide now; it cannot be retrofitted onto clips you
already discarded.

## Failure

**When the catalog path returns nothing:** that is not an error state. It is the signal the
product exists to capture. The clip becomes a new unknown cluster. The UI must treat this as
a *success with a different shape*, not a failure.

**Which failure is more expensive — wrong answer or no answer?**
A wrong answer, decisively. A confident wrong ID destroys trust in a community that will
fact-check you instantly, and a false cluster merge corrupts data permanently and is very
hard to unwind. "No match yet" costs nothing.

**What must never happen:** a guess presented as a confirmation. Already a ground rule; the
pipeline must enforce it structurally, not by convention.

## Constraints

- Cost: per-query catalog API charges. Budget matters at scale; cache aggressively by
  fingerprint so repeat clips of the same track don't re-bill.
- Latency: target under ~8s. People are standing in a crowd holding a phone up.
- Skill: built by someone new to coding, working with an AI assistant. Every choice must be
  maintainable by one person who is still learning.

## Assumptions — the load-bearing list

| Assumption | Status |
|---|---|
| Pitch-robust fingerprinting works on noisy phone audio at +4% | **UNTESTED — highest risk in the project** |
| Catalog matchers achieve usable hit rates on club recordings | **UNTESTED** |
| Clustering can group unknowns without frequent false merges | **UNTESTED** |
| Users will contribute names to unknown clusters | Untested (demand question, not technical) |
| Panako handles ±10% pitch/time modification | Verified — documented capability |

The first three are all retired by one evening of Stage 0 testing. Nothing in this spec
should be built before that evening happens.

---

# Stage 2 — Tech Stack & Scope Spec

## Problem statement

A listener hears a track in a DJ set and cannot find out what it is. Existing tools answer
only when the track is commercially released and cleanly mixed — which excludes the majority
of what makes a house set interesting. The listener does not know in advance which category
the track falls into, so any solution that requires them to choose a mode has already failed.

## In scope

- Single capture action producing one clip, fanned out to both paths concurrently
- Catalog matching via a licensed provider
- Unknown-track fingerprinting and clustering via Panako
- Cluster persistence: create, match, merge with audit log
- Four resolved outcome states rendered distinctly in UI
- Confidence surfaced explicitly on every result
- Automatic new-cluster creation on double miss
- Periodic re-check of unnamed clusters against the catalog (retroactive resolution)

## Out of scope

- Artist accounts, verification, reveal or suppress controls
- Push notifications on release
- Instagram ingestion and reel fingerprinting
- Separating two blended tracks into distinct results — v1 detects ambiguity and says so
- On-device matching
- Any recommendation, feed, or social graph feature

## Stack

| Layer | Choice | Why | Rejected | Reversible? |
|---|---|---|---|---|
| Catalog matcher | AudD | Cheap, fast to integrate, adequate for validation | ACRCloud — larger catalog, heavier setup; migrate at scale | Yes, cheaply |
| Unknown fingerprint | Panako | CQT-based, robust to ±10% pitch/time, DJ-set analysis is a stated use case | Dejavu, audfprint — neither is pitch-invariant, which is the whole requirement | No — schema and index depend on it |
| Fingerprint runtime | Java service in Docker | Panako is Java; isolate it behind HTTP rather than fighting the JVM in-process | Rewriting Panako in Python — months of work to reproduce a solved thing | Yes |
| API | Python + FastAPI | Readable while learning; strong audio ecosystem | Node — fine, but the audio tooling isn't there | Painful |
| Database | Postgres | Clusters, sightings, votes are relational; needs transactional merges | Mongo — merge integrity is exactly what you want ACID for | No |
| Re-index storage | Degraded fragments in S3-compatible object storage | Preserves the ability to re-fingerprint; not usable as music | Storing nothing — cheaper today, forecloses the moat | **No — irreversible** |
| Hosting | Railway or Render | Deploy from git, managed Postgres, no devops detour | Kubernetes, AWS from scratch — wrong problem to be solving | Yes |

## Architecture

```
   capture ──┬──► catalog matcher ──► hit ──────────────► RELEASED
             │                    └─ miss ─┐
             │                             │
             └──► Panako index ──┬─ hit ───┼──► cluster ─┬─ named ──► KNOWN ID
                                 │         │             └─ unnamed ► UNKNOWN ID
                                 └─ miss ──┴─────────────────────────► FIRST SIGHTING
                                                                       (new cluster)

   background job: unnamed clusters ──► re-check catalog ──► match? ──► auto-resolve
```

Both paths fire on the same clip simultaneously. Neither waits for the other. Catalog hit
wins on conflict, but the clip is still fingerprinted and recorded as a sighting — that data
is free and you will want it.

## Failure behavior

| Condition | Behavior |
|---|---|
| Catalog miss | Not an error. Proceed to cluster path silently. |
| Both miss | Create new cluster. Present as "first sighting" — framed as a discovery. |
| Catalog low confidence | Show as a guess with confidence, never as confirmed. |
| Two tracks detected | Return ambiguous state, invite the user to re-record on a steadier section. |
| Cluster match near threshold | Do **not** auto-merge. Queue for review. False merges are the expensive error. |
| Catalog API down | Degrade to cluster path only. Never block the capture. |
| Fingerprint service down | Queue clip locally, retry. Never lose a capture. |

## Success criteria

- Catalog path: ≥60% correct on real club recordings of released tracks
- Cluster path: ≥70% correct grouping on +4% pitched, noisy recordings of the same track
- False merge rate: <2% of merges
- Median end-to-end latency: <8s
- Zero results presented as confirmed without a passing confidence threshold

## Addendum — "played by" set attribution (feeds Spec 002)

Feature concept: on any resolved track, expand a drawer showing **who has played it** — DJ,
set, venue, date, link to the set.

This is deferred to its own spec, but it **changes Spec 001 right now**, for one reason:

**You cannot reconstruct set context after the fact.** If a capture doesn't record where and
when it happened, that sighting can never join a played-by list. Every clip collected before
this decision is permanently ineligible. Same class of irreversible mistake as the audio
retention question above, and it's cheap to fix today.

**Added to in-scope for Spec 001:** capture-time context on every sighting — timestamp,
coarse location, and an optional user-supplied "whose set is this?" field with venue/event.
Store it whether or not anything consumes it yet.

Three things worth understanding about why this feature is stronger than it looks:

1. **It's mostly free.** You are already storing sightings for clustering. A played-by list is
   the same data, grouped by set instead of by track. The feature is largely a query.

2. **For unreleased IDs, nobody else can show it.** 1001Tracklists indexes published
   tracklists, which by definition rarely contain unidentified tracks. Your users are
   capturing exactly the IDs that never make it into a published tracklist. "Unknown ID #4471
   — played by Frankie Rizardo, Gaska, and Michael Bibi across 6 sets" is a view that
   currently exists nowhere.

3. **It's the artist-acquisition hook.** "Your unreleased track has been captured 47 times
   across 12 sets" is a far more compelling reason for a producer to claim a cluster than any
   pitch you could write. The played-by data sells the artist portal for you.

Also: attribution frequency is a **clustering signal**. If a cluster keeps appearing in one
artist's sets, that's evidence about provenance — useful for surfacing likely-correct name
suggestions, and useful for knowing who to ask.

Constraint carried forward: user-supplied set attribution is unverified data. Treat it as a
claim, not a fact — same confidence discipline as everything else. Scraping tracklist
databases to enrich it is the Instagram lesson repeating itself; don't.

## Open risks

1. The three untested assumptions above. All retired by Stage 0. **Do this first.**
2. Cold start — clustering is worthless until the database has volume. Seeding strategy is
   unsolved and is a real design problem, not a launch detail.
3. Catalog cost curve at scale if fingerprint caching is weak.
4. The re-index fragment decision is irreversible and is being made under legal uncertainty.
   Worth actual legal advice before public launch. Nothing here is legal advice.
