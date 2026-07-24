# House-Music Track ID App — Idea Validation

_A pre-build feasibility read: competitors, costs, legal exposure, and whether the
"AI guesses the artist by sound" feature is realistic. Written before committing any
engineering time._

---

## TL;DR

| Piece of the idea | Verdict | Why |
|---|---|---|
| A Shazam-style app for house music | **Viable** | The technique is public; APIs exist to bootstrap it. |
| Identifying **released** tracks in a mix | **Solved by others** | trakd, TrackSniff, Setlist.ID, Beatport already do this well. |
| Identifying **unreleased** tracks | **The real opportunity** — and unsolved | Fingerprinting *cannot* do it. Only a community can. This is your moat. |
| AI "sounds like artist X" | **Feasible but hard; ship it as a v2 "guess," not a v1 promise** | The tech (audio embeddings) exists; accuracy on unreleased house is unproven. |
| **Hosting** unreleased audio from SoundCloud | **Do not do this** | Legally radioactive. Store fingerprints + metadata, link out. |

**Overall:** The idea is worth building **if** you center it on the community layer and
treat hosting as forbidden from day one. The two hardest risks are *legal* (unreleased
IP) and *cold-start* (a community app is worthless until it has contributors).

---

## 1. Competitive landscape — is this taken?

Several apps ID tracks in DJ sets, but **none combine house-music focus + community
unreleased IDs + AI style-matching**. That specific triangle is open.

| Product | What it does | Gap it leaves you |
|---|---|---|
| **trakd** | Fingerprints unreleased tracks live; indexes sets w/ tracklists | Broad EDM, not house-culture-native; no AI style guess |
| **TrackSniff** | Paste a YouTube/Mixcloud/SoundCloud URL → timestamped tracklist; DB + community | Web tool, mix-oriented, released-track focused |
| **Setlist.ID** | ACRCloud, 100M+ tracks, segment-by-segment for layered mixes | Pure fingerprint; unreleased is a blind spot by definition |
| **Beatport Track ID** | IDs tracks mid-mix incl. edits/remixes | Only against Beatport catalog |
| **1001Tracklists / MixesDB / Discord ID servers** | Where unreleased-track knowledge *actually* lives today | It's humans + web, not a polished mobile app |

**Read:** You are not entering an empty market, but the incumbents all share the same
blind spot — **the unreleased track that isn't in any database.** The knowledge for those
lives in Discord servers and 1001Tracklists comments. Nobody has packaged it into a
house-focused mobile app with a good contribution loop.

---

## 2. The core technical fact that shapes everything

**Audio fingerprinting can only match a recording it has already seen.** Shazam,
ACRCloud, and AudD all work by hashing a spectrogram into a fingerprint and looking it up
in a database. An unreleased track is, by definition, not in that database — so no
fingerprint tool on earth can name it from a snippet alone.

This means your app is really **two products stitched together:**

1. **A fingerprint matcher** for released tracks — a solved problem you *rent* (via an
   API) rather than build.
2. **A human/AI system for the unreleased ones** — the actual product, the actual moat,
   the actual hard part.

Don't let #1 fool you into thinking #2 is close. #1 is a weekend of API integration. #2
is the company.

---

## 3. Cost reality — the APIs you'd rent

You do **not** need to build a fingerprinter to start. Rent one:

- **AudD** — transparent, cheap to start. **~$2 for the first 1,000 requests, then ~$5
  per 1,000** as-you-go. Stream monitoring (always-listening) is **~$45/stream/month**,
  or **~$25/stream/month if you match against your own content** rather than their DB.
  This "your own content" tier is interesting — it's how you'd match a fingerprint DB you
  build from community uploads.
- **ACRCloud** — no public price; login/quote-gated, 14-day free trial. Powers
  Setlist.ID. Bigger DB (100M+), better for layered/EQ'd mixes, but you're negotiating.

**Implication:** As-you-go pricing means a hobby launch costs single-digit dollars. Costs
only bite if the app gets popular — which is a good problem. The real spend is not API
fees; it's **your time on the community + moderation system.**

---

## 4. The AI "sounds like artist X" feature — real, but manage expectations

The technology exists and is mature enough to try:

- **Audio embedding models** (CLAP, OpenL3, PANNs) turn a clip into a vector — a "musical
  DNA" capturing timbre, instrumentation, rhythm, mood.
- You compare clips with **cosine similarity**: ~0.8 = highly similar (shared genre/mood),
  ~0.5 = loosely related.
- Build a per-artist "sound profile" from their known tracks; when a snippet has no
  fingerprint match, return the nearest artist profiles as **guesses**.

**Honest caveats:**
- House music is timbrally homogeneous on purpose — same drum machines, same synth
  palettes. Distinguishing Max Styler from a stylistic peer by embedding alone is *much*
  harder than telling metal from jazz. Expect noisy results.
- Recordings from live sets are degraded (crowd noise, phone mic, EQ) — this hurts
  embedding accuracy.
- **Frame it honestly in the UI:** "Sounds like it could be… (72%)" not "This is."
  Overpromising here is how you lose trust.

