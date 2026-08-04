# Spec 003 — Agent SDK skill

**Framework:** three-stage build framework. **Gating mode:** soft. **Run mode:** autonomous
(author away; open questions answered with recommended defaults and marked as assumptions).

The deliverable is a **skill** — `.claude/skills/agent-sdk/` — that lets Claude help build
applications on the **Claude Agent SDK** (the Python/TypeScript library that exposes Claude
Code's agent loop, tools, and context management as a library). This spec designs that skill.

Grounded in the official docs fetched during authoring: `code.claude.com/docs/en/agent-sdk/*`.

---

## Stage 1 — System Architect Interview

_No design or code here — surfacing what the skill must actually do and where it will fail._

### Purpose

- **The job, in one sentence:** when someone is building an agent on the Claude Agent SDK,
  give Claude the accurate API surface and the load-bearing patterns so it writes correct,
  idiomatic SDK code instead of plausible-looking fiction.
- **Who has this problem today, and what do they do instead?** Developers wiring up the
  Agent SDK. Today Claude answers from training memory — and the SDK is new (renamed from the
  Claude Code SDK in late 2025) and moves fast, so memory is exactly where hallucinated
  function names and stale option fields come from. The alternative is the developer
  hand-feeding docs into context every time.
- **How we know it worked (measurable signal):** SDK code Claude produces under the skill
  uses real symbols (`query`, `ClaudeSDKClient`, `ClaudeAgentOptions`, `tool`,
  `create_sdk_mcp_server`) with correct option names and runs without `AttributeError` /
  `is not a function`. The failure this kills is confidently-wrong API calls.

### What this skill actually is

**A correctness anchor against a moving target.** The value is not "explains what an agent
is" — Claude can do that. The value is pinning the *exact current* names and shapes so the
code compiles, and encoding the handful of patterns that are easy to get subtly wrong
(in-process MCP tools, permission modes, subagents, streaming vs. one-shot).

### Boundaries

- **Explicitly not in this:** teaching agent theory from scratch; the Anthropic Messages
  API / Client SDK (that's a *different* product — direct API calls where you write the tool
  loop yourself); Managed Agents (hosted product). The skill must actively *disambiguate*
  these, because conflating them is the most common category error.
- **Smallest version that tests the core idea:** a `SKILL.md` that (a) routes "which Claude
  tool do I even want?", (b) gives the minimal correct `query()` example in both languages,
  and (c) points to per-language reference files for the full surface.

### Data

- **In / stored / discarded:** the skill is static reference text. No runtime data, no user
  data, nothing personal or copyrighted (API facts + original prose).
- **Retention rule / what breaks later:** the real "data" risk is **staleness**. The SDK
  changes; pinned signatures drift. If the skill hardcodes, say, a model ID or a today-only
  option and never re-checks, it becomes confidently wrong — worse than absent. Mitigation is
  structural (below): the skill must tell its reader when to *verify against live docs*
  rather than trust the page.

### Failure

- **When the primary path returns nothing** (reader needs a symbol the skill doesn't list):
  the skill must send them to the official reference or the `claude-api` skill, not invite a
  guess.
- **Which failure is more expensive: wrong answer or no answer?** A **wrong** answer, by a
  lot. "I don't have that memorized — here's where it's authoritative" costs a lookup.
  A fabricated `ClaudeAgentOptions(auto_approve=True)` costs a debugging session and erodes
  trust in every other line. The whole skill is built to prefer honest gaps over confident
  fabrication — the same discipline as the prompt-engineering skill's "a guess is a guess".
- **What must never happen:** presenting an invented API as real, or blurring the Agent SDK
  with the Client SDK so the reader writes their own tool loop when the SDK already runs one.

### Constraints

- **Skill/maintenance reality:** maintained by one person (the author) plus Claude. So it
  must be cheap to keep correct — lean core, per-language reference files, and explicit
  "verify this" pointers rather than an exhaustive mirror of the docs that rots on day one.
- **Platform:** loads from `.claude/skills/` like any project skill.

### Assumptions

| Assumption | Status |
|---|---|
| The pinned API surface (fetched from official docs at authoring) is currently accurate | **Verified** against `code.claude.com/docs` during authoring |
| The SDK will change and pinned specifics will drift | **Verified** (it was renamed and versions actively; treat as certain) |
| Disambiguating Agent SDK vs Client SDK vs Managed Agents prevents the most costly errors | Untested, but strongly supported by the docs leading with exactly that comparison |
| Per-language reference files (Python/TS split) beat one blended file | High confidence — the two APIs differ enough (snake_case vs camelCase, Zod vs dict schemas) that blending them is itself an error source |
| A reader will actually verify against live docs when told to | **Untested — highest-value risk.** If ignored, staleness silently reintroduces the exact failure the skill exists to prevent |

**The assumption that would hurt most if wrong:** the last one. The skill's honesty about its
own staleness is load-bearing; if readers treat a pinned signature as eternal truth, the skill
becomes a confident liar the moment the SDK ships a breaking change. Hence the design leans on
"verify when it matters" pointers, not just a wall of current facts.

---

## Stage 2 — Tech Stack & Scope Spec

### Problem statement

Developers building on the Claude Agent SDK need Claude to generate correct, idiomatic SDK
code. The SDK is young and fast-moving, so Claude's trained memory is an unreliable source for
exact symbol names and option shapes, and it is easily confused with two adjacent Anthropic
products that solve different problems. The result is code that looks right and fails at
import time, and architecture advice that sends people to reimplement what the SDK already
provides.

### In scope

- **Product disambiguation** up front: Agent SDK vs Claude Code CLI vs Client SDK vs Managed
  Agents, with a one-line "use this when" for each.
- **Minimal correct entry points**, both languages: one-shot `query()` and stateful
  `ClaudeSDKClient` (Python) / the `Query` object (TS).
- **The core option surface**: `ClaudeAgentOptions` / `Options` — system prompt, allowed/
  disallowed tools, `permission_mode` with its real enum, `mcp_servers`, `agents` (subagents),
  `hooks`, `model`, `cwd`, `setting_sources`, sessions (resume/fork).
- **Custom tools / in-process MCP**: `@tool` + `create_sdk_mcp_server` (Python), `tool()` +
  `createSdkMcpServer()` (TS), including the `mcp__<server>__<tool>` naming rule.
- **The load-bearing patterns**: permission modes and human-in-the-loop, subagents, hooks,
  streaming vs. one-shot, sessions.
- **Per-language reference files** for the fuller surface, kept behind the lean core.
- **Explicit "verify against live docs" pointers** at every place staleness bites (model IDs,
  new options), plus a cross-reference to the `claude-api` skill for model/pricing facts.
- **A pushy trigger description** so it fires on "build an agent", "claude-agent-sdk",
  `create_sdk_mcp_server`, permission-mode questions, etc.

### Out of scope

- The Anthropic Messages API / Client SDK tool-use loop — named only to disambiguate, then
  the reader is pointed at the `claude-api` skill / platform docs.
- Managed Agents internals.
- An exhaustive mirror of every option and message type — deliberately delegated to the live
  reference, because mirroring it is what rots.
- Model IDs and pricing — owned by `claude-api`; this skill links rather than restates.
- Framework comparisons (LangGraph, etc.) and non-Claude providers.
- MCP protocol internals beyond what the SDK exposes.

### Stack

| Layer | Choice | Why | Rejected |
|---|---|---|---|
| Packaging | Claude skill in `.claude/skills/agent-sdk/` | Loads automatically in-project like `prompt-engineering`; progressive disclosure keeps the core lean | A standalone `docs/` markdown — wouldn't auto-trigger when Claude is actually writing SDK code |
| Structure | Lean `SKILL.md` + `references/{python,typescript,patterns}.md` | The two languages diverge enough that one blended file breeds errors; splitting matches the skill-creator domain-organization pattern | One giant SKILL.md — blows the ~500-line budget and forces every trigger to load the whole surface |
| Source of truth | Official docs fetched at authoring, with verify-pointers | Accuracy now, honesty about drift later | Training memory alone — the exact thing that produces hallucinated APIs |
| Examples | Both Python and TS, minimal and runnable | The SDK ships both as first-class; readers arrive in either | One language — silently strands half the audience |

Reversibility: cheap. It's text; edits are a commit. The one thing expensive to *undo* is
trust — so the correctness/verify discipline is the part that must not slip.

### Architecture

```
.claude/skills/agent-sdk/
├── SKILL.md                     # pushy trigger + disambiguation + minimal entry points
│                                # + pointers into the references
└── references/
    ├── python.md                # query / ClaudeSDKClient / ClaudeAgentOptions / @tool /
    │                            # create_sdk_mcp_server / permission callbacks / message types
    ├── typescript.md            # query / Query / Options / tool() / createSdkMcpServer /
    │                            # canUseTool / message types
    └── patterns.md              # permissions & human-in-loop, subagents, hooks, MCP,
                                 # sessions, streaming vs one-shot, one-shot-vs-stateful choice
```

Load path: metadata (always) → SKILL.md (on trigger) → the one reference file the task needs.
A Python task never pays for the TS surface, and vice versa.

### Failure behavior

| Condition | Behavior |
|---|---|
| Reader needs a symbol not in the references | Point to official reference URL / `claude-api` skill; do not invent |
| Question is really about the Client SDK (writing your own loop) | Say so explicitly, redirect; don't answer as if it were the Agent SDK |
| A pinned signature may have drifted | The verify-pointer tells the reader to confirm against live docs before relying on it |
| Model ID / pricing asked | Defer to `claude-api`; don't hardcode a model that ages out |
| Both languages plausible | Show both, or ask which; never assume silently |

### Success criteria

- SDK code produced under the skill uses **real** symbols with correct option names — zero
  invented-API failures on the core surface (`query`, `ClaudeSDKClient`, `ClaudeAgentOptions`,
  `tool`, `create_sdk_mcp_server`, `permission_mode` values).
- The skill correctly routes ≥90% of "which Claude tool do I want" cases to Agent SDK vs
  Client SDK vs Managed Agents.
- `SKILL.md` stays under ~200 lines; each reference file stays focused and skimmable.
- Every staleness-prone claim carries a verify-pointer.

### Open risks

- **Staleness is the existential one** (carried from the interview's top untested assumption).
  The SDK will move; the mitigation is structural honesty, not a promise to be eternally
  current. Re-run this spec's authoring fetch when the SDK ships a major version.
- **Verify-pointers get ignored**, silently reintroducing hallucination-via-staleness. Partly
  a wording problem — the pointers must explain *why* (the API moves), per the prompt-
  engineering principle of explaining the reason rather than issuing bare MUSTs.
- **Over-triggering**: a description tuned too broad fires on generic "build an agent" that
  meant a non-Claude stack. Tuned in the trigger wording; acceptable failure (a skimmed,
  ignored skill) is far cheaper than the under-trigger it's guarding against.
