# Brothers Landscape — new website

A modern replacement for the outdated brothers-landscape.com (El Cajon, CA).
Built on the Classic landscaping template. Open `index.html` in any browser — no build step.

## Real info used
- **Business:** Brothers Landscape — El Cajon, CA (San Diego County)
- **Phone:** (619) 654-6887 (from public listing)
- **Services:** the full 21-service list from the current site, grouped into 6 categories
  (Lawn Care & Mowing · Lawn Installation · Sprinklers & Irrigation · Landscape Design ·
  Retaining Walls · Cleanup & Seasonal Care)

## Placeholders to confirm before launch
- **Email** — using `info@brothers-landscape.com` as a guess (in the `SITE` config + JSON-LD)
- **Hours** — using `Mon–Sat, 7am–6pm`
- **Photos** — reusing generic SoCal landscaping stock; swap in Brothers Landscape's own job photos
- **Reviews** — the testimonial is a clearly-labeled placeholder; swap in a real Yelp/Google review
- **Stats band** — "20+ services / Free estimates / El Cajon / Licensed & insured" (adjust as needed)
- **Quote form** — opens the visitor's email app; wire to Formspree/Netlify Forms at launch

## To rebrand / update
Edit the `SITE` config block at the bottom of `index.html` (name, phone, email, service area, hours),
then the `<title>`, meta description, and the `LocalBusiness` JSON-LD near the bottom. Brand colors are
the CSS variables at the top of the `<style>`. Full guide: `../../templates/landscaping/README.md`.
