# Spec 006 — Co-occurrence clustering and demand trajectories

Framework: three-stage build framework. Gating mode: **soft**.

Depends on Spec 001 (dual-path pipeline) and Spec 005 (watching, capture context).

## What is asserted vs what must be measured

This spec states the mechanism with confidence. It deliberately does **not** state numeric
thresholds, because correct thresholds depend on your fingerprinter's score distribution on
your audio, which has not been measured yet. Every threshold below is a named constant to be
calibrated against Stage 0 output. Anyone who hands you specific numbers here is guessing.

---

# Stage 1 — Interview

## The job

Use the fact that multiple people captured the same track at the same moment as a clustering
signal **independent of audio quality**, and expose the resulting demand data over time.

## Why it's worth building

The hardest case in the system is a degraded capture in a loud crowd — audio too poor for the
fingerprinter to match confidently. Co-occurrence attacks that case from a different direction:
your recording was unusable, but eleven other people were pointing phones at the same speaker
in the same ninety seconds, and one of them got a clean capture. Inherit the answer.

It costs almost nothing. Capture timestamp and coarse location are already stored.

## What must never happen

1. **A merge caused by co-occurrence alone.** Two stages at one festival at one minute are two
   different tracks. Co-occurrence raises confidence; it never creates a cluster by itself.
2. **Exposure of co-presence between users.** "You and three others were at this stage" is not
   a feature. It is a privacy incident.
3. **Retention of precise location.** Coarse buckets only, and only for as long as needed.

## Load-bearing assumptions

| Assumption | Status |
|---|---|
| Fingerprint scores separate true from false matches well enough to define a soft threshold | **UNTESTED — Stage 0 measures this** |
| Enough users attend the same events simultaneously for co-occurrence to fire | **UNTESTED — depends entirely on density** |
| Shared confirmed matches reliably identify same-stage sessions | High confidence, but verify on real data |
| Capture context (time, coarse location) is present on all captures | Depends on the Spec 001 addendum being implemented |

Co-occurrence is a **density-dependent feature**. With a hundred users it will almost never
fire. Do not build it expecting early value; build it because it compounds later.

---

# Stage 2 — Spec

## Core problem: you cannot separate festival stages by location

GPS is accurate to roughly 10–50m outdoors, degrades badly in dense crowds, and you are
deliberately rounding it for privacy. Festival stages are often 100–300m apart. **Location alone
cannot tell you which stage someone is at.** Any design that merges on proximity plus time will
produce false merges across stages, and false merges are the expensive error.

## The mechanism: anchor on shared confirmed matches, not on proximity

Location is a **coarse pre-filter**. The actual evidence of a shared session is a **shared
confirmed track**.

If user A and user B both got a confident catalog match on the same released track within a
short window, they are in the same room listening to the same speakers. That is far stronger
evidence than any GPS reading, and it is self-verifying.

So:

```
1. EventBucket  — coarse location grid + time window. Cheap pre-filter, high recall,
                  low precision. Narrows candidates only.

2. SessionAnchor — within a bucket, find captures that share a CONFIRMED match
                  (same track, close in time). Users sharing an anchor are in the
                  same session. This is the evidence.

3. Co-occurrence — unmatched captures from users in the same anchored session,
                  within the window, are candidates for the same unknown track.
```

Without at least one shared anchor, co-occurrence contributes **nothing**. A bucket with no
anchors is not a session; it is a coincidence.

## Confidence model

Two independent scores per candidate pair:

- `fingerprintScore` ∈ [0,1] — audio similarity. Primary.
- `cooccurrenceScore` ∈ [0,1] — session-based support. Supporting only.

Merge rule:

```
MERGE if fingerprintScore >= T_HARD
   OR (fingerprintScore >= T_SOFT AND cooccurrenceScore >= C_MIN)

NEVER MERGE if fingerprintScore < T_SOFT, regardless of cooccurrenceScore.
```

`T_SOFT` must be strictly greater than zero. This is the rule that prevents stage collisions,
and it is not negotiable — a pair with no audio similarity is not the same track no matter how
many people were standing together.

### Constants to calibrate against Stage 0 data

| Constant | Meaning | How to set it |
|---|---|---|
| `T_HARD` | Fingerprint score sufficient alone | Highest score at which false positives are effectively zero in Stage 0 |
| `T_SOFT` | Floor below which nothing merges | Score below which true matches essentially never appear |
| `C_MIN` | Co-occurrence support required | Tune so co-occurrence-assisted merges show a false-merge rate no worse than fingerprint-only merges |
| `W_SESSION` | Co-occurrence time window | Start near typical track length; widen only if recall is poor |
| `R_BUCKET` | Location pre-filter radius | Generous — it is only a pre-filter. Precision comes from anchors |

Record the measured values and the date measured. Re-calibrate whenever the fingerprinter
changes.

### Computing `cooccurrenceScore`

Count **distinct users**, never captures.

One person hitting capture eleven times in a minute is one observation, not eleven. Deduplicate
by user before scoring, or a single enthusiastic user manufactures false confidence.

Weight contributions by:

- Number of distinct users sharing the session anchor
- Strength of the anchor (a confident catalog match anchors more strongly than a weak one)
- Temporal tightness — captures 10 seconds apart support each other more than 90 seconds apart

Cap the score. Twenty users should not produce arbitrarily more confidence than eight; the
signal saturates.

