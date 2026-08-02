---
name: prompt-engineering
description: >-
  Write, structure, debug, and improve prompts for LLMs (Claude, GPT, Gemini, etc.).
  Use this skill whenever the user is writing or refining a prompt, designing an AI/LLM
  feature, wiring up an API call to a model, getting bad or inconsistent model outputs,
  building an agent or tool, extracting structured data from messy text with an LLM,
  classifying or summarizing with a model, or asking "why is the model doing X / how do I
  get it to do Y" — even if they don't say the words "prompt engineering". Also use it for
  Crate's AI features (artist-style "sounds like" guesses, parsing track IDs out of
  captions/comments, tagging tracks). Reach for it any time the quality of a model's output
  is what's being worked on.
---

# Prompt Engineering

A prompt is a spec you hand to a very capable, very literal collaborator who has no memory
of your intent beyond the words in front of it. Most "the model is dumb" problems are
actually "the spec was ambiguous" problems. This skill is about writing that spec well and
improving it empirically.

The goal is not clever wording tricks. It's clarity, structure, and iteration.

## The one habit that matters most

**Look at real outputs and fix what's actually wrong.** Prompt engineering is empirical.
Write a first version, run it on 5–10 real inputs (especially messy/edge ones), read the
failures, and change the prompt to address what you saw — not what you imagine. Almost
every good prompt is version 3, not version 1. If you take nothing else from this skill:
*don't theorize about prompts in the abstract; test them on real cases and iterate.*

## Start by defining "good"

Before writing the prompt, get concrete about the target. You can't steer toward a goal
you can't describe.

- What does a great output look like? Write one out by hand if you can — it often becomes
  a few-shot example.
- What makes an output *wrong* here? (Too long? Made-up facts? Wrong format? Missed an
  edge case?) These become your constraints and your eval checks.
- Who/what consumes the output — a human reading prose, or code parsing JSON? This decides
  format.

## Anatomy of a strong prompt

Not every prompt needs every part, but this is the checklist to draw from. Order roughly
matches how to lay it out.

1. **Role / context** — who the model is acting as and the situation. Sets vocabulary and
   priors. "You are a house-music A&R assistant" primes better than nothing.
2. **Task** — the single, specific thing to do, stated plainly. One clear instruction beats
   three vague ones.
3. **Inputs** — the actual material, clearly delimited so the model can tell instructions
   from data (see "Delimit your inputs").
4. **Constraints** — length, tone, what to avoid, what to do when unsure. Say what *to* do,
   not just what not to do.
5. **Output format** — exact shape. Show it. For machine consumption, specify it rigidly
   (see "Controlling output format").
6. **Examples** — one to three input→output pairs. Often the highest-leverage thing you can
   add (see "Show, don't just tell").
7. **Room to think** — for anything requiring reasoning, let the model work before it
   commits to an answer (see "Give the model room to think").

## Core techniques

### Be specific and concrete
Vague prompts get vague results. "Summarize this" → "Summarize this DJ-set writeup in 3
bullet points for a house-music fan, naming any tracks mentioned." Replace adjectives with
observable criteria: not "make it good," but "under 50 words, no emoji, mention the artist."

### Show, don't just tell (few-shot examples)
Demonstrating the behavior you want is usually more reliable than describing it. Two or
three examples that cover the *variety* of inputs (including a tricky one) teach format,
tone, and edge handling at once. Make examples match the real task exactly — the model
copies their patterns, including mistakes. If outputs must be consistent, examples are the
strongest lever you have.

### Give the model room to think
For reasoning, extraction from ambiguous text, math, or judgment calls, asking for the
answer immediately forces a guess. Instead invite reasoning first: "Think step by step,
then give your answer," or ask for a scratchpad section before the final result. Then, if
a caller needs just the answer, have the model put the final result in a clearly marked
place (e.g., a JSON field, or after a `FINAL:` marker) you can extract. Quality usually
jumps; the cost is more tokens/latency, so reserve it for tasks that need it.

### Delimit your inputs
When a prompt mixes instructions with user-supplied or pasted content, mark the content
clearly so the model doesn't confuse the two — and so injected text in the data can't
easily hijack your instructions. XML-style tags work especially well with Claude:

```
Extract the track IDs mentioned in the comment below.

<comment>
{{user_comment}}
</comment>
```

This also makes prompts easier to template and to read.

### Controlling output format
If code consumes the output, be strict and unambiguous:
- State the exact schema and give a filled-in example of it.
- Ask for *only* the structured output, nothing around it ("Return only the JSON, no
  prose").
- Prefer a native structured-output / JSON mode or tool call if the API offers one — it's
  more reliable than hoping for clean JSON from free text.
- Decide what an empty/uncertain result looks like *in the schema* (e.g., `"tracks": []`),
  so the model has a valid way to say "nothing here" instead of inventing.

### Reduce hallucination / keep it grounded
- Give the model an explicit out: "If the answer isn't in the provided text, say you don't
  know." Models invent when they feel forced to answer.
- Ask it to ground claims in the source ("quote the line that supports each ID").
- Keep it to what's provided: "Use only the set description above; don't rely on outside
  knowledge" when that's what you want.
- This directly serves any product rule that a guess must be labeled a guess.

### Decompose complex tasks
If one prompt is trying to do five things, it'll do them all mediocrely. Split into a chain
where each step has one job and feeds the next (e.g., *extract candidate track names* →
*normalize/dedupe* → *format*). Each step is easier to prompt, test, and debug. Reach for
decomposition when a single prompt keeps dropping one of its several requirements.

### Positive instructions beat prohibitions
"Respond in plain sentences" works better than "don't use markdown." Tell the model the
behavior you *want*; a wall of "don'ts" leaves it guessing what's left.

## A tight workflow

1. Define "good" (above) and jot 5–10 real test inputs, including messy ones.
2. Draft the prompt from the anatomy checklist — start simple, don't over-engineer.
3. Run it on the test inputs. Read every output.
4. For each failure, ask *why*: ambiguous instruction? missing example? format not pinned?
   too much in one prompt? Fix that specific cause.
5. Re-run. Stop when it's reliably good across the set, not just on the easy case.
6. Keep the prompt as lean as it can be while staying reliable — every extra sentence is
   something the model has to weigh, and bloated prompts drift.

## Common failure modes and the fix

| Symptom | Usual cause | Fix |
|---|---|---|
| Inconsistent format | Format described, not shown | Add 2–3 examples; pin exact schema |
| Ignores part of the request | Too many asks in one prompt | Decompose, or number the requirements |
| Makes things up | No "I don't know" option; forced to answer | Give an explicit out; require grounding |
| Too verbose / preamble | No length or "answer only" constraint | "Return only X, ≤N words" |
| Right idea, wrong details | Answered before thinking | Add a reasoning step before the answer |
| Follows injected text in data | Instructions and data not separated | Delimit inputs; keep authority in the instructions |
| Good on your example, bad in the wild | Overfit to one happy-path case | Test on varied/edge inputs; generalize |

## Evaluating prompts

For anything that runs more than a few times, keep a small set of input→expected pairs and
re-check the prompt against them whenever you change it (or the model). Even 10 cases catch
regressions you'd never spot by eyeballing one output. For subjective tasks (tone, style),
human spot-checks are fine; for objective ones (did it pull the right IDs?), a quick script
that checks each case is faster and more honest than re-reading.

## Model / provider notes

Principles here transfer across models. A few conventions in the examples lean Claude
(XML-tag delimiters, system-vs-user roles). For anything version- or API-specific — model
IDs, structured-output modes, token limits, pricing, caching — consult the `claude-api`
skill for Claude, or the relevant provider's docs, rather than guessing from memory.

## Crate-specific playbook

The house-music-ID app leans on LLMs in a few places. See
`references/crate-examples.md` for worked, copy-adaptable prompts covering:

- **Artist-style "sounds like" guesses** — and how to make the model *always* frame them as
  guesses with a confidence, honoring the product's "a guess is labeled a guess" rule.
- **Parsing track IDs out of messy text** — Instagram captions, 1001Tracklists comments,
  set descriptions — into clean structured data (the pipeline's IG-drop ingestion).
- **Tagging tracks** by subgenre/mood/energy from sparse metadata.
- **Explaining a match** in fan-friendly language.

Read that file whenever you're writing or debugging a prompt for one of Crate's AI
features — it applies everything above to this specific domain.
