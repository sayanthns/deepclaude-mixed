# deepclaude-mixed-setup

Use Claude Desktop with DeepSeek-powered mixed routing. All models route through DeepSeek — Opus → V4 Pro, Sonnet → V4 Pro, Haiku → V4 Flash.

## Install

```bash
npx deepclaude-mixed-setup
```

You'll be prompted for:
- DeepSeek API key (required) — get at https://platform.deepseek.com/api_keys

Optional: set `ANTHROPIC_API_KEY` env var in the proxy's LaunchAgent/systemd unit to route Opus to real Anthropic.

## Result

Picker in Claude Desktop:
| Picker label | Backend |
|---|---|
| Opus 4.6 | DeepSeek V4 Pro |
| Sonnet 4.6 | DeepSeek V4 Pro |
| Haiku 4.5 | DeepSeek V4 Flash |

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
