# OM Builder — AI Platform for Commercial Real Estate Offering Memorandums

> **One-line pitch:** Brokers plug in a property, the platform pulls the local data, writes its own prompts, and hands back a polished, slide-based Offering Memorandum in minutes instead of days.

---

## 1. The Problem

At most commercial brokerages, an Offering Memorandum (OM) — the marketing "pitch book" used to sell or lease a property — is built **by hand**, usually in PowerPoint, InDesign, or a rigid template. That means:

- A broker or analyst spends **8–20+ hours** per OM copying financials, writing narrative, pulling demographics, formatting slides, and hunting for comps.
- Every OM starts close to scratch, so quality and branding are inconsistent.
- Junior staff or expensive design help are tied up on formatting instead of deals.
- The data (rent roll, T-12, comps, demographics) already exists in scattered files — it just isn't assembled automatically.

**The opportunity:** 80% of an OM is repeatable structure + data assembly. That's exactly what software plus AI is good at. The broker's judgment is the 20% that stays human.

---

## 2. The Product Vision

A web app where a broker:

1. **Enters a property** (address + a few numbers, or uploads a rent roll / T-12).
2. The platform **auto-enriches** it with local market data (demographics, comps, aerials, maps).
3. The AI **writes its own prompts internally** and drafts every section — executive summary, investment highlights, property description, market overview, financial narrative.
4. The broker gets a **ready-to-edit slide deck** (the OM) they can tweak, re-brand, and export to PDF/PowerPoint.

The key differentiator vs. a generic AI writer: **the broker never has to know how to prompt.** The software knows what an OM needs and builds the prompts for them from the data on file. That's the "creates prompts by itself" part of your idea.

---

## 3. What Goes Into an OM (the content model)

Every OM is a predictable set of sections. This is the backbone of the product — each section becomes a slide template + a data requirement + an AI prompt the system generates automatically.

| # | Section | Data it needs | AI's job |
|---|---------|---------------|----------|
| 1 | Cover / Title | Property photo, address, offering price, broker branding | Layout only |
| 2 | Confidentiality / Disclaimer | Brokerage boilerplate | Insert firm's standard language |
| 3 | Executive Summary | Price, cap rate, NOI, property type, key stats | Write 1-paragraph pitch |
| 4 | Investment Highlights | Financials + property facts | Turn facts into 4–6 bullet selling points |
| 5 | Property Overview | Size, year built, lot, zoning, parking, units | Write descriptive narrative |
| 6 | Financial Summary | Rent roll, T-12, pro forma, cap rate, NOI, cash flow | Build tables + explain the numbers |
| 7 | Rent Roll / Lease Abstracts | Tenant names, lease terms, expirations | Summarize + flag rollover risk |
| 8 | Location / Market Overview | Demographics, traffic counts, employers, growth | Write market story from data |
| 9 | Sale & Rent Comparables | Nearby comps | Pull, format, and contextualize |
| 10 | Photos / Aerials / Maps | Images, site plan | Auto-place on slides |
| 11 | Broker Contact | Agent info | Layout only |

> **Product principle:** the section list is configurable per deal type. A multifamily OM, a retail strip OM, and a raw-land OM share ~70% of sections but differ in the financial and tenant sections. Build a **"deal type" template system** on top of the section model.

---

## 4. The AI Workflow ("prompts by itself")

This is the heart of your idea. The broker never writes a prompt. Here's how the platform generates them:

```
Broker input + enriched data
        │
        ▼
[1] Data normalization  →  structured JSON for the property
        │
        ▼
[2] Section planner     →  decides which sections apply (by deal type)
        │
        ▼
[3] Prompt factory      →  for each section, builds a targeted prompt
                           using ONLY that section's relevant data
        │
        ▼
[4] Draft generation    →  Claude writes narrative + bullets per section
        │
        ▼
[5] Assembly            →  text + data + images → slide deck
        │
        ▼
[6] Broker review/edit  →  inline edits, "regenerate this slide", tone slider
```

- **Prompt factory** is the secret sauce: a library of section-specific prompt templates that get filled with the property's real data. e.g. for Investment Highlights it feeds the model the cap rate, NOI, occupancy, and location facts and asks for "6 punchy selling bullets a buyer would care about."
- Keep a **human-in-the-loop**: every AI-written section is editable, and each slide has a "regenerate" and a "make it more/less formal" control.
- **Guardrails:** the AI never invents financial numbers — those come only from the broker's uploaded data. AI only writes *narrative* around verified figures. This is critical for trust and liability.

---

## 5. Where the "local data" comes from

Your phrase "input local data" is the enrichment engine. Sources to integrate over time:

