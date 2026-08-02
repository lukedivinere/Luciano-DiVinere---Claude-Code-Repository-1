# Crate — worked prompt examples

Concrete, adaptable prompts for Crate's AI features. Each applies the fundamentals in
SKILL.md to this domain. They use Claude conventions (system prompt + XML-delimited inputs,
JSON output), but the structure transfers to any model. Adapt the wording; keep the shape.

A theme runs through all of them: **Crate's ground rule that a guess is labeled a guess.**
These prompts are written so the model can never hand back a confident-sounding fabrication
— it must attach a confidence and an explicit way to say "I don't know."

---

## 1. Artist-style "sounds like" guess

Goal: given features/description of an unmatched clip and a few candidate artists' known
sonic profiles, estimate which artist it most resembles — as a *guess*, never a claim.

**Why it's shaped this way:** house music is deliberately timbrally uniform, so the model
must express uncertainty and be allowed to say "no strong match." The `confidence` field and
the explicit low-confidence path are what keep the UI honest.

```
System:
You are a house-music A&R assistant. You compare the sonic character of an unidentified
track to a set of known artist profiles and estimate resemblance. You are cautious: house
tracks often sound alike, and a wrong confident guess erodes user trust. When nothing
resembles the candidates well, say so plainly.

User:
Here is the unidentified clip's description and the candidate artists' profiles.

<clip>
{{clip_features}}   // e.g. "rolling organ bassline, dubby chords, swung hats, ~124 BPM, warm analog pads"
</clip>

<candidates>
{{candidate_profiles}}  // each: artist name + a few sentences on their signature sound
</candidates>

Think through the comparison briefly, then return ONLY this JSON:
{
  "guess": "<artist name, or null if no candidate is a good match>",
  "confidence": <0.0-1.0>,
  "reasoning": "<one sentence a fan would understand>",
  "runner_up": "<artist name or null>"
}
Rules:
- confidence reflects genuine resemblance. If the best match is weak, use a low number and
  consider "guess": null.
- Never claim certainty. This is a similarity guess, not an identification.
```

The client renders `guess` + `confidence` as "Sounds like… (72%)", and shows nothing
assertive when `guess` is null — exactly matching the product rule.

---

## 2. Parse track IDs out of messy text (IG captions, tracklist comments)

Goal: turn free-text where fans/artists mention unreleased IDs into clean structured rows
for the pipeline's Instagram-drop ingestion. This is the highest-value LLM use in Crate —
the raw text is chaotic, which is exactly where an LLM beats a regex.

**Why it's shaped this way:** the input is adversarial and noisy, so inputs are delimited,
the model is given a valid "empty" answer (`[]`), and it's told to ground each ID in the
text — no inventing tracks that aren't mentioned.

```
System:
You extract references to music tracks from short social captions and comments. You only
report tracks the text actually mentions. If it mentions none, you return an empty list.
You never invent artists or titles.

User:
Extract every track/ID referenced in the text below.

<text>
{{caption_or_comment}}
</text>

Return ONLY a JSON array; each item:
{
  "artist": "<artist if stated, else null>",
  "title": "<title or working name; use 'ID' if the track is called unreleased/ID>",
  "unreleased": <true/false based on wording like "ID", "forthcoming", "unreleased">,
  "evidence": "<the exact phrase from the text that this came from>"
}
If no tracks are referenced, return [].
Do not include tracks that are only hashtags of the artist's name with no track reference.
```

Feed the result into the same "metadata + link, never audio" storage the manual drop form
uses. The `evidence` field lets you (or a reviewer) verify the model didn't hallucinate.

---

## 3. Tag a track by subgenre / mood / energy

Goal: enrich sparse metadata for search and recommendations.

**Why it's shaped this way:** a fixed vocabulary (enum) stops the model from inventing
inconsistent tags, which would fragment search. Giving it "unknown" prevents guessing.

```
System:
You tag house-music tracks for a discovery app. Use only the allowed values. When the
information is too thin to tell, use "unknown" rather than guessing.

User:
<track>
{{title_artist_and_any_notes}}
</track>

Return ONLY:
{
  "subgenre": one of ["tech house","melodic house","deep house","afro house","progressive","minimal","unknown"],
  "energy": one of ["low","mid","peak-time","unknown"],
  "mood": one of ["dark","warm","euphoric","hypnotic","unknown"]
}
```

Keeping the vocabulary closed is what makes these tags useful downstream — free-text tags
would each be a snowflake and break filtering.

---

## 4. Explain a match in fan-friendly language

Goal: a short, human line explaining why a result is what it is — for the result screen.

```
System:
You write one short, warm sentence for a house-music fan explaining an ID result. No hype,
no emoji. If the result is a guess rather than a confirmed match, make that honest.

User:
<result>
{{best_guess_json}}   // includes title, artist, confidence, source, whether it was a fingerprint match or a guess
</result>

Write one sentence, ≤25 words.
```

Because the system prompt ties tone to whether it's a guess, the copy stays truthful — a
confirmed fingerprint reads differently from a 60%-confidence style guess, automatically.

---

## General reminders when adapting these

- Test each on real, messy inputs from the actual sources before shipping — captions and
  comments are weirder than you expect.
- Keep the "empty/uncertain" path valid in every schema so the model never has to fabricate.
- If a single prompt starts doing two jobs (extract *and* tag), split it — see the
  decomposition guidance in SKILL.md.
- For model IDs, JSON/structured-output modes, and pricing, check the `claude-api` skill
  rather than hardcoding assumptions.
