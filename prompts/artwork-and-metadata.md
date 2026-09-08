# Claude Code prompt — artwork, artist, and label on every ID

Paste below the line into Claude Code. Start in plan mode.

---

Every identified track should show cover art, artist, and record label. Right now rows are
text-only. Add metadata enrichment and render it.

Start in plan mode. Show me the plan before writing code.

## Hard constraints

1. Cache all metadata by track identity. Never re-fetch artwork we already have.
2. Never render a placeholder that looks like a failure. Missing data gets a designed
   fallback, not an empty box or a broken-image icon.
3. Unknown IDs have no artwork by definition — they get their own visual treatment, not an
   empty slot.
4. Rate-limit outbound metadata calls. iTunes Search caps at 20 requests per minute.

If a later instruction conflicts with these, stop and flag it rather than resolving it
yourself.

## Sources, in priority order

1. **AudD** — add `return=apple_music,spotify,deezer` to the recognition request. The response
   carries artwork, label, release date and service links in one call. Use this first; it costs
   nothing extra since we're already making the request.
2. **iTunes Search API** — fallback for artwork and buy links. No authentication, no key, no
   header. Returns `artworkUrl100`, `artworkUrl600`, `artworkUrl3000`. Use the 600 for list
   rows at 3x density.
3. **Discogs API** — fallback for label and release info. Worth wiring specifically because
   Discogs has the strongest coverage of electronic and vinyl releases, which is our catalogue.

Try each in order, stop at the first that returns what's needed, cache the result.

## Data model

Add to the track record:

- `artworkUrl` (store the source URL plus a locally cached copy)
- `artworkSourcedFrom` — which provider gave it to us
- `label`
- `releaseDate`
- `serviceLinks`: `{ appleMusic, spotify, youtube, beatport, itunes }` — nullable per service
- `metadataFetchedAt` — so we can decide when a refetch is warranted

## Rendering

**Released tracks**, per row:

- Artwork, 52×52, 6px radius, leading
- Title — one line, truncate with ellipsis, never wrap
- Artist — one line, secondary colour
- Label — one line, muted, smaller

Three lines, three jobs: what it is, who made it, where it came from. Do not add a fourth.

**Unknown IDs:**

- Generate a deterministic mark from the cluster ID — a flat geometric pattern derived from a
  hash of the ID, drawn from the app's purple palette. The same cluster must always produce the
  same mark, so it becomes recognisable.
- Flat shapes only. No gradients, no glows, no noise textures.
- Their three lines are: cluster number, where it was captured, then sighting and watch counts.

## Retroactive backfill — don't skip this

When a cluster resolves — either the community names it or the catalog re-check matches it —
**fetch metadata and backfill every existing row for that cluster**, including ones users saved
months ago.

The generated mark is replaced by the real cover art, and artist and label populate, in place,
on the row they already have in their library. This is the payoff moment for the whole product:
an ID someone caught in June quietly becomes a real track with a real cover, sitting exactly
where they left it.

Trigger a notification when this happens, per the existing `named` / `released` notification
split.

## Failure behaviour

| Condition | Behaviour |
|---|---|
| No artwork from any source | Designed fallback using the generated-mark system, not a broken image |
| No label found | Omit the line entirely — do not render "Unknown label" |
| Metadata request fails | Row still renders with what we have; retry later in the background |
| Rate limit hit | Queue and back off. Never block the UI on metadata. |
| Artwork URL 404s later | Fall back to the generated mark, clear the cached URL |

## Acceptance criteria

Write tests alongside.

1. A released track renders artwork, artist and label from a single AudD response without a
   second network call.
2. When AudD returns no artwork, iTunes Search is called and its result is used.
3. Metadata is cached — reopening the library issues zero new artwork requests. Assert this.
4. iTunes Search calls are rate-limited below 20/minute; assert the limiter works.
5. The same cluster ID always generates an identical mark. Assert determinism.
6. When a cluster resolves, previously saved rows for that cluster are backfilled with real
   artwork and label. Test with a row created before resolution.
7. A track with no label omits the line rather than rendering placeholder text.
8. A failed artwork fetch never renders a broken-image icon.
9. Existing tests still pass.

## How I want you to work

- Plan first, wait for my approval.
- Build the caching layer and the fallback chain before the rendering.
- Test with deliberately awkward data: very long titles, missing labels, unusual characters,
  a track with artwork but no label, a track with neither.
- Check rows at 390px wide.
- Explain the why as you go.
- Small commits, plain-language messages.
