# Claude Agent SDK — patterns

The handful of things that are easy to get subtly wrong. Language-specific symbol details live
in `python.md` / `typescript.md`; this file is the *when and why*.

## Contents
- One-shot vs. stateful
- Permissions & human-in-the-loop
- Subagents
- Hooks
- MCP (in-process vs. external)
- Sessions (resume / fork)
- Streaming vs. buffered

---

## One-shot vs. stateful — pick deliberately

| Use | When |
|---|---|
| `query()` (Py & TS) | A single task with no follow-up that needs prior context. Fire, iterate the messages, done. |
| `ClaudeSDKClient` (Py) / a kept-alive `Query` with streamed input (TS) | A conversation: later turns depend on earlier ones, or you need to interrupt / swap model / change permission mode mid-run. |

The common mistake is calling `query()` again for turn two and wondering why the agent forgot
turn one — a fresh `query()` is a fresh context. If turns relate, hold one stateful session.

## Permissions & human-in-the-loop

Permission modes set the default posture; a callback makes per-call decisions. Escalating
order of autonomy:

1. `plan` — read-only; the agent proposes, touches nothing. Good for "show me what you'd do".
2. `default` — standard prompting.
3. `acceptEdits` (Python) — auto-accept file edits, still gated elsewhere.
4. `bypassPermissions` / `allowDangerouslySkipPermissions` — no checks. Reserve for sandboxed,
   fully-trusted runs; never on a path that can touch prod or user data.

For real human-in-the-loop, use the callback (`can_use_tool` / `canUseTool`) instead of
bypassing. It runs before each tool call and returns allow/deny — and on allow you can rewrite
the tool input (redact a secret, clamp a limit) rather than accept it as-is. That's the
control point where you enforce your own safety rules, log, or prompt a human.

**Rule of thumb:** the more the agent can do irreversibly, the more you want a callback, not a
broader mode. Broad modes are convenience; callbacks are control.

## Subagents

Define specialized agents and let the main loop delegate focused subtasks to them. Two ways to
supply them:

- **Programmatically** via the `agents` option (`AgentDefinition` in Python, `AgentDefinition`
  record in TS): give each a `description`, `prompt`, and optionally its own `tools`, `model`,
  `skills`, `permissionMode`, `maxTurns`, and `background`.
- **From the filesystem** — `.claude/agents/*.md`, loaded when `setting_sources` /
  `settingSources` includes the relevant tier (same mechanism as Claude Code).

Why bother: a subagent gets its **own context window** and a **narrowed toolset**. Use one to
keep a noisy subtask (large search, log-scraping) out of the main agent's context, or to
sandbox a step to read-only tools. The cost is orchestration and tokens — don't spawn a
subagent for something a single tool call does.

Give each subagent the *least* tools it needs; a reviewer subagent with write access is a
footgun.

## Hooks

Hooks run *your* code at lifecycle points (e.g. before/after a tool call, on session events).
Configured via the `hooks` option, keyed by event. Reach for them to:

- enforce policy the model shouldn't be trusted to self-enforce (block writes outside a dir),
- add logging/telemetry around tool calls,
- inject or transform context at a fixed point.

Hooks vs. a permission callback: the callback's job is *approve/deny/rewrite a tool call*;
hooks are the broader "run code at this lifecycle moment" mechanism. If all you want is to gate
tools, the callback is the sharper instrument.

## MCP — in-process vs. external

The SDK is a first-class MCP client. Two shapes:

- **In-process (SDK) MCP server** — `create_sdk_mcp_server` / `createSdkMcpServer`. Runs inside
  your process; the fastest, simplest way to expose *your own* functions (call your API, query
  your DB). No subprocess, no IPC. Default choice for custom tools.
- **External MCP servers** — configured in `mcp_servers` / `mcpServers` as external processes/
  endpoints. Use for existing third-party MCP servers you don't want to reimplement.

Both surface tools under the `mcp__<server-key>__<tool-name>` name, which is what you list in
`allowed_tools` / `allowedTools`. The single most common "my tool never runs" bug is a mismatch
between the server key, the tool name, and that allow-list entry.

## Sessions — resume & fork

Runs can be persisted and picked back up:

- **Resume** — set `resume=<session_id>` to continue a prior conversation with its context.
- **Fork** — add `fork_session=True` / `forkSession: true` to branch from that point instead of
  continuing linearly, so you can explore an alternative without disturbing the original.

Python also exposes `list_sessions` / `get_session_messages` / `get_session_info` /
`rename_session` / `tag_session` for managing stored sessions. Use forking to try a different
approach from a known-good checkpoint rather than re-running from scratch.

## Streaming vs. buffered

The message iterator is your event stream: assistant text, tool-use, tool results, and a final
result message arrive as the agent works. For token-level partials, set
`include_partial_messages=True` (Python) and read `StreamEvent`s / partial message events.

For a responsive UI, render from the stream as messages arrive rather than awaiting the final
`ResultMessage`. For a batch job, just drain the iterator and read the result at the end. Don't
reach for partial-message streaming unless you actually render tokens live — it's more events to
handle for no benefit in a batch context.

---

### Cross-references
- Exact Python symbols: `python.md`
- Exact TypeScript symbols: `typescript.md`
- Model IDs, pricing, raw-API thinking/streaming, Client-SDK loop: the `claude-api` skill.