### Sybil resistance

A single actor with multiple accounts could manufacture co-occurrence. Mitigations:

- Require minimum account age and prior activity before a user contributes to co-occurrence
- Weight by user history — accounts with confirmed-correct captures count more
- Cap the contribution of accounts sharing a device fingerprint or network

Not urgent at low scale. Design the weighting hook now so it can be turned on later.

## False-merge safeguards

| Safeguard | Behaviour |
|---|---|
| Audit log | Every merge records both scores, the anchor used, and contributing user count |
| Reversibility | No destructive merges. Splitting must restore prior cluster identities exactly |
| Provenance flag | Clusters merged with co-occurrence support are flagged and displayed at lower confidence than fingerprint-only clusters |
| Conflict auto-split | If a later high-confidence fingerprint result contradicts a co-occurrence-assisted merge, split automatically and log it |
| Review queue | Merges near `C_MIN` queue for human review rather than applying silently |
| Kill switch | Co-occurrence can be disabled by config without redeploying, and disabling it must not corrupt existing clusters |

## Privacy — the section that carries real legal risk

Timestamp plus location tied to a user is personal data, and in the EU — which is most of house
music — that means GDPR applies. This is not legal advice; get some before launch.

Requirements:

1. **Store coarse location only.** Bucket to a grid coarse enough that it identifies an event,
   not a person. Never persist raw GPS.
2. **Co-occurrence is computed server-side and never returned to clients.** No endpoint exposes
   which users co-occurred. Not aggregated counts of co-presence, not "others near you."
3. **Public outputs are cluster-level only** — sighting counts, event counts, watch counts.
   Never user-level.
4. **Deletion propagates.** When a user deletes a capture, it is removed from co-occurrence
   computation and any scores derived from it are recomputed. A deletion that leaves the signal
   intact is not a deletion.
5. **Retention limit** on precise-enough-to-correlate data. Once a cluster is established, the
   co-occurrence inputs can be aggregated and the granular records dropped.
6. **Disclose it plainly** in the privacy policy: that captures record approximate location and
   time, and that this is used to group recordings of the same track.

## Demand trajectories

### The correctness trap

**Raw capture counts over time are misleading and will embarrass you in front of a label.** If
your user base triples, every track looks like it is breaking. A trajectory chart that does not
control for platform growth is not a signal, it is a picture of your own growth.

### Metrics, weakest to strongest

| Metric | Value |
|---|---|
| Raw captures | Vanity. Do not lead with it |
| Distinct users | Better — removes repeat-capture inflation |
| **Distinct events** | Strong — a track spreading across venues is real scene movement |
| **Distinct DJs playing it** | Strongest — this is what A&R actually wants to know |
| Share of total captures in period | **Required** — normalises against platform growth |

Report at minimum: distinct events, distinct DJs, and share-of-period. Raw captures may appear
as a secondary line, never as the headline.

### Query shape

Per cluster, per time bucket: distinct users, distinct events, distinct DJs, capture count,
and that period's share of all captures.

Precompute into a rollup table. Do not compute trajectories on read.

### Cold start

Below a threshold of events or users, show the raw counts and **explicitly label the data as
too sparse to indicate a trend.** Do not draw a trend line through four data points. A chart
that overstates its own confidence is exactly the failure this spec exists to prevent.

## Out of scope

- Any machine learning. This is a query over data you already hold; a model would be slower,
  costlier, unexplainable, and no more accurate
- Surfacing co-presence to users in any form
- Predicting release dates
- Cross-referencing against external tracklist databases

## Acceptance criteria

1. Two captures with zero fingerprint similarity never merge, at any co-occurrence score. Test
   directly with `cooccurrenceScore = 1.0`.
2. Co-occurrence contributes nothing without a shared confirmed anchor in the session.
3. One user's repeated captures in a window count as a single observation. Test with 20
   captures from one user.
4. Every merge writes an audit record containing both scores and the anchor.
5. A co-occurrence-assisted merge contradicted by a later high-confidence fingerprint result
   splits automatically, restoring prior cluster identities exactly.
6. No API endpoint returns user-level co-occurrence data. Assert across the whole surface.
7. Deleting a capture removes it from co-occurrence and triggers recomputation of affected
   scores.
8. Trajectory endpoints return distinct-event and distinct-DJ counts and share-of-period, not
   raw counts alone.
9. Below the sparsity threshold, trajectory responses carry an explicit `insufficientData` flag
   and the UI renders the caveat.
10. Disabling co-occurrence by config leaves existing clusters valid and intact.
11. Existing pipeline tests still pass.

## Open risks

1. **Thresholds are uncalibrated.** Until Stage 0 runs, `T_SOFT`, `T_HARD` and `C_MIN` are
   undefined. Shipping with guessed values risks systematic false merges across an entire
   festival — the highest-severity failure available in this system.
2. **Density.** At current scale co-occurrence will rarely fire. Build it, test it, expect
   nothing from it until user density at individual events is meaningful.
3. **Stage collision remains the residual risk.** The anchor mechanism reduces it; it does not
   eliminate it. Monitor false-merge rate at festivals specifically, where multiple stages run
   concurrently.
4. **GDPR exposure** on location-plus-time data tied to users. Needs a lawful basis, a retention
   policy, and a deletion path before any EU launch. Get real legal advice.
