# Spec 004 — Artist sets, capture storage, and theme

Framework: three-stage build framework. Gating mode: **soft**.

Three related additions: an artist/sets browsing section, a decision on how captured audio is
stored, and a layered visual theme with a capture history view.

---

# Part 1 — Artist sets section

## The problem, restated

"I watch a lot of sets on YouTube, good ones get released constantly, and I never know when a
set from an artist I follow drops, or how to get back to one I liked."

That is not a discovery problem. It is a **subscription and memory problem**. The sets are easy
to find; keeping track of them is not. So the feature is follow → notify → revisit, not
search.

## Use the official YouTube Data API. Do not scrape.

Same discipline as Instagram, and here the official path is genuinely good.

**Critical quota detail that shapes the architecture:** the default quota is 10,000 units per
day per project. `search.list` costs **100 units per call** — that is a hard ceiling of about
100 searches a day, which will not survive real usage. But `playlistItems.list` costs **1 unit**.

So: **never browse via search.** Resolve an artist to their channel once, get that channel's
uploads playlist ID, and page through it with `playlistItems.list` at 1 unit a call. The same
browsing that would cost 100 units costs 1. Reserve `search.list` for the one-time "find this
artist's channel" step, and cache the channel ID forever.

Playback uses the **YouTube IFrame embed**. Never download or extract audio — it breaks terms,
strips the creator's monetisation, and it's the Instagram lesson again.

## Scope

- Search for an artist once, resolve and cache their channel
- Follow artists
- Poll followed channels' uploads playlists on a schedule, cheaply
- A feed of new sets from artists you follow
- Set detail: embedded player, metadata, save-for-later, mark as watched
- "Watch later" queue — directly answers "I wanna go back to it"
- Notification when a followed artist posts a new set

## The connection that makes this more than a YouTube skin

Your app already collects sightings — which tracks were captured, at which set, by which DJ.

So an artist's set page can show **the community-captured tracklist for that set**: which IDs
people caught, named and unnamed, with confidence tiers. YouTube does not have that. 1001
Tracklists has it only for sets somebody manually transcribed, and almost never for the
unreleased IDs.

That turns a browsing feature into a second front door: people arrive to watch a set, discover
the tracklist, and find the ID they were hunting. It also generates demand for capture — "this
set has 4 unnamed IDs" is an invitation.

Build the browsing first, wire the tracklist in as soon as sighting volume allows.

## Out of scope

- Downloading or re-hosting any YouTube audio or video
- Uploading sets
- Comments or social features on set pages
- SoundCloud and Mixcloud — same pattern later, one platform at a time

---

# Part 2 — Storage: how much data does keeping recordings actually cost?

Short answer: **almost none, if you encode correctly. A lot, if you don't.**

## The numbers

| Format | Per second | 15-second clip | 40 clips (one big night) | 2,000 clips (a heavy year) |
|---|---|---|---|---|
| Raw PCM 44.1kHz 16-bit mono | 86 KB | ~1.3 MB | ~53 MB | ~2.6 GB |
| Opus 128 kbps mono | 16 KB | ~240 KB | ~9.6 MB | ~480 MB |
| **Opus 32 kbps mono** | **4 KB** | **~60 KB** | **~2.4 MB** | **~120 MB** |
| Opus 24 kbps mono | 3 KB | ~45 KB | ~1.8 MB | ~90 MB |

A year of heavy use at 32 kbps is around 120 MB on device. That is roughly one podcast episode.
**Storage is a non-issue.** Doing it in raw PCM is a 2.6 GB problem. The format choice is the
entire question.

## The design that follows: three audio artifacts, three lifetimes

Do not try to make one recording serve every purpose. One capture, three outputs:

| Artifact | Quality | Lives | Lifetime | Purpose |
|---|---|---|---|---|
| **Match copy** | PCM or ~128 kbps, 10–15s | Uploaded | Deleted right after matching | Fingerprinting — needs spectral detail |
| **Memory copy** | Opus 32 kbps mono, 15–30s | On device only | Until the user deletes it | "Oh yeah, I remember catching that" |
| **Re-index fragment** | 8 kHz mono, band-limited | Server | Long term | Re-fingerprinting when the algorithm changes |

The memory copy staying **on device only** is not a compromise — it satisfies your existing
ground rule that personal recordings never leave the phone, it costs you zero server storage,
and it removes the legal exposure of hosting user recordings of copyrighted music entirely.

The re-index fragment is deliberately unlistenable. It exists so that changing your fingerprint
algorithm later doesn't kill your entire historical database — the irreversible decision
flagged back in Spec 001.

## On quality versus fingerprinting

Earlier guidance was "don't compress before matching." Sharpen that: **aggressive** compression
below roughly 64 kbps destroys the spectral peaks fingerprints rely on. Around 128 kbps is
generally fine for matching and cuts upload size by more than 80% versus PCM — which matters
on festival cellular data.

Capture at high quality with all processing disabled, then branch: high-quality for the match,
low-bitrate for the memory.

## Network

At 128 kbps for the match copy, 40 captures in a night is under 10 MB of upload. Negligible.
The same night in raw PCM is 53 MB, which is the difference between "fine" and "why is this app
eating my data."

---

# Part 3 — Theme and capture history

## Direction

Purple and white, with depth built from **tonal layers rather than shadows**. The app is used in
dark rooms, so dark mode is the primary design target and light mode is the variant — not the
other way round.

Depth comes from stepping surfaces, not from drop shadows and glows. Flat surfaces at different
tones read as layered and stay legible at 3am at low brightness.

## Tokens

**Dark (primary)**

```
--surface-0   #0E0A14   page — near black, purple cast
--surface-1   #17111F   card
--surface-2   #201829   raised card
--surface-3   #2A2036   popover, sheet
--border      rgba(255,255,255,0.08)
--accent      #8B7DF0   interactive purple
--accent-strong #6F5FE8
--text-primary   #F4F1F8
--text-secondary #A79FB8
--text-muted     #6F6880
```

**Light**

```
--surface-0   #FAF8FD
--surface-1   #FFFFFF
--surface-2   #FFFFFF
--border      rgba(20,10,35,0.08)
--accent      #6F5FE8
--text-primary   #1A1424
--text-secondary #5C5470
```

Confidence colours stay semantically distinct — green for confirmed, amber for community
answer, purple for unidentified — but desaturated so they sit inside the purple system instead
of fighting it.

Rules: no gradients, no glow, no neon. Depth via surface steps only. Every colour must pass
contrast in both modes.

## Capture history view

The "go back and see what I've tried to find" surface. This is where the memory copy earns its
existence.

- Reverse-chronological list of every capture, grouped by night and event
- Each row: track name or cluster number, confidence tier, time, venue, and a play button for
  the on-device memory copy
- Unresolved captures stay visible rather than being hidden as failures — they are pending IDs,
  not errors
- Filter by resolved / unresolved / released / unreleased
- Retroactive resolution highlighted: when a past capture gets named, surface it at the top
- Search by venue, artist, or date
- Per-row: remove from my IDs (keeps the anonymous sighting) or delete entirely

Grouping by night is what makes this feel like a diary rather than a log — "Elrow, 14 June,
9 captures" is how people actually remember shows.

## Open risks

1. YouTube quota still binds at scale even with cheap calls. Cache aggressively, poll on a
   schedule, and back off for artists nobody follows.
2. On-device-only memory copies mean history does not survive a lost phone. Decide whether
   that is acceptable or whether opt-in encrypted backup is needed later.
3. Theme work is cheap to redo. Do not spend time here before matching accuracy is solved.
