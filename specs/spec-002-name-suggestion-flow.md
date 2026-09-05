# Spec 002 — Name suggestion flow

Framework: three-stage build framework. Gating mode: **soft**.

Depends on Spec 001 (dual-path ID pipeline). Consumes: unnamed clusters. Produces: named
clusters at graded confidence.

---

# Stage 1 — System Architect Interview

## Purpose

**The job, in one sentence:** let the community turn an anonymous fingerprint cluster into a
named track, without letting anyone turn it into a *wrongly* named track.

**Who does this today, and how?** Reddit and Discord threads, 1001Tracklists comments. It
works — the community genuinely has knowledge no algorithm has — but the answer lives in a
comment thread that nobody can query later, and there is no record of who was right.

**How we know it worked:** unnamed clusters resolve to correct names over time, and the
correction rate on resolved names stays low. Volume of suggestions is a vanity metric; a
cluster with 40 suggestions and no consensus is a failure, not engagement.

## The thing this feature actually is

This is quality control on the moat, dressed as a form. A cluster database with wrong names
is worth less than one with no names, because wrong names are confidently acted on and quietly
propagate. Every design decision below follows from that.

## Failure — the important section

**Which failure is more expensive?** A wrong name, by a wide margin. It propagates
retroactively to every sighting in the cluster, gets screenshotted, and enters circulation.
Track ID communities actively fact-check; being confidently wrong once is expensive.

**Adversarial behavior to expect, because it already exists in this scene:**

- Clout guessing — plausible-sounding names offered with no basis
- Deliberate fake IDs — a known phenomenon in EDM communities; people troll ID threads
- Repetition as evidence — the same wrong answer posted enough times to look like consensus
- False claiming — asserting authorship of a track that isn't yours

**What must never happen:** a guess rendered as a confirmation. This is already a ground rule.
This spec makes it structural rather than a matter of copy.

## Assumptions

| Assumption | Status |
|---|---|
| Users will contribute names at all | **UNTESTED — the core demand question** |
| Provenance capture improves accuracy over raw voting | Untested, but strongly supported by how ID threads actually resolve |
| Fuzzy duplicate collapsing is necessary for consensus to form | High confidence — vote fragmentation is a well-understood failure |
| Artists will engage enough to confirm | Untested, gates the highest confidence tier |

---

# Stage 2 — Tech Stack & Scope Spec

## Problem statement

An unnamed cluster represents real knowledge held by people, not by machines — someone in the
crowd knows what that track is. The problem is extracting it in a form that can be trusted,
ranked, and reversed, from a population that includes both genuine experts and people
guessing for status.

## Core design decisions

### 1. Provenance is a required field, and it outranks votes

Every suggestion must answer **"how do you know?"** before it can be submitted:

| Basis | Weight |
|---|---|
| I made this / I represent the label | Highest — routes to artist verification |
| The artist announced it (link required) | High — link is checkable |
| Heard it identified in another set or tracklist | Medium |
| Educated guess from the sound | Lowest — and explicitly permitted |

That last row is load-bearing. **Give people a legitimate way to say "I'm guessing," or
guesses arrive disguised as facts.** A guess submitted honestly is useful data; the same guess
laundered as knowledge is pollution.

Ranking uses provenance first, vote count second. Fifty upvotes on an educated guess must not
outrank one linked artist announcement.

### 2. Duplicate collapsing on submit — non-negotiable

`Michael Bibi - Chemicals`, `michael bibi — chemicals (unreleased)`, and `Chemicals by M
Bibi` are one answer. If they exist as three suggestions, votes fragment across spellings and
consensus never forms — the cluster looks contested when it is actually solved.

On submit, fuzzy-match against existing suggestions and prompt: *"Did you mean this?"* with
the option to join that suggestion instead. Normalize aggressively for matching (lowercase,
strip punctuation, drop `(unreleased)` / `(original mix)` / `[ID]` style suffixes) while
preserving the original text for display.

### 3. Three confidence tiers, never collapsed

| Tier | Condition | Presentation |
|---|---|---|
| Suggested | Any submission | Clearly provisional |
| Community consensus | Threshold of weighted agreement | Prominent, still labeled a community answer |
| Confirmed | Artist claim, or catalog match | The only tier allowed to read as fact |

Nothing is promoted to Confirmed by popular vote. Ever. Volume is not verification.

### 4. Corrections, not downvotes

Symmetric up/down voting turns into pile-ons at small scale and discourages the tentative,
often-correct contributor. Instead: upvote, plus a distinct **"this is wrong"** flag that
requires a reason. Flags route to review rather than silently sinking the suggestion.

### 5. Resolution loops back into the pipeline

When a suggestion reaches consensus, **re-check the proposed name against the catalog
matcher.** If it matches a released track, the cluster wasn't unreleased — it was a catalog
miss, and it auto-resolves to Confirmed. This is free accuracy and it also measures how often
your catalog path is failing.

When a cluster resolves, notify every user who ever recorded it. That is the retention
moment: *"the ID you caught in June has a name."*

### 6. Artist override supersedes everything

A verified artist can confirm, correct, or suppress. A correction from the artist overrides
consensus immediately and notifies contributors. This is the reason artists engage, and the
reason the whole system stays honest.

## In scope

- Suggestion form: artist, title, required provenance, optional link and notes
- Fuzzy duplicate detection with join-existing prompt
- Weighted ranking: provenance tier first, votes second
- Upvote and flag-as-wrong with reason
- Three-tier confidence display
- Catalog re-check on consensus
- Notification to cluster contributors on resolution
- Account required to suggest or vote — **never to record**

## Out of scope

- Reputation scores and user levels
- Threaded discussion on suggestions
- Artist verification mechanics (Spec 003)
- Moderation tooling beyond the flag queue
- Editing a submitted suggestion — withdraw and resubmit instead

## Failure behavior

| Condition | Behavior |
|---|---|
| Suggestion is near-duplicate | Prompt to join existing rather than create new |
| Two suggestions tie at consensus | Neither promotes. Show both as contested. |
| Flagged suggestion | Stays visible, marked disputed, queued for review |
| Artist contradicts consensus | Artist wins immediately; contributors notified |
| Consensus name matches catalog | Auto-resolve to Confirmed, log as catalog miss |
| Unauthenticated user tries to suggest | Prompt sign-in, preserve the draft |

## Success criteria

- Correction rate on consensus-tier names under 5%
- Median unnamed-to-named time trending down as the user base grows
- Under 10% of clusters sitting in contested state
- Zero suggestions reaching Confirmed without artist or catalog verification

## Open risks

1. **Will anyone contribute?** Untested and existential. Cheapest test: put the current
   prototype in a house Discord and count suggestions on seeded unknown clusters. Do this
   before building any of the above.
2. Cold start — an empty cluster with no suggestions invites no one.
3. Requiring an account to suggest suppresses volume; requiring nothing invites abuse.
   Recording must stay account-free regardless.
4. Fuzzy matching that is too aggressive merges genuinely distinct tracks. Tune conservative.
