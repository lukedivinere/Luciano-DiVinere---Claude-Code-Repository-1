# Claude Agent SDK — Python reference

Package: `claude-agent-sdk` (Python 3.10+). Import from `claude_agent_sdk`.
Pinned from the official reference at authoring; **verify model IDs and any option not listed
here against `code.claude.com/docs/en/agent-sdk/python` — the SDK versions actively.**

## Contents
- `query()` — one-shot
- `ClaudeSDKClient` — stateful, multi-turn
- `ClaudeAgentOptions` — configuration
- `permission_mode` values
- `@tool` + `create_sdk_mcp_server` — custom in-process tools
- `can_use_tool` — permission callback
- Message / content types
- Session functions

---

## `query()` — one-shot

```python
async def query(
    *,
    prompt: str | AsyncIterable[dict[str, Any]],
    options: ClaudeAgentOptions | None = None,
    transport: Transport | None = None,
) -> AsyncIterator[Message]
```

Returns an async iterator of messages. Stateless — each call is independent. Use for
fire-and-forget tasks.

```python
import asyncio
from claude_agent_sdk import query, ClaudeAgentOptions

async def main():
    options = ClaudeAgentOptions(
        system_prompt="You are an expert Python developer",
        permission_mode="acceptEdits",
    )
    async for message in query(prompt="Create a Python web server", options=options):
        print(message)

asyncio.run(main())
```

## `ClaudeSDKClient` — stateful, multi-turn

Maintains a conversation across exchanges. Prefer it whenever a follow-up needs the prior
turn's context, or you need to interrupt / change model / change permission mode mid-run.

```python
class ClaudeSDKClient:
    def __init__(self, options: ClaudeAgentOptions | None = None,
                 transport: Transport | None = None)
    async def connect(self, prompt: str | AsyncIterable[dict] | None = None) -> None
    async def query(self, prompt: str | AsyncIterable[dict], session_id: str = "default") -> None
    async def receive_messages(self) -> AsyncIterator[Message]
    async def receive_response(self) -> AsyncIterator[Message]
    async def interrupt(self) -> None
    async def set_permission_mode(self, mode: str) -> None
    async def set_model(self, model: str | None = None) -> None
    async def rewind_files(self, user_message_id: str) -> None
    async def get_mcp_status(self) -> McpStatusResponse
    async def reconnect_mcp_server(self, server_name: str) -> None
    async def toggle_mcp_server(self, server_name: str, enabled: bool) -> None
    async def stop_task(self, task_id: str) -> None
    async def get_server_info(self) -> dict[str, Any] | None
    async def disconnect(self) -> None
```

Use it as an async context manager so connect/disconnect are handled:

```python
import asyncio
from claude_agent_sdk import ClaudeSDKClient, AssistantMessage, TextBlock

async def main():
    async with ClaudeSDKClient() as client:
        await client.query("What's the capital of France?")
        async for message in client.receive_response():
            if isinstance(message, AssistantMessage):
                for block in message.content:
                    if isinstance(block, TextBlock):
                        print(f"Claude: {block.text}")

        # follow-up keeps the earlier context
        await client.query("What's the population of that city?")
        async for message in client.receive_response():
            if isinstance(message, AssistantMessage):
                for block in message.content:
                    if isinstance(block, TextBlock):
                        print(f"Claude: {block.text}")

asyncio.run(main())
```

`receive_response()` yields until the current turn ends; `receive_messages()` is the raw
open-ended stream.

## `ClaudeAgentOptions`

```python
@dataclass
class ClaudeAgentOptions:
    # Tools
    tools: list[str] | ToolsPreset | None = None
    allowed_tools: list[str] = field(default_factory=list)
    disallowed_tools: list[str] = field(default_factory=list)

    # System prompt
    system_prompt: str | SystemPromptPreset | SystemPromptFile | None = None

    # MCP
    mcp_servers: dict[str, McpServerConfig] | str | Path = field(default_factory=dict)
    strict_mcp_config: bool = False

    # Permissions
    permission_mode: PermissionMode | None = None
    can_use_tool: CanUseTool | None = None

    # Sessions
    continue_conversation: bool = False
    resume: str | None = None
    session_id: str | None = None
    fork_session: bool = False

    # Model & execution
    model: str | None = None
    fallback_model: str | None = None
    max_turns: int | None = None
    max_budget_usd: float | None = None

    # Settings & filesystem
    setting_sources: list[SettingSource] | None = None   # "user" | "project" | "local"
    cwd: str | Path | None = None
    add_dirs: list[str | Path] = field(default_factory=list)
    env: dict[str, str] = field(default_factory=dict)

    # Subagents & hooks
    agents: dict[str, AgentDefinition] | None = None
    hooks: dict[HookEvent, list[HookMatcher]] | None = None

    # Thinking
    thinking: ThinkingConfig | None = None
    effort: EffortLevel | None = None    # "low"|"medium"|"high"|"xhigh"|"max"

    # Advanced
    include_partial_messages: bool = False
    include_hook_events: bool = False
    enable_file_checkpointing: bool = False
    output_format: dict[str, Any] | None = None
```

