# deepclaude-mixed-setup

Use Claude Desktop with mixed routing — real Anthropic Opus for hard tasks, DeepSeek for cheap chat.

## Install

```bash
npx deepclaude-mixed-setup
```

You'll be prompted for:
- DeepSeek API key (required) — get at https://platform.deepseek.com/api_keys
- Anthropic API key (optional, for real Opus) — get at https://console.anthropic.com → API Keys

## Result

Picker in Claude Desktop:
| Picker label | Backend | Cost |
|---|---|---|
| Opus 4.6 | api.anthropic.com (real) | $$$ |
| Sonnet 4.6 | DeepSeek V4 Pro | $ |
| Haiku 4.5 | DeepSeek V4 Flash | ¢ |

Switch mid-chat via picker, no relaunch.

## Toggle mode

```bash
claude-mode 3p     # use mixed routing
claude-mode 1p     # use Anthropic Pro subscription
claude-mode toggle
claude-mode status
```

## Uninstall

```bash
npx deepclaude-mixed-uninstall
```

## Requirements

- Node.js 18+
- Claude Desktop installed
- macOS / Windows 10+ / Linux with systemd

## How it works

See `docs/ARCHITECTURE.md`. See `docs/TROUBLESHOOTING.md` for common issues.
