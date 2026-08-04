---
name: agent-sdk
description: >-
  Build applications on the Claude Agent SDK — the Python and TypeScript library
  (`claude-agent-sdk` / `@anthropic-ai/claude-agent-sdk`) that exposes Claude Code's agent
  loop, built-in tools, and context management as a library. Use this skill whenever the user
  is building an agent, wiring up `query()` or `ClaudeSDKClient`, defining custom tools with
  `@tool` / `tool()` / `create_sdk_mcp_server` / `createSdkMcpServer`, configuring
  `ClaudeAgentOptions` / `Options`, setting permission modes, adding subagents or hooks,
  managing sessions, or asking "how do I let Claude run tools / edit files / call my API in a
  loop without writing the loop myself". Also use it when someone is unsure whether they want
  the Agent SDK, the raw Anthropic API (Client SDK), or Managed Agents. Reach for it any time
  the words "agent sdk", "claude-agent-sdk", or building an autonomous Claude agent come up —
  even if the SDK isn't named explicitly.
---

# Claude Agent SDK

The Agent SDK is **Claude Code as a library**. It runs the agent loop — Claude plans, calls
tools, reads results, and decides when it's done — inside *your* process, in Python or
TypeScript. You bring the task and any custom tools; the SDK runs the loop, manages context,
and ships the same built-in tools (file read/write/edit, bash, web search/fetch) plus MCP,
subagents, hooks, permissions, and sessions.

## Read this first: which thing do you actually want?

Half of all Agent SDK confusion is picking the wrong product. Route before you write code:

| You want to… | Use | Not |
|---|---|---|
| Build an agent **without writing the tool loop yourself** | **Agent SDK** (this skill) | — |
| Run one-off tasks interactively in a terminal | Claude Code **CLI** | the SDK |
| Call the model directly and **write your own tool loop** | **Client SDK** (Anthropic API) — see the `claude-api` skill | the Agent SDK |
| Run long/async agents **without hosting your own sandbox** | **Managed Agents** (hosted product) | the Agent SDK |

The single most expensive mistake here is confusing the **Agent SDK** with the **Client
SDK**. The Client SDK gives you raw model calls and *you* implement the loop that executes
tool calls. The Agent SDK already runs that loop. If someone is hand-writing a
`while` loop that dispatches `tool_use` blocks, they either want the Agent SDK, or they
deliberately chose the Client SDK — check which, don't assume.

## Accuracy note — the SDK moves, so verify what ages

This SDK was renamed from the Claude Code SDK in late 2025 and versions actively. The symbol
names and patterns below were pinned from the official docs at authoring, but treat two
things as *always* verify-before-you-rely:

- **Model IDs** — never hardcode from memory. Get current IDs from the `claude-api` skill or
  let `model` default. (Model IDs are owned by that skill, not this one.)
- **New/changed options** — if a needed option isn't listed here, confirm against the live
  reference rather than inventing a plausible name: `code.claude.com/docs/en/agent-sdk/python`
  and `.../typescript`.

Preferring "here's where it's authoritative" over a confident guess is the whole point — an
invented `ClaudeAgentOptions(auto_approve=True)` costs a debugging session; a lookup costs a
minute.

## Install & authenticate

```bash
pip install claude-agent-sdk          # Python 3.10+
npm install @anthropic-ai/claude-agent-sdk
```

Auth is via `ANTHROPIC_API_KEY` in the environment. (Third-party products may not use
claude.ai login/rate limits for SDK-powered agents — use API-key auth.)

## Minimal correct agent

**Python** — one-shot `query()`:

```python
import asyncio
from claude_agent_sdk import query, ClaudeAgentOptions

async def main():
    options = ClaudeAgentOptions(
        system_prompt="You are an expert Python developer.",
        permission_mode="acceptEdits",   # auto-accept file edits
        cwd="/path/to/project",
    )
    async for message in query(prompt="Find and fix the bug in app.py", options=options):
        print(message)

asyncio.run(main())
```

**TypeScript** — `query()` returns an async-iterable `Query`:

```typescript
import { query } from "@anthropic-ai/claude-agent-sdk";

for await (const message of query({
  prompt: "Find and fix the bug in app.ts",
  options: { permissionMode: "acceptEdits", cwd: "/path/to/project", maxTurns: 5 },
})) {
  console.log(message);
}
```

`query()` is the stateless, one-shot entry point. For a **multi-turn conversation** that keeps
context across exchanges, use `ClaudeSDKClient` (Python) or drive the `Query` object (TS) —
see `references/patterns.md` → "One-shot vs. stateful".

## The option surface you'll reach for most

Configured via `ClaudeAgentOptions(...)` (Python, snake_case) / the `Options` object (TS,
camelCase). The high-frequency fields:

- `system_prompt` / `systemPrompt` — instructions, or a preset.
- `allowed_tools` / `allowedTools` and `disallowed_tools` / `disallowedTools` — gate which
  tools run. Custom tools are named `mcp__<server>__<tool>`.
- `permission_mode` / `permissionMode` — how tool calls get approved (see below).
- `mcp_servers` / `mcpServers` — attach MCP servers, including in-process custom tools.
- `agents` — define subagents.
- `hooks` — run your code at lifecycle points.
- `model`, `cwd`, `max_turns` / `maxTurns`, `setting_sources` / `settingSources`,
  session controls (`resume`, `fork_session` / `forkSession`).

Permission modes (the enum differs slightly by language — **verify** if you need an edge one):
`default`, `plan` (read-only planning), `acceptEdits` (Python), `bypassPermissions`,
`dontAsk`. For human-in-the-loop, prefer a `can_use_tool` / `canUseTool` callback over
`bypassPermissions`.

## Custom tools = in-process MCP

The idiomatic way to give the agent *your* capability (call your API, hit your DB) is an
in-process MCP tool — no separate process:

```python
from claude_agent_sdk import tool, create_sdk_mcp_server, ClaudeAgentOptions

@tool("add", "Add two numbers", {"a": float, "b": float})
async def add(args):
    return {"content": [{"type": "text", "text": f"Sum: {args['a'] + args['b']}"}]}

calc = create_sdk_mcp_server(name="calc", version="1.0.0", tools=[add])
options = ClaudeAgentOptions(mcp_servers={"calc": calc}, allowed_tools=["mcp__calc__add"])
```

TypeScript uses `tool()` (with a Zod schema) + `createSdkMcpServer()`. Full both-language
detail, handler return shape, and the naming rule are in the reference files.

## Go deeper — reference files

Load the one your task needs; don't pull all three:

- **`references/python.md`** — full Python API: `query`, `ClaudeSDKClient` (all methods),
  `ClaudeAgentOptions` fields, `@tool`, `create_sdk_mcp_server`, permission callbacks,
  message/content types, sessions.
- **`references/typescript.md`** — full TS API: `query`, the `Query` object, `Options`,
  `tool()`, `createSdkMcpServer()`, `canUseTool`, message types, `startup()`.
- **`references/patterns.md`** — the patterns that are easy to get subtly wrong: permissions &
  human-in-the-loop, subagents, hooks, MCP, sessions (resume/fork), streaming vs. one-shot,
  and choosing one-shot vs. stateful.

For model IDs, pricing, thinking/streaming at the raw-API level, and Client-SDK questions, use
the **`claude-api`** skill — this skill deliberately does not restate those.