Notes:
- `setting_sources=None` (default) or `[]` skips loading project/user settings — pass an
  explicit list to load `.claude/` config, skills, commands, memory.
- `mcp_servers` accepts in-process servers (from `create_sdk_mcp_server`) and external server
  configs.

### `permission_mode` values

```python
PermissionMode = Literal[
    "default",           # standard prompting behavior
    "acceptEdits",       # auto-accept file edits
    "plan",              # planning only, no edits
    "dontAsk",           # deny anything not pre-approved
    "bypassPermissions", # skip permission checks (use with care)
    "auto",              # a classifier approves/denies
]
```

### `AgentDefinition` (subagents)

```python
@dataclass
class AgentDefinition:
    description: str
    prompt: str
    tools: list[str] | None = None
    disallowedTools: list[str] | None = None   # NOTE: camelCase fields here
    model: str | None = None
    skills: list[str] | None = None
    memory: Literal["user", "project", "local"] | None = None
    mcpServers: list[str | dict[str, Any]] | None = None
    initialPrompt: str | None = None
    maxTurns: int | None = None
    background: bool | None = None
    effort: EffortLevel | int | None = None
    permissionMode: PermissionMode | None = None
```

Pass as `agents={"reviewer": AgentDefinition(...)}`. The gotcha: `AgentDefinition`'s fields are
**camelCase** even though `ClaudeAgentOptions` is snake_case.

## Custom tools — `@tool` + `create_sdk_mcp_server`

```python
def tool(
    name: str,
    description: str,
    input_schema: type | dict[str, Any],
    annotations: ToolAnnotations | None = None,
) -> Callable[..., SdkMcpTool[Any]]

def create_sdk_mcp_server(
    name: str,
    version: str = "1.0.0",
    tools: list[SdkMcpTool[Any]] | None = None,
) -> McpSdkServerConfig
```

A tool handler is `async (args: dict) -> dict` returning a content payload:

```python
from claude_agent_sdk import tool, create_sdk_mcp_server, ClaudeAgentOptions

@tool("add", "Add two numbers", {"a": float, "b": float})
async def add(args):
    return {"content": [{"type": "text", "text": f"Sum: {args['a'] + args['b']}"}]}

calculator = create_sdk_mcp_server(name="calculator", version="2.0.0", tools=[add])

options = ClaudeAgentOptions(
    mcp_servers={"calc": calculator},
    allowed_tools=["mcp__calc__add"],   # naming: mcp__<server-key>__<tool-name>
)
```

The server key in `mcp_servers` (`"calc"`) plus the tool name (`"add"`) form the allowed-tools
identifier `mcp__calc__add`. Get this wrong and the tool silently never runs.

## Permission callback — `can_use_tool`

For programmatic, per-call approval (the right tool for human-in-the-loop):

```python
CanUseTool = Callable[[str, dict[str, Any], ToolPermissionContext], Awaitable[PermissionResult]]

@dataclass
class PermissionResultAllow:
    behavior: Literal["allow"] = "allow"
    updated_input: dict[str, Any] | None = None
    updated_permissions: list[PermissionUpdate] | None = None

@dataclass
class PermissionResultDeny:
    behavior: Literal["deny"] = "deny"
    message: str = ""
    interrupt: bool = False
```

```python
async def custom_permission_handler(tool_name, input_data, context):
    if tool_name == "Write" and input_data.get("file_path", "").startswith("/system/"):
        return PermissionResultDeny(message="System dir write not allowed", interrupt=True)
    return PermissionResultAllow(updated_input=input_data)

options = ClaudeAgentOptions(can_use_tool=custom_permission_handler)
```

You can rewrite the tool input on allow (`updated_input`) — handy for redaction or clamping
arguments.

## Message / content types

From the async iterator:
- `AssistantMessage` — Claude's response; has `.content` blocks.
- `TextBlock` — text (`.text`).
- `ToolUseBlock` — a tool invocation.
- `ResultMessage` — end of turn; carries `result` and `terminal_reason`.
- `StreamEvent` — partial streaming events (only when `include_partial_messages=True`).
- `TaskNotificationMessage` — background task status.

Iterate content by isinstance-checking blocks (see the `ClaudeSDKClient` example).

## Sessions

```python
def list_sessions(directory=None, limit=None, offset=0, include_worktrees=True) -> list[SDKSessionInfo]
def get_session_messages(session_id, directory=None, limit=None, offset=0) -> list[SessionMessage]
def get_session_info(session_id, directory=None) -> SDKSessionInfo | None
def rename_session(session_id, title, directory=None) -> None
def tag_session(session_id, tag, directory=None) -> None
```

To resume/fork a run, set `resume=<session_id>` (and `fork_session=True` to branch instead of
continue) on `ClaudeAgentOptions`. See `patterns.md` → "Sessions".
