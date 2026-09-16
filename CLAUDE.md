# Working agreement

## Autonomy
- Work hands-off. Don't ask for approval on routine coding: edits, running
  tests/linters, git add/commit/push to the working branch, installing deps.
- Escalate to the user ONLY when the project hits a real wall that is
  important and needs their decision (an architectural fork with no clear
  right answer, a destructive/irreversible action, blocked access, or a
  requirement that conflicts with what was asked). When escalating, state the
  blocker, the options, and a recommendation — enough to decide in one reply.

## Standard of care (accuracy first)
- Never claim something works without having run it. Tests or a real
  invocation back every "done."
- When a result looks off, stop and verify before building on it. Re-run,
  add a check, or reduce to a minimal repro rather than assuming.
- Report faithfully: if a test fails, say so with the output; if a step was
  skipped or blocked (e.g. by network policy), say that plainly. No hedging
  when verified, no false confidence when not.
- Keep changes minimal and reviewable. Prefer small, tested increments over
  large speculative ones.

## This repo
- Develop on the branch assigned for the session; commit with clear messages
  and push there. Don't push to `main` without explicit permission.
- `market-intel/` is the Daily Stock Market Intelligence Agent: a
  research/aggregation tool that only collects, ranks, and reports. It must
  never place trades or present output as investment advice.
- `ai-stock-trading-claude/` is a cloned reference repo (gitignored) — a
  source to borrow patterns from, not part of this project.
- Secrets live in `.env` (gitignored). Never commit API keys; `config.py`
  holds only non-secret settings.
