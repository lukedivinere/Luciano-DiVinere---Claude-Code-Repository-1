# Landscaping Demo Template

A polished, single-file landing page for landscaping / lawn-care businesses.
Built to be **rebranded in minutes** and reused for every prospect you pitch.

Open `index.html` in any browser to preview — no build step, no server, no dependencies
(fonts load from Google Fonts; everything else is self-contained).

---

## Rebrand it in 4 quick edits

### 1. The `SITE` config (bottom of `index.html`, in the `<script>`)
This one block drives the business name, phone, email, service area, and hours **everywhere**
on the page — the header, hero, contact section, footer, and the sticky mobile call bar all
update automatically.

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
- `<title>` — e.g. `Client Name | Lawn Care in [City]`
- `<meta name="description">` — one-sentence pitch with the city in it
- The `LocalBusiness` JSON-LD block near the bottom — name, telephone, email, `areaServed`, hours.
  This is what helps them show up in Google's local/map results — a strong selling point.

### 3. Brand colors (top of the `<style>`, the `:root` block)
Change these five to re-skin the whole site to match a client's logo:

```css
--evergreen:#1E3324;  /* primary dark — buttons, header text */
--moss:#3F5C39;       /* secondary green accent */
--clay:#B5713F;       /* warm accent — main call-to-action */
--stone:#EDE7D9;      /* light section background */
--gold:#CC9A3E;       /* highlight on dark sections */
```

### 4. Photos (`images/` folder)
Drop the client's photos into `images/` and either reuse the existing filenames or update the
`src="..."` paths. The gallery is built for **6 photos**; the first one is the large feature tile.
Landscape orientation (roughly 4:3 or 16:9) looks best. Keep files under ~300 KB each for fast loading.

Current placeholder photos and where they appear:

| File | Used in |
|------|---------|
| `backyard-turf-patio.png` | Hero image + social share preview |
| `turf-yard-wide.png` | Gallery (large feature tile) |
| `front-xeriscape.png` | Gallery |
| `retaining-wall-steps.png` | Gallery |
| `pergola-string-lights.png` | Gallery + testimonial photo |
| `pool-rock-waterfall.png` | Gallery |

---

## Also worth tailoring per client

- **Services** — six cards in the `#services` section. Rename/add/remove to match what they offer.
- **Packages** — three pricing tiers. Update prices, or replace with "Call for pricing" if they don't post rates.
- **Testimonial** — swap in a real review and reviewer name once you have one.
- **FAQ** — five common questions; edit answers to fit the business.
- **Stats band** — "500+ yards", "12 yrs", "4.9★" — set these to real (or realistic-for-demo) numbers.

## When the site goes live

The quote form currently opens the visitor's email app with the details pre-filled (great for a demo,
works with zero setup). Before launch, point it at a real form handler like
[Formspree](https://formspree.io) or Netlify Forms so submissions land in an inbox reliably.

---

## What's built in

- Fully responsive with a mobile hamburger menu and a sticky "tap to call" bar on phones
- `LocalBusiness` structured data + Open Graph tags for SEO and clean social previews
- Subtle scroll-reveal animations (automatically disabled for `prefers-reduced-motion`)
- Accessible: keyboard-operable nav and FAQ, alt text on every photo, visible focus states
- Zero build step — one HTML file plus an `images/` folder
