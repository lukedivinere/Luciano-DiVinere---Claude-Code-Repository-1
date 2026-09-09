# Landscaping Demo Template — Modern / Bold

A dark, photo-forward landing page for landscaping / lawn-care businesses — a bolder
alternative to the [classic editorial template](../landscaping/). Same reusable
conventions, so if you've customized one you already know this one.

Open `index.html` in any browser to preview — no build step, no server, no dependencies
(fonts load from Google Fonts; everything else is self-contained).

**Look & feel:** full-bleed image hero with a green accent, dark UI, a scrolling service
ticker, icon service cards, a design-and-build feature split, and a glowing "most popular"
pricing tier. Reads as a more premium / contemporary contractor. The
[classic template](../landscaping/) is lighter and warmer — show a prospect both and let
them pick.

---

## Rebrand it in 4 quick edits

### 1. The `SITE` config (bottom of `index.html`, in the `<script>`)
One block drives the business name, phone, email, service area, and hours **everywhere** —
header, hero, contact, footer, and the sticky mobile call bar all update automatically.

```js
const SITE = {
  businessName: "Gonzalez Landscape",
  phone:        "(619) 677-4697",
  email:        "hello@gonzalezlandscape.com",
  serviceArea:  "San Diego County",
  hours:        "Mon–Sat, 7am–6pm"
};
```

### 2. The `<title>`, meta description, and JSON-LD (top + bottom of the file)
Google reads these **before** JavaScript runs, so update them by hand:
- `<title>` and `<meta name="description">`
- The `LocalBusiness` JSON-LD block near the bottom (name, telephone, email, `areaServed`, hours) —
  this helps them appear in Google's local/map results.

### 3. Brand colors (top of the `<style>`, the `:root` block)
Change these to re-skin the whole site:

```css
--bg:#10130F;       /* page background (near-black green) */
--accent:#8FD14F;   /* bright green — CTAs, highlights */
--accent-2:#CDA349; /* gold secondary highlight */
--surface:#1E241A;  /* cards */
```
Because the hero text sits on a photo, keep `--accent` bright and the background dark for contrast.

### 4. Photos (`images/` folder)
Drop the client's photos into `images/` and reuse the filenames (or update the `src` paths).
The hero is a **full-bleed background photo** — pick a wide, high-quality landscape shot for it.
The gallery is built for **6 photos** (first is the large feature tile). Keep files under ~300 KB each.

| File | Used in |
|------|---------|
| `backyard-turf-patio.png` | Hero background (full-bleed) |
| `retaining-wall-steps.png` | Design & Build feature split |
| `turf-yard-wide.png` | Gallery (large feature tile) |
| `front-xeriscape.png` | Gallery |
| `pool-rock-waterfall.png` | Gallery + social share preview |
| `pergola-string-lights.png` | Gallery + testimonial background |

---

## Also worth tailoring per client

- **Services** — six icon cards in `#services`. Rename/add/remove to match what they offer.
- **Ticker** — the scrolling green strip lists specialties; edit the `<span>`s (they're duplicated once so the loop is seamless — keep both copies matching).
- **Feature split** — the "Design & Build" section; swap copy and the photo.
- **Packages, testimonial, FAQ, stats** — same as the classic template; set real numbers and a real review.

## When the site goes live

The quote form opens the visitor's email app pre-filled (zero setup, great for a demo). Before
launch, point it at a real form handler like [Formspree](https://formspree.io) or Netlify Forms.

---

## What's built in

- Full-bleed hero with a scroll-aware sticky header (transparent → solid on scroll)
- Mobile hamburger menu + sticky "tap to call" bar
- Scrolling service ticker, hover-zoom gallery, icon service cards, glowing featured pricing tier
- `LocalBusiness` structured data + Open Graph tags for SEO and social previews
- Scroll-reveal animations, all motion disabled for `prefers-reduced-motion`
- Accessible: keyboard-operable nav and FAQ, alt text, visible focus states
- Zero build step — one HTML file plus an `images/` folder
