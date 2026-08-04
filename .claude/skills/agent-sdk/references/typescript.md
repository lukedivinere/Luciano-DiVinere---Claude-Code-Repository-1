# Claude Agent SDK — TypeScript reference

Package: `@anthropic-ai/claude-agent-sdk` (bundles a native Claude Code binary as an optional
dependency). Pinned from the official reference at authoring; **verify model IDs and any option
not listed here against `code.claude.com/docs/en/agent-sdk/typescript` — the SDK versions
actively.** Custom-tool schemas use **Zod**.

## Contents
- `query()` and the `Query` object
- `Options` fields
- `permissionMode` values
- `tool()` + `createSdkMcpServer()` — custom in-process tools
- `canUseTool` — permission callback
- `startup()` — warm start
- Message types

---

## `query()` and the `Query` object

```typescript
function query({
  prompt,
  options,
}: {
  prompt: string | AsyncIterable<SDKUserMessage>;
  options?: Options;
}): Query;
```

`query()` returns a `Query`, which is an `AsyncGenerator<SDKMessage, void>` with extra control
methods — so you iterate it with `for await`, and can also call methods on it mid-run.

```typescript
import { query } from "@anthropic-ai/claude-agent-sdk";

for await (const message of query({
  prompt: "Hello, Claude",
  options: { cwd: "/path/to/project", maxTurns: 5 },
})) {
  console.log(message);
}
```

```typescript
interface Query extends AsyncGenerator<SDKMessage, void> {
  interrupt(): Promise<SDKControlInterruptResponse | undefined>;
  setPermissionMode(mode: PermissionMode): Promise<void>;
  setModel(model?: string): Promise<void>;
  applyFlagSettings(settings: { [K in keyof Settings]?: Settings[K] | null }): Promise<void>;
  initializationResult(): Promise<SDKControlInitializeResponse>;
  supportedModels(): Promise<ModelInfo[]>;
  mcpServerStatus(): Promise<McpServerStatus[]>;
  streamInput(stream: AsyncIterable<SDKUserMessage>): Promise<void>;
  close(): void;
}
```

For a multi-turn conversation, pass an `AsyncIterable<SDKUserMessage>` as `prompt` (or use
`streamInput`) and keep the single `Query` alive rather than calling `query()` again per turn.
See `patterns.md` → "One-shot vs. stateful".

## `Options` (high-frequency fields)

```typescript
interface Options {
  // Model & behavior
  model?: string;                          // alias or full name — see claude-api skill
  effort?: 'low' | 'medium' | 'high' | 'xhigh' | 'max';
  maxTurns?: number;
  thinking?: ThinkingConfig;

  // Filesystem & environment
  cwd?: string;                            // default: process.cwd()
  env?: Record<string, string | undefined>;
  additionalDirectories?: string[];

  // System & prompting
  systemPrompt?: string | {
    type: 'preset';
    preset: 'claude_code';
    append?: string;
    excludeDynamicSections?: boolean;
  };

  // Tools & permissions
  tools?: string[] | { type: 'preset'; preset: 'claude_code' };
  allowedTools?: string[];
  disallowedTools?: string[];
  permissionMode?: 'default' | 'plan' | 'dontAsk' | 'bypassPermissions';
  canUseTool?: (request: CanUseToolRequest, options: { signal: AbortSignal })
             => Promise<CanUseToolResponse>;
  allowDangerouslySkipPermissions?: boolean;

  // MCP
  mcpServers?: Record<string, McpServerConfig>;
  strictMcpConfig?: boolean;

  // Subagents
  agent?: string;
  agents?: Record<string, AgentDefinition>;

  // Settings
  settings?: string | Settings;
  settingSources?: SettingSource[];        // 'user' | 'project' | 'local'

  // Hooks
  hooks?: Partial<Record<HookEvent, HookCallbackMatcher[]>>;

  // Sessions
  sessionId?: string;
  resume?: string;                         // session id to resume
  continue?: boolean;
  forkSession?: boolean;
  persistSession?: boolean;

  // Cost
  maxBudgetUsd?: number;

  // Advanced
  abortController?: AbortController;
  debug?: boolean;
}
```

`settingSources` defaults to not loading `.claude/` config; pass `['project']` (etc.) to load
skills/commands/memory, or `[]` to force CLI defaults.

### `permissionMode` values (TypeScript)

```typescript
type PermissionMode =
  | 'default'            // prompts for permission
  | 'plan'               // read-only planning
  | 'dontAsk'            // denies tool use not pre-approved
  | 'bypassPermissions'; // approves all tools
```

(The Python enum additionally exposes `acceptEdits` and `auto`. If you need a mode not listed
for your language, **verify against the live reference** rather than assuming parity.)

## Custom tools — `tool()` + `createSdkMcpServer()`

```typescript
function tool<Schema extends AnyZodRawShape>(
  name: string,
  description: string,
  inputSchema: Schema,
  handler: (args: InferShape<Schema>, extra: unknown) => Promise<CallToolResult>,
  extras?: { annotations?: ToolAnnotations; searchHint?: string; alwaysLoad?: boolean },
): SdkMcpToolDefinition<Schema>;

function createSdkMcpServer(options: {
  name: string;
  version?: string;
  instructions?: string;
  tools?: Array<SdkMcpToolDefinition<any>>;
  alwaysLoad?: boolean;
}): McpSdkServerConfigWithInstance;
```

```typescript
import { query, createSdkMcpServer, tool } from "@anthropic-ai/claude-agent-sdk";
import { z } from "zod";

const server = createSdkMcpServer({
  name: "my-tools",
  version: "1.0.0",
  tools: [
    tool(
      "add",
      "Add two numbers",
      { a: z.number(), b: z.number() },
      async ({ a, b }) => ({ content: [{ type: "text", text: String(a + b) }] }),
      { annotations: { readOnlyHint: true } },
    ),
  ],
});

for await (const msg of query({
  prompt: "add 2 and 3",
  options: { mcpServers: { myTools: server }, allowedTools: ["mcp__myTools__add"] },
})) {
  console.log(msg);
}
```

Same naming rule as Python: `mcp__<server-key>__<tool-name>`, where the server key is the key
in `mcpServers`. The Zod schema both validates input and types the handler's `args`.

## Permission callback — `canUseTool`

```typescript
canUseTool?: (request: CanUseToolRequest, options: { signal: AbortSignal })
           => Promise<CanUseToolResponse>;
```

Return an allow/deny decision per call — the idiomatic human-in-the-loop hook. Prefer it over
`bypassPermissions` / `allowDangerouslySkipPermissions`, which disable the safety entirely.

## `startup()` — warm start

Pre-initialize so the first real query is fast:

```typescript
import { startup } from "@anthropic-ai/claude-agent-sdk";

const warm = await startup({ options: { maxTurns: 3 } });
for await (const message of warm.query("What files are here?")) {
  console.log(message);
}
```

## Message types

```typescript
type SDKMessage =
  | SDKUserMessage | SDKAssistantMessage | SDKToolUseMessage | SDKToolResultMessage
  | SDKSystemMessage | SDKTaskProgressMessage | SDKResultMessage
  | SDKControlRequestMessage | SDKHookStartedMessage | SDKHookProgressMessage
  | SDKHookResponseMessage;
```

Every message has `type`, `uuid`, `timestamp`, plus type-specific fields. Switch on `type`
(or the assistant/result variants) to pull text and tool activity out of the stream.