- **Demographics & market:** U.S. Census / American Community Survey (free), plus paid options (Esri, Placer.ai, CoStar, etc.) later.
- **Maps & aerials:** Google Maps / Mapbox for maps, aerials, and location context.
- **Comparables:** start with broker-uploaded comps; integrate a comps data provider (CoStar, Crexi, Reonomy) in a later phase — these are expensive, so gate behind paid tiers.
- **Property records:** county assessor / parcel data where available.
- **Broker's own files:** rent roll (Excel), T-12 (Excel/PDF), lease docs (PDF) — parsed on upload.

> Start with the **free + broker-uploaded** sources for the MVP. Paid data APIs are a phase-2 cost/differentiation lever, not a launch blocker.

---

## 6. Recommended Tech Stack

Chosen for speed-to-MVP and being solo/small-team friendly.

| Layer | Choice | Why |
|-------|--------|-----|
| Frontend | **Next.js + React + Tailwind** | Fast, modern, great for an editor UI |
| Backend | **Next.js API routes / Node** (or Python FastAPI if you prefer) | Keep it one codebase early |
| AI | **Claude API (Anthropic)** — Opus/Sonnet | Strong long-form writing + structured output |
| File parsing | Libraries for Excel (rent roll/T-12) and PDF | Turn uploads into structured data |
| Deck generation | Start with an **HTML/slide renderer → PDF export**; add native **.pptx export** (python-pptx or similar) | Brokers want editable PowerPoint |
| Storage/DB | **Postgres** (deals, properties) + object storage for images/files | Standard, scalable |
| Auth & billing | Auth provider + **Stripe** for subscriptions | Off-the-shelf, don't build it |
| Hosting | **Vercel** (frontend) + managed Postgres | Minimal ops |

> Don't over-engineer. The MVP is a form → AI → editable deck → PDF. Everything else is iteration.

---

## 7. Build Phases (roadmap)

### Phase 0 — Validation (before writing much code)
- Interview 5–10 brokers (including your old brokerage) about their OM process.
- Collect 3–5 **real sample OMs** to reverse-engineer the exact sections and tone.
- Confirm what they'd pay and which deal type to start with (recommend **one** — e.g. multifamily or retail — not all).

### Phase 1 — MVP (the "wow" demo)
- Single deal type.
- Broker enters property basics + uploads rent roll / T-12.
- AI generates all narrative sections via the prompt factory.
- Assemble into a slide deck from a fixed, good-looking template.
- Export to PDF.
- **Goal:** turn 8+ hours of work into ~15 minutes.

### Phase 2 — Editor & Branding
- Inline slide editing, drag-to-reorder, "regenerate slide," tone control.
- Firm branding (logo, colors, disclaimer, agent info) saved per user/firm.
- Native PowerPoint (.pptx) export.
- Map/aerial auto-insertion + free demographic data enrichment.

### Phase 3 — Data & Scale
- Multiple deal types (retail, office, industrial, land).
- Paid comps/market data integrations (gated to higher tiers).
- Team accounts, shared template libraries, deal pipeline view.
- Analytics: which slides brokers edit most → improve prompts.

### Phase 4 — Moat
- Learn each firm's voice/style from their past OMs.
- Buyer-matching / distribution (email the OM to a target buyer list).
- Integrations with brokerage CRMs and listing platforms.

---

## 8. Business Model

- **SaaS subscription per seat** — e.g. tiers by number of OMs/month and by data access (free demographics vs. paid comps).
- **Per-OM credits** as an add-on for occasional users.
- **Firm/enterprise plan** — branded templates, team seats, admin controls.
- Land-and-expand: get one broker at a firm hooked, sell the office.

**Rough pricing hypothesis (validate in Phase 0):** ~$99–$299/mo per broker. An OM that saves a broker a full day easily justifies that.

---

## 9. Key Risks & How to Handle Them

| Risk | Mitigation |
|------|------------|
| AI inventing financial numbers | Hard rule: financials come only from uploaded data; AI writes narrative, never figures |
| Comps/market data is expensive | Start with free + uploaded data; gate paid APIs behind paid tiers |
| Output looks generic / "AI-written" | Learn firm's voice; strong templates; human edit layer; tone controls |
| Liability on disclaimers | Use the firm's own approved legal boilerplate; don't generate legal language |
| Brokers don't trust automation | Human-in-the-loop editing on every slide; position as a co-pilot, not a replacement |
| Big incumbents (CoStar/Crexi) | Win on speed + ease + price for the mid-market broker they underserve |

---

## 10. Immediate Next Steps

1. **Pick the first deal type** (recommend the one you know best from your brokerage days).
2. **Gather 3–5 real OMs** to define the exact section templates.
3. **Prototype the prompt factory** for 3 sections (Executive Summary, Investment Highlights, Property Overview) against one real property's data.
4. **Build the Phase 1 MVP** flow: form + upload → AI draft → template deck → PDF.
5. **Demo it to your old brokerage** and get 2–3 design partners.

---

*This is a living plan. As we validate with real brokers, sections, pricing, and phases should get sharper. The next commit that matters is a working prototype of the prompt factory on one real property.*
