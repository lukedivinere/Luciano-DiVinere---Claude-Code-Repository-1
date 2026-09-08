# Claude Code prompt — library view, and making it not look AI-built

Paste below the line into Claude Code. Start in plan mode.

---

Build the library — the Shazam-style list of everything I've identified. This is the screen
people will open most, so it has to feel like a shipped product, not a generated one. That is
an explicit requirement, not a nice-to-have; specifics are at the end.

Start in plan mode. Show me the plan first.

## The library screen

**Header**: total count, prominent. "247 IDs" as the largest type on the screen. Secondary line
breaking it down — how many released, how many still unknown. That count is the thing people
feel ownership over; give it weight.

**List**: reverse chronological, dense rows. Each row:

- Album artwork, 56×56, leading
- Track title — one line, truncate with ellipsis, never wrap
- Artist — one line, secondary colour
- Label — small, muted, third line (this is a house music app; the label matters to this
  audience more than it would elsewhere)
- Right side: relative time, and a three-dot button
- Whole row taps through to track detail

**Grouping**: section headers by date — Today, Yesterday, then day and month. Sticky headers
while scrolling.

**Filters** at the top: All / Released / Unknown IDs.

## The three-dot menu

Opens a **native-feeling action sheet from the bottom**, not a custom dropdown or centred
modal. On iOS later this should be a real `UIMenu` / action sheet. On web, a bottom sheet with
a drag handle that dismisses on swipe-down and on backdrop tap.

Items, in this order:

1. Play on Apple Music
2. Play on Spotify
3. Watch on YouTube
4. Buy on Beatport *(put this above iTunes — this audience buys here, and it's the affiliate
   link that actually earns)*
5. Buy on iTunes
6. Go to artist
7. Share
8. Remove from library

Only render links that actually resolved. **A greyed-out dead row looks broken; an absent row
looks intentional.** Never show a service you don't have a link for.

## Metadata sourcing

- **AudD**: pass `return=apple_music,spotify,deezer` on the recognition request. It returns
  artwork, label, release date and service links in one response — use this first.
- **iTunes Search API** for artwork and buy links where AudD comes up short. It needs **no
  authentication at all**, no key, no header. Artwork comes as `artworkUrl100`, `artworkUrl600`
  and `artworkUrl3000`. Rate limit is **20 calls per minute**, so cache aggressively — cache
  lookups for days, not minutes, and the limit stops mattering.
- **Discogs API** for label and release data. Worth it here specifically: Discogs is the
  strongest database for electronic and vinyl releases, which is exactly this catalogue.
- Cache all metadata by track identity. Never re-fetch artwork you already have.

## Unreleased tracks — the design problem to solve properly

Unknown IDs have no artwork, no label, no links. If you render them as empty rows, the tracks
the app exists for will look broken, and half the library will read as failure.

Fix: **give unknown IDs their own visual identity.** Generate a deterministic mark from the
cluster ID — a flat, bold geometric pattern derived from a hash, drawn from the app's purple
palette. Same cluster always produces the same mark, so it becomes recognisable over time.

Flat shapes only. No gradients, no glows, no noise. Done right these look deliberate and
distinctive — the unreleased tracks should look *special*, not deficient. That inverts the
problem: the thing nobody else can show you gets the most distinctive treatment in the app.

Their rows show the cluster number, sighting count, and watch count instead of label and links.
Their action sheet shows: Suggest a name, Watch this ID, Share, Remove.

## Making it look shipped, not generated

These are the specific things that make an app read as AI-built. Avoid all of them.

**Don't:**

- Wrap everything in identically-styled cards with the same radius and padding. Uniformity
  reads as generated. Lists should be dense bordered rows; detail views should be airy.
- Use emoji as icons. Use a real icon set, consistently, outline or filled but never mixed.
- Use gradients, glows, neon, or coloured drop shadows anywhere.
- Give every button equal visual weight. One primary action per screen, maximum.
- Ship only the happy path.

**Do:**

- **Build every state.** Empty, loading, error, offline, and partial. An empty library needs a
  real invitation, not "No items." A failed artwork fetch needs a designed fallback. This is the
  single biggest tell between a shipped app and a demo.
- **Use a real type scale** with genuine contrast — the count in the header should be several
  times the size of a row's label line. Two weights only.
- **Vary density deliberately.** Dense list, airy detail view.
- **Use real content at real lengths** while building — long titles that need truncation,
  artists with unusual characters, a track with no label. Placeholder-perfect data hides every
  layout bug.
- **Skeleton rows while loading**, not a spinner.
- **Follow platform conventions.** Bottom sheets from the bottom. Swipe-to-dismiss. Back
  gestures. Deviating from these is what makes something feel off even when users can't say why.
- **Handle long lists properly** — virtualise past a few hundred rows so scrolling stays smooth.

## Acceptance criteria

1. Library renders 500+ rows without scroll jank.
2. Long titles, missing labels, and missing artwork all render correctly — test with
   deliberately awkward data.
3. Action sheet omits unresolved services entirely rather than disabling them.
4. Unknown IDs render their generated mark; the same cluster ID always yields the same mark.
5. Empty, loading, error and offline states all exist and are individually screenshot-tested.
6. Metadata is cached; re-opening the library issues no new artwork requests.
7. iTunes Search calls are rate-limited client-side to stay under 20/minute.
8. Existing tests still pass.

## How I want you to work

- Plan first, wait for approval.
- Build the states before the polish.
- Check every screen at 390px wide.
- Explain the why as you go.
- Small commits, plain-language messages.
