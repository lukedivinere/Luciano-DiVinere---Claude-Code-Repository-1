# Crate — App Foundation

_The definition of the app: what it is, the rules it's built on, and what actually works
today. This is the reference everything else gets checked against._

---

## 1. What Crate is

**A Shazam for house music — including the tracks that were never released.**

Shazam gives up on the songs that matter most to house heads: the unreleased IDs that
only exist in DJ sets and SoundCloud rips. Crate finds those, three ways at once:

1. It listens (like Shazam) and matches released tracks by fingerprint.
2. When there's no match — which is exactly the unreleased case — it pulls in **community
   knowledge and Instagram drops** that no fingerprint database has.
3. It remembers every clip **you** ID'd, so when an unnamed track finally drops, you're
   the first to know.

**One line:** _Point your phone at the speakers and find the track — even the one that
isn't out yet._

## 2. Who it's for

House-music fans who hear an unreleased ID in a set and currently have no way to find it —
so they end up begging in Discord servers and 1001Tracklists comments. Crate is that
whole workflow in one app, built for their scene instead of the mainstream.

---

## 3. The ground rules (non-negotiable foundation)

These are the rules that keep Crate **legal, trusted, and survivable**. Every feature is
built to obey them. Break one and the app gets DMCA'd, pulled from the App Store, or
loses the artists' trust — so they don't bend.

| # | Rule | Why it exists |
|---|------|---------------|
| **1** | **Never host audio on the server.** We store fingerprints, IDs, and links — not audio files. | Unreleased music is copyrighted. Hosting it = takedowns + legal exposure. |
| **2** | **Personal recordings stay on the user's device.** Your ID history lives on your phone, never uploaded. | Keeps the private-history feature legal — it's like a voice memo, not distribution. |
| **3** | **We do not scrape Instagram.** IG drops are opt-in, submitted by URL. | Scraping violates Meta's ToS and is legally fragile. Opt-in is sustainable. |
| **4** | **Always send people to the artist.** Every track links out to the artist's own page. | Aligns Crate with artists instead of against them — discovery, not piracy. |
| **5** | **A guess is labeled a guess.** AI / similarity / unmatched context is never shown as a confirmed fact. | Trust. Overpromising an ID is how you lose the community. |

**The line that makes it all work:** _your own recording is private and on-device; anything
public is metadata + a link, never audio._

---

## 4. What the app does today (the functioning product)

This is the real, working feature set — what a user actually gets.

### Tap to ID
A single listening screen with a pulsing orb. Tap it and Crate records from the mic,
then runs what it heard through every source at once.

### Auto-ID
A toggle that keeps listening on a loop (like Auto Shazam) and surfaces a result the
moment it catches one — for when you're deep in a set and don't want to keep tapping.

### Multi-source recognition
Instead of one database, a clip fans out across four **sources**, and the most confident
real match becomes the "best guess":
- **Fingerprint** — exact match against released catalog.
- **Set indexes** (1001Tracklists-style) — where unreleased IDs get named.
- **SoundCloud** — rips and official unreleased uploads.
- **Instagram drops** — unreleased IDs pulled from submitted IG posts (see below).

### My IDs — on-device history
Every clip you ID is saved **on your phone**, with the recording, so you can replay it.
Two features hang off this:
- **Replay** — hear exactly what you captured.
- **Watch for release** — flag an unidentified track. This is the hook for the signature
  feature: _"You ID'd this two months ago — it's dropping this weekend."_

### Instagram ID drops
Submit an artist's post/reel URL plus the unreleased IDs on it. Crate keeps the **link +
metadata only** and surfaces it in the pipeline. Opt-in, not scraped — the legal version
of "harvest the IDs artists post."

### Community layer
Anyone can **name an unreleased track** (ID + source link) and **upvote** others'. This
is the moat: a crowd of house heads who ID the tracks no algorithm can.

---

## 5. Why people would actually use it

| | Shazam | trakd / TrackSniff / Setlist.ID | **Crate** |
|---|--------|-------------------------------|-----------|
| IDs released tracks | ✅ | ✅ | ✅ |
| Finds **unreleased** IDs | ❌ | ⚠️ limited | ✅ community + IG |
| Built for **house** culture | ❌ | ⚠️ broad EDM | ✅ |
| **Remembers** your IDs & alerts on release | ❌ | ❌ | ✅ watch-for-release |
| Pulls IDs from **Instagram** | ❌ | ❌ | ✅ opt-in |

**The hook that's uniquely Crate:** it closes the loop from _"what is this unreleased
track?"_ all the way to _"it's out now, here's where"_ — for one specific, passionate
scene. Nobody else does that.

---

## 6. Honest status: what's real vs. demo right now

Being clear so nobody mistakes the prototype for the finished product.

| Feature | Status |
|---|---|
| Tap-to-ID / Auto-ID recording | **Real** (records from the mic) |
| On-device history + replay + watch flag | **Real** (saved on device) |
| Instagram drop submission + catalog | **Real** (metadata stored, validated) |
| Community submit + upvote | **Real** (persisted server-side) |
| Fingerprint matching | **Demo** until an AudD API key is added (then live) |
| Tracklists / SoundCloud results | **Demo** — illustrative placeholders; need live integrations |
| IG-drop audio-matching, release notifications | **Roadmap** — not built yet |

This is a **Phase-0 demand-test prototype**: enough of a real app to put in front of house
heads and measure whether they'll contribute IDs — which is the one question that decides
whether the full app is worth building.

---

## 7. The foundation it's built on (so it can grow)

- **Adapter architecture.** Each source is a self-contained adapter (`pipeline.js`). A real
  scraper or API drops in without touching the rest of the app.
- **Clean separation.** `server.js` (routes) · `pipeline.js` (recognition) ·
  `instagram.js` (IG ingestion) · `public/` (the app). Storage is swappable.
- **Roadmap, in order:**
  1. Add an AudD key → real released-track matching.
  2. Deploy to a public URL → put it in a house Discord and measure contribution.
  3. Artist opt-in via the official Instagram API + fingerprint reel audio → IG drops
     become matchable by the orb.
  4. Release-watch notifications → the "it's dropping this weekend" alert.
  5. Native iPhone app.

See [`VALIDATION.md`](./VALIDATION.md) for the competitor/cost/legal analysis and
[`README.md`](./README.md) for how to run it.
