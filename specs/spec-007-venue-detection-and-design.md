# Spec 007 — Venue detection and design direction

Framework: three-stage build framework. Gating mode: **soft**.

Two parts: automatic event detection from location, and a design system that reads as
professional without being dull.

---

# Part 1 — Venue and event detection

## Why this matters more than it sounds

Set context — whose set, which venue, which event — is what powers the played-by list, which
powers the artist analytics tier, which is your largest revenue line. Right now it depends on a
user typing it in, which most people will not do.

Automating it is not a convenience feature. **It is the thing that makes the business model
possible**, because manual entry will never produce the coverage the artist tier needs.

## What is achievable, precisely

| Step | Achievable? | How |
|---|---|---|
| Coordinates → venue name | Yes | Reverse geocode via a Places API |
| Venue + date → event name and lineup | Mostly | Songkick API — event details include venue coordinates, performer lineup, ticket links. Needs an API key |
| Event → **set times per stage** | **Usually not** | Neither Songkick nor Bandsintown reliably expose stage-level set times. Festival apps have this; public APIs generally do not |
| Timestamp → which DJ was playing | **Not directly** | Follows from set times, which you won't have |

So the honest design: **you can reduce "type the artist name" to "pick from a short list."**
That is still a large win — a text field becomes three taps, and three taps is the difference
between a field people skip and a field people fill.

## Sources

- **Songkick** — primary. Event details carry venue coordinates, lineup and ticket links.
  Requires an API key.
- **Bandsintown** — secondary. Artist and event coverage, useful for cross-checking.
- **A Places API** for reverse geocoding coordinates to a venue.
- **Resident Advisor** has by far the best electronic coverage — and **no sanctioned public
  API**. The "RA APIs" you'll find are third-party scrapers on Apify and similar. Using one in
  production is the Instagram mistake again: terms violation, brittle, and it makes your data
  pipeline dependent on someone else's scraper staying unblocked. Do not.

## Flow

1. At the moment of a capture — and only then — sample coarse location.
2. Reverse geocode to a venue.
3. Look up events at that venue on that date.
4. Present a confirmation, never an assumption: *"Looks like Elrow at Amnesia — right?"* with
   the lineup as a picker, and a manual fallback.
5. User taps the DJ. Store as `playedBy`, still explicitly distinct from `producedBy`.
6. Cache the venue-and-date lookup per session — everyone at that event that night resolves
   from one cached result.

## Disambiguating stages

A festival lineup gives you concurrent DJs across multiple stages, and no way to know which one
the user is at. Two things narrow it:

- **Co-occurrence anchors** (Spec 006): if others in the same anchored session already tagged
  their captures, suggest the same DJ first.
- **User history**: the artists someone follows and has captured before are better first
  guesses than alphabetical order.

Suggest, rank, never auto-assign. A wrong `playedBy` propagates into the played-by list and the
artist analytics, which is exactly the data you intend to sell.

## Privacy — stricter than the co-occurrence spec, because this is identified

Spec 006 uses coarse buckets. This resolves to a **named venue**, which is a meaningful
escalation.

1. **Sample location only at the instant of a capture.** Never background tracking, never
   continuous. This is the single most important rule here — it is the difference between "an
   app that notes where you were when you IDed something" and "an app that follows you."
2. **Explicit opt-in**, with a permission prompt that says plainly what it is for. Location
   must be optional; the app must work fully without it, with manual entry.
3. Store the resolved venue and event, not a location trail.
4. Never show other users' locations, or that anyone else was present.
5. Deleting a capture deletes its venue association.
6. Disclose it plainly in the privacy policy. Location plus timestamp plus identity is personal
   data, GDPR applies across most of this audience, and this needs real legal review before an
   EU launch. Nothing here is legal advice.

## Acceptance criteria

1. Location is requested only at capture time; assert no background location subscription
   exists anywhere in the codebase.
2. The app functions fully with location permission denied, falling back to manual entry.
3. Venue and event are always confirmed by the user, never silently assigned.
4. `playedBy` is never written without an explicit user action.
5. Venue-and-date lookups are cached; ten captures at one event produce one lookup.
6. Deleting a capture removes its venue association.
7. No third-party scraper is used for event data.

---

# Part 2 — Design direction

## The principle

Professional and fun are not opposites, but they come from different places, and mixing them
everywhere produces neither.

**Professional comes from restraint and completeness** — consistent spacing, a real type scale,
every state designed, platform conventions honoured.

**Fun comes from a small number of high-impact moments.** Not decoration spread evenly.

Shazam is the reference: the entire app is quiet and restrained, except one pulsing button that
is the whole personality. That contrast is what makes it feel alive rather than busy.

**So: spend the entire personality budget on three moments. Keep everything else silent.**

## The three moments

### 1. The capture

The waveform must be driven by **actual microphone input**, not a canned animation. People can
tell instantly, and it's the difference between "this app is listening" and "this app is
playing a loading animation at me." It is the app's core promise rendered visually.

Add haptic feedback on start and on result.

### 2. The resolution

An unknown ID becoming a named track is the emotional payoff of the entire product. It deserves
a real beat — the generated mark cross-fading to real cover art, the name and label arriving,
a haptic. Two seconds of genuine celebration.

This is the moment people screenshot. Build it properly.

### 3. The count

`247` should be the largest, most confident piece of typography in the app. It is the number
people feel ownership over. Give it a display treatment and let it carry weight.

Everything else — lists, sheets, settings, forms — stays quiet.

## Type scale

Real contrast. Two weights only, 400 and 500.

```
Display   48 / 500   the library count
Title     34 / 500   screen headers
Heading   22 / 500   section titles
Body      17 / 400   primary content
Label     15 / 500   row titles
Caption   13 / 400   secondary rows
Micro     11 / 500   badges, counts
```

The jump from 48 to 13 is what makes a screen feel designed. Uniform 14-16px everywhere is the
single clearest sign of a generated interface.

## Colour

Dark as primary — the app is used in dark rooms.

```
--surface-0   #0E0A14   page
--surface-1   #17111F   card
--surface-2   #201829   raised
--surface-3   #2A2036   sheet
--accent      #8B7DF0
--text-primary   #F4F1F8
--text-secondary #A79FB8
```

Rules: depth from tonal steps only. No gradients, no glows, no neon, no coloured shadows.
Purple is the accent, not the background — a screen that is purple everywhere reads cheap; a
near-black screen with purple accents reads expensive.

## Motion

- One easing curve throughout. One duration scale: 150ms for state changes, 250ms for
  transitions, 400ms for the resolution moment.
- No bounce anywhere except the resolution beat.
- Skeleton rows while loading, never spinners.
- Motion should confirm actions, not decorate them. If an animation isn't telling the user
  something happened, remove it.

## Texture

The generated marks for unknown IDs are the app's visual signature. They give the library
rhythm and colour without imagery, and they make the unreleased tracks — the reason the app
exists — the most visually distinctive thing in it.

Lean into that. It is more original than anything a template would give you.

## Acceptance criteria

1. Waveform amplitude is driven by live microphone input; assert it responds to real signal.
2. Type scale is defined as tokens and used consistently; no arbitrary font sizes in components.
3. Every screen has designed empty, loading, error and offline states, individually
   screenshot-tested.
4. No gradients, glows, or coloured shadows anywhere in the stylesheet — assert by lint.
5. All colour pairs meet contrast requirements in both themes.
6. Motion respects `prefers-reduced-motion`.
7. Every screen checked at 390px wide.
