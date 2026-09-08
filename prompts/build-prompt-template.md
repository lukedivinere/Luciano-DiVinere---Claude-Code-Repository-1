# Build prompt template

Fill this in and paste it. The order matters — constraints before task, reasoning before
instruction, criteria before you let it start.

---

```
[ONE SENTENCE: what we're building and why it exists]

Start in plan mode. Show me the plan before writing code.

## Hard constraints — do not violate

1. [Rule that must never be broken]
2. [Rule that must never be broken]
3. [Rule that must never be broken]

If a later instruction conflicts with any of these, stop and flag it rather than
resolving it yourself.

## Context

[What already exists. Which files. What this connects to.]

## Real examples

[Actual data, actual strings, actual edge cases. Not descriptions of data.]

Expected behaviour for each:
- [input] → [output]
- [input] → [output]
- [input that should produce nothing] → nothing

## Build

[What to build, in order. Each item concrete enough to be wrong.]

## Decisions already made, and why

- [Choice] because [reason]. Rejected [alternative] because [reason].
- [Choice] because [reason]. Rejected [alternative] because [reason].

## Out of scope

- [Thing it might helpfully add that I don't want]
- [Thing that belongs in a later phase]

## Acceptance criteria

Write tests alongside the code.

1. [Something a test could actually assert]
2. [Something a test could actually assert]
3. [An edge case that should fail gracefully]
4. Existing tests still pass.

## How I want you to work

- Plan first, wait for my approval.
- Explain the why as you go — I'm still learning this codebase.
- Prefer boring, well-documented libraries. Tell me the cost before adding a
  heavy dependency.
- Build [the risky part] and its tests before [the visible part].
- Check every screen at 390px before calling it done.
- Small commits, plain-language messages.
```

---

# Why each section is there

## Constraints first, with a conflict clause

The single highest-value move. Rules stated at the top, before the task, with explicit
permission to stop rather than resolve conflicts. Without the conflict clause, a model that
hits a contradiction picks one and continues — quietly. With it, you hear about it.

## Real examples, not descriptions

"Handle messy captions" produces a parser built against imagined input. The actual string
`@pratomo.aldo campo alegre - unreleased` produces one built against reality.

Always include at least one example that should produce **nothing**. Negative examples do more
work than positive ones, because over-eager extraction is the default failure.

## Reasoning, not just instruction

"Put Beatport above iTunes" gets followed once. "Put Beatport above iTunes because this
audience buys there and it's the affiliate link that earns" gets applied consistently to the
forty decisions you didn't think to specify.

This is the difference between a prompt that produces what you asked for and one that produces
what you meant.

## Out of scope

Models are helpful by default, and helpfulness expresses itself as building more than you
asked. An out-of-scope list is the only reliable brake. If yours is empty, you haven't decided
anything yet.

## Verifiable acceptance criteria

"Make it clean" is unfalsifiable. "Assert the uploaded file is deleted after extraction" is
checkable. Every criterion should be something a test could pass or fail.

The test is: could someone else tell whether this was met, without asking you?

## Never say "be precise" or "be confident"

Adjectives about quality do nothing. Precision comes from constraints that can't be misread
and criteria that can be verified. If you find yourself reaching for an adjective, you have an
unstated requirement — find it and write it down instead.

---

# The shortcut that matters most

**Put your specs in the repo.**

Once `/specs/spec-005.md` exists in the project, your prompt collapses to:

```
Implement Phase 2 from /specs/spec-005-expansion-roadmap.md.
Plan first. Flag anything in the spec you think is wrong before you start.
```

Long prompts are what you write when the context isn't written down. Write it down once, and
you stop writing long prompts.

That last line — *flag anything you think is wrong* — is worth keeping in every prompt. It's
the cheapest way to catch a bad decision before it becomes code.

---

# The five questions to ask yourself before writing anything

From the architect interview. If you can answer these, the prompt writes itself.

1. **What is the job, in one sentence?**
2. **What's explicitly not in this?**
3. **What happens when it fails or finds nothing?**
4. **What must never happen?**
5. **What am I assuming that I haven't verified?**

Question 5 is the one people skip and the one that costs the most.
