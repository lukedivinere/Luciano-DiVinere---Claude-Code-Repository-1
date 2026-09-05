# Spec 003 — Monetization

Framework: three-stage build framework. Gating mode: **soft**. Business-model pass, so
Stage 3 is a comparison artifact rather than a UI prototype.

---

# Stage 1 — Interview

## How Shazam actually made money

Two legs, and both are worse for you than they were for them.

**1. Affiliate referral.** The main engine. Shazam sent over a million visitors a day to
iTunes, Apple Music, Spotify, Deezer and Tidal, earning per-acquisition fees on purchases and
signups. This worked in an era when identifying a song led to *buying* it for around $1.29.

**2. Advertising.** 450+ brand campaigns (Pepsi, Nike among them) at roughly
$75,000–$200,000 per campaign, plus in-app display. A genuine multi-million-dollar line, and
by some accounts what finally pushed them into profitability after 14 years.

## The number that should reframe your plan

Shazam had **around 400 million annual active users in 2017 — and lost $19.4 million that
year.** Gross profit was £38.4m, up only 2.3% year over year, while admin expenses jumped 35%
to £56.3m. Apple bought them for roughly $400 million, and profitability arrived in 2018
largely as a consequence of being owned by Apple, not of the standalone model working.

Sources conflict somewhat on which years were profitable — gross profit and net result are
different things and get reported loosely. But the shape is not in dispute: **enormous scale,
thin monetization, sold rather than solved.**

Treat Shazam's model as a cautionary tale, not a template.

## Why neither leg transfers

**Affiliate is structurally weaker now.** Shazam's referral economics were built on download
purchases. Music moved to streaming, where a referral is worth a fraction of a sale. The leg
that carried Shazam has largely rotted.

**Advertising is a scale business you will not have.** Selling $200k brand campaigns requires
hundreds of millions of users and a sales team. At 20,000 niche users you cannot run that
play, and programmatic ads at small scale pay almost nothing while wrecking the product feel.

## What you have that Shazam did not

1. **Your users still buy music.** Beatport, Bandcamp, Traxsource, vinyl. DJs and serious
   house listeners are among the last audiences that purchase individual tracks. Affiliate
   economics that collapsed for mainstream music are still alive in dance music.

2. **You have a B2B side.** Shazam's users were consumers. You have artists and labels, and
   they have budgets. Played-by data — where a track is being played, by whom, how often — is
   an A&R product. Nobody else can produce it for unreleased music.

3. **Niche beats scale on willingness to pay.** 20,000 obsessive house heads at $4/month is
   better revenue than two million casual users at zero, and vastly cheaper to serve.

## Open question that changes the recommendation

Is this a business you intend to live on, or a project you want to sustain itself? A
sustainable niche product and a venture-scale company imply different choices. This spec
assumes the former, which is the right default until demand is proven.

---

# Stage 2 — The plan

## Principle: the core loop is free, permanently

Recording, identifying, and community naming must never be paywalled. Those actions generate
the cluster database, which *is* the product. Charging for them shrinks the asset you are
trying to build. Monetize around the loop, never inside it.

## Revenue streams, in build order

### 1. Affiliate links — build first

Every resolved track links to Beatport, Bandcamp, Traxsource, or the artist's own store.

Zero friction, no user cost, and it directly satisfies the existing ground rule *always send
people to the artist*. Revenue is modest per click but the audience converts unusually well
because DJs buy tracks to play them. This is the only stream that costs nothing to add and
annoys nobody.

### 2. Artist and label tier — the real revenue

Paid accounts for producers, labels, and managers:

- Analytics: where a track is being played, by whom, how often, trending over time
- Verified claim and reveal scheduling
- Promo placement for upcoming releases
- Export and reporting

*"Your unreleased track was captured 47 times across 12 sets"* sells itself to an artist
sitting on an unreleased ID. Labels pay for A&R signal, and this is signal that exists
nowhere else. Price as B2B, not consumer.

This is almost certainly your largest line, and it is a direct consequence of the played-by
feature.

### 3. Consumer premium — later

A modest subscription, roughly $3–5/month:

- Release alerts when an ID you caught finally drops
- Full played-by history and set exploration
- Export to Rekordbox, Beatport cart, playlists
- Offline capture queue and higher ID limits

Keep the free tier genuinely useful. The premium tier should feel like depth for enthusiasts,
not like a hostage negotiation.

### 4. Aggregate trend data — proceed carefully

Labels would pay for "what is breaking in house right now." The data is yours in aggregate.

**But this conflicts with your ground rules.** Selling intelligence about unreleased tracks is
close to selling leaks, and it can destroy the artist trust that makes the whole platform
legally and socially viable. If you ever do this, it should be opt-in on the artist side and
aggregate only — never track-level unreleased data sold without the artist's consent.

Flagged as a real tension, not a settled decision.

### 5. Advertising — no

Not at your scale, not with your aesthetic, and not with this audience. Revisit only if you
somehow reach millions of users, and probably not even then.

## What not to do

- Don't paywall identification. It is the loop that builds the asset.
- Don't monetize before demand is proven. Everything here is contingent on people actually
  recording and contributing, which remains untested.
- Don't take label money in exchange for surfacing tracks. The moment placement is for sale,
  the community stops trusting the data, and the data is the company.

## Sequencing

| Phase | Move | Prerequisite |
|---|---|---|
| Now | Nothing. Prove people contribute. | — |
| Early | Affiliate links on resolved tracks | Working ID pipeline |
| Mid | Artist and label tier | Played-by data with volume |
| Later | Consumer premium | Enough depth that premium is worth buying |
| Maybe never | Aggregate data licensing | Artist consent model |

## Success criteria

- Affiliate: measurable click-through to purchase on resolved tracks
- Artist tier: paying artists retained past three months, which tests whether the analytics
  are genuinely useful rather than novel
- Consumer premium: conversion without a drop in free-tier contribution rate — if premium
  cannibalizes community naming, it is destroying more value than it earns

## Open risks

1. Demand is unproven. Every line above is contingent.
2. Artist tier depends on played-by volume, which depends on capture-time set context being
   collected from day one.
3. The data-licensing tension above is unresolved and could damage artist relations
   permanently if handled badly.
