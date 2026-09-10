# Design Direction — house style for every website

Standing brief for all sites in this repo (templates and client builds). Inspired by
**meuze.ai** (clean, modern, interactive-on-scroll) and **anara.care** (calm, editorial,
minimal). When building or redoing any website, follow this unless a client explicitly overrides it.

## Principles
1. **Minimal color.** One near-white background, one near-black ink, and **a single accent**.
   No more than that. Let type and space carry the design, not color.
2. **Big, quiet typography.** Large light-weight headlines (a refined serif or a clean grotesk),
   generous line-height, small UPPERCASE tracked labels for eyebrows. Restraint over decoration.
3. **Whitespace first.** Generous section padding and vertical rhythm. Air is the aesthetic.
4. **Interactive as you scroll.** The page should feel alive on scroll without being noisy:
   - fade + rise reveals on every block (staggered where there are lists),
   - at least one **pinned / sticky** section whose content advances as you scroll,
   - **number counters** that count up when their stats enter view,
   - a nav that gains a hairline on scroll and highlights the current section (scrollspy),
   - smooth anchor scrolling; a large image that scales or shifts slightly on scroll.
   Always gate motion behind `@media (prefers-reduced-motion: reduce)`.
5. **Hairline structure.** Thin 1px dividers, not boxes and heavy borders. Soft, minimal shadows only.
6. **One page, anchor nav.** Single page; the nav jumps to sections. No multi-page sprawl.

## Palette (default — swap the accent per brand)
```
--bg:      #F6F5F1;  /* warm off-white ground */
--surface: #FFFFFF;  /* raised / alternating sections */
--ink:     #14140F;  /* near-black text */
--muted:   #6B6B62;  /* secondary text */
--line:    rgba(20,20,15,0.10);  /* hairline */
--accent:  #2F5E3A;  /* the ONE accent — green for landscaping; change per brand */
```
For a dark section, invert: near-black ground, off-white text, same single accent.

## Type
- Headlines: a light editorial face (e.g. **Fraunces** 300–400) OR a clean grotesk at large size.
- Body/UI: a clean sans (**Inter** / **Public Sans**), 400–600.
- Eyebrows/labels: 12–13px, UPPERCASE, letter-spacing ~0.14em, in the accent or muted.

## Keep from earlier work
- One-page layout with in-page anchor nav, mobile hamburger, sticky "tap to call" bar.
- `SITE` config block for one-edit rebranding; `LocalBusiness` JSON-LD; accessible markup.
- Clickable photo gallery at the bottom (lightbox, opens full size).

## Technical
Single self-contained `index.html` + `images/`. No build step. Fonts from Google Fonts only.
Test with Playwright (reveals, counters, scrollspy, lightbox) before shipping.
```
```