**Verdict:** Ship it as an intriguing v2 *hint*, not a v1 headline feature. It's a great
differentiator precisely because no competitor tries it — but it must be presented as a
guess.

---

## 5. The legal picture — read this twice

This is the single biggest risk, and it's not close.

- **Unreleased music is fully copyrighted.** Copyright attaches at creation, not release.
- **SoundCloud has a zero-tolerance policy on unreleased leaks** — accounts get
  *permanently terminated* for it, and rights holders file DMCA takedowns that platforms
  must honor.
- Pulling a track out of a set and redistributing it — even edited — **requires the
  rights holder's explicit permission.** Downloading or buying it does not grant that.

**What this rules out:** An app that *hosts* or *serves the audio* of unreleased tracks.
That business gets DMCA'd into oblivion and could expose you personally.

**What's safe (and what the incumbents do):**
- Store **fingerprints + metadata only** — never the audio file.
- For playback, **link out** to the artist's own official SoundCloud/Bandcamp.
- Position yourself as **discovery + attribution that sends people to the artist**, not a
  distribution channel. This aligns your incentives with artists instead of against them —
  which also helps adoption.

Design this constraint in from commit #1. Retrofitting it later is impossible.

---

## 6. The risk everyone underestimates: cold start

A community-powered app is **worthless on day one** — no contributors, no unreleased IDs,
nothing to retain users. This kills more apps than tech or legal ever do.

Mitigations to plan for now:
- **Seed from where the knowledge already lives:** 1001Tracklists, MixesDB, and house
  Discord ID channels. Import public tracklist metadata (metadata, not audio) to have
  content on launch.
- **Pick one scene and win it** — e.g. one subgenre (tech house / melodic house) or one
  festival/label ecosystem — rather than "all house everywhere."
- **Make contributing feel like status:** the people who ID unreleased tracks in Discord
  do it for reputation. Give them leaderboards, credit, verified-tagger badges.

---

## 7. Recommendation

**Conditional go.** Build it, but in this order and with these guardrails:

1. **Phase 0 (validate demand cheaply):** Before writing app code, confirm people want
   this — a landing page, a house-ID Discord bot, or a simple web uploader that returns a
   guess. Measure whether anyone contributes.
2. **Phase 1 (MVP):** Fingerprint match for *released* tracks via AudD (cheap), plus a
   dead-simple "submit an unreleased ID" flow. Metadata + fingerprints only, links out for
   audio.
3. **Phase 2 (moat):** Community verification/voting, reputation system, seed from public
   tracklist data. This is where the real product lives.
4. **Phase 3 (differentiator):** AI style-guess as a clearly-labeled hint.

**Non-negotiables baked in from the start:**
- Never host unreleased audio. Fingerprints + metadata + outbound links only.
- Present AI artist guesses as guesses.
- Solve cold-start deliberately, not by hoping users show up.

The idea is genuinely good and the gap is real. The failure modes are legal and social,
not technical — so those are what the early design must be built around.

---

## Sources

- [trakd — The Tracklist App](https://trakthat.app/)
- [TrackSniff](https://tracksniff.com/) · [How to find tracklists from DJ sets](https://tracksniff.com/blog/how-to-find-tracklists-from-dj-sets/)
- [Setlist.ID — about](https://setlist.id/about)
- [Beatport Track ID (GearNews)](https://www.gearnews.com/beatport-track-id-dj-tech/)
- [6 Ways to Identify Tracks Without Shazam (Vice)](https://www.vice.com/en/article/track-identification-of-music-group-facebook-mixesdb-tracklist/)
- [AudD Music Recognition API](https://audd.io/) · [Audio streams pricing](https://docs.audd.io/streams/) · [AudD vs ACRCloud](https://audd.io/resources/articles/audd-vs-acrcloud.html)
- [Decoding ACRCloud pricing (Oreate)](https://www.oreateai.com/blog/decoding-acrcloud-understanding-the-pricing-behind-audio-recognition/2cacd4cbb8623d3abb720eac86f251d7)
- [How does AI find similar music? (Gaudio Lab)](https://www.gaudiolab.com/blog/204_how_does_ai_find_similar_music_understanding_the_criteria_behind_the_match)
- [CLAP embeddings for music analysis (The Music Case)](https://www.themusicase.com/blog/ai-music-analysis-audio-vectoring-how-clap-embeddings-are-changing-music-intelligence/)
- [Top audio embedding models (Zilliz)](https://zilliz.com/learn/top-10-most-used-embedding-models-for-audio-data)
- [SoundCloud — unauthorized/unreleased content policy](https://help.soundcloud.com/hc/en-us/articles/4402637177115-How-do-I-upload-content-that-contains-work-created-by-someone-else)
- [SoundCloud — DJ mix copyright takedowns](https://help.soundcloud.com/hc/en-us/articles/115003447327-Your-DJ-mix-was-taken-down-for-copyright-infringement)
- [SoundCloud, Copyright & the DMCA Safe Harbor (Seton Hall)](https://scholarship.shu.edu/cgi/viewcontent.cgi?article=1932&context=student_scholarship)
