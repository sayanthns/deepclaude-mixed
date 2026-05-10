# deepclaude-mixed-setup

Use Claude Desktop with DeepSeek-powered mixed routing. All models route through DeepSeek — Opus → V4 Pro, Sonnet → V4 Pro, Haiku → V4 Flash.

## Quick Start

```bash
npx deepclaude-mixed-setup
```

Paste your DeepSeek API key when prompted. Done. Get a key at [platform.deepseek.com/api_keys](https://platform.deepseek.com/api_keys).

**Requirements:** Node.js 18+, Claude Desktop installed. macOS / Windows 10+ / Linux with systemd.

## What You Get

Picker in Claude Desktop:
| Picker Label | Backend |
|---|---|
| Opus 4.6 | DeepSeek V4 Pro |
| Sonnet 4.6 | DeepSeek V4 Pro |
| Haiku 4.5 | DeepSeek V4 Flash |

Switch mid-chat via picker — no restart needed.

## Commands

```bash
# Toggle between DeepSeek routing and Anthropic Pro
claude-mode 3p       # use DeepSeek routing
claude-mode 1p       # use Anthropic Pro subscription
claude-mode toggle   # flip current mode
claude-mode status   # show current

# Check proxy health
curl -s http://127.0.0.1:3200/_proxy/status

# Uninstall everything
npx deepclaude-mixed-uninstall
```

## Verify Installation

```bash
curl -s http://127.0.0.1:3200/_proxy/status
```

Expected:
```json
{
  "mode": "mixed",
  "deepseekKey": "set",
  "routes": {
    "opus": "deepseek-v4-pro",
    "sonnet": "deepseek-v4-pro",
    "haiku": "deepseek-v4-flash"
  }
}
```

Open Claude Desktop. Picker shows Opus, Sonnet, Haiku. Send a message — works.

## How It Works

1. Installer writes a Claude Desktop gateway profile under `Claude-3p/configLibrary/`
2. Sets `deploymentMode = "3p"` in Claude's config — switches to third-party inference
3. Installs auto-start service (LaunchAgent / systemd / Task Scheduler) that runs local proxy on `127.0.0.1:3200`
4. Proxy intercepts Claude's API calls, remaps models to DeepSeek, strips foreign thinking blocks
5. Restarts Claude Desktop so picker picks up new profiles

## Files

| Path | Purpose |
|---|---|
| `~/.deepclaude-mixed/mixed-proxy.mjs` | Proxy script |
| `Claude-3p/configLibrary/<uuid>.json` | Gateway profile |
| `Claude-3p/configLibrary/_meta.json` | Profile index |
| `Claude-3p/claude_desktop_config.json` | `deploymentMode: "3p"` |
| macOS: `~/Library/LaunchAgents/com.deepclaude.proxy.plist` | Auto-start |
| Linux: `~/.config/systemd/user/deepclaude-proxy.service` | Auto-start |
| Windows: Task Scheduler `DeepclaudeProxy` | Auto-start |

## Troubleshooting

### "Unable to connect to API" in Claude Desktop

Proxy not running. Check:

**macOS:**
```bash
launchctl list | grep deepclaude
tail /tmp/com.deepclaude.proxy.err.log
launchctl unload ~/Library/LaunchAgents/com.deepclaude.proxy.plist
launchctl load ~/Library/LaunchAgents/com.deepclaude.proxy.plist
```

**Linux:**
```bash
systemctl --user status deepclaude-proxy
journalctl --user -u deepclaude-proxy -f
```

**Windows:**
```cmd
schtasks /Query /TN DeepclaudeProxy
type %TEMP%\deepclaude-proxy.err.log
```

### Still shows Pro plan in Claude Desktop Settings

App is in 1p mode. Run `claude-mode 3p`.

### Invalid model errors

Re-run `npx deepclaude-mixed-setup@latest` for latest config.

## Optional: Real Anthropic Opus

Add `ANTHROPIC_API_KEY` env var to auto-start config. Opus picker routes to `api.anthropic.com` instead of DeepSeek. Edit:

- **macOS:** `~/Library/LaunchAgents/com.deepclaude.proxy.plist` → add to `EnvironmentVariables`
- **Linux:** `~/.config/systemd/user/deepclaude-proxy.service` → add `Environment=ANTHROPIC_API_KEY=...`
- **Windows:** re-run installer with `ANTHROPIC_API_KEY` env var set

Restart proxy service after edit.

## Uninstall

```bash
npx deepclaude-mixed-uninstall
```

Removes proxy script, auto-start service. Keeps Claude-3p profiles (delete in Claude Desktop UI).

## Security

- API key stored in OS auto-start config, never plaintext files
- Proxy listens `127.0.0.1` only (no external access)
- No telemetry, no phoning home
- Thinking blocks stripped before forwarding
