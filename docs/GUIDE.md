# DeepClaude Mixed Setup — User Guide

## Quick Start (Under 2 Minutes)

### Prerequisites
- **Node.js 18+** ([nodejs.org](https://nodejs.org))
- **Claude Desktop** installed ([claude.ai/download](https://claude.ai/download))
- **DeepSeek API key** ([platform.deepseek.com/api_keys](https://platform.deepseek.com/api_keys))

### Install

Open Terminal (macOS/Linux) or Command Prompt (Windows):

```bash
npx deepclaude-mixed-setup
```

Paste your DeepSeek API key when prompted. Done.

## What Happens

The installer:

1. **Asks for your DeepSeek API key** (stored locally, never sent anywhere)
2. **Creates a Claude Desktop profile** — tells Claude to use your local proxy
3. **Sets deployment mode to 3p** — switches Claude to third-party inference
4. **Installs auto-start service** — proxy starts on login, survives reboots
5. **Restarts Claude Desktop** — picker now shows 3 models, all routed through DeepSeek

## Files Created

| File | Purpose |
|---|---|
| `~/.deepclaude-mixed/mixed-proxy.mjs` | Local proxy script |
| `Claude-3p/configLibrary/<uuid>.json` | Active gateway profile |
| `Claude-3p/configLibrary/_meta.json` | Profile index |
| `Claude-3p/claude_desktop_config.json` | `deploymentMode: "3p"` |

Auto-start location varies by OS:

| OS | Mechanism | Location |
|---|---|---|
| macOS | LaunchAgent | `~/Library/LaunchAgents/com.deepclaude.proxy.plist` |
| Windows | Task Scheduler | Task: `DeepclaudeProxy` |
| Linux | systemd-user | `~/.config/systemd/user/deepclaude-proxy.service` |

## Model Routing

| Picker Label | Backend | DeepSeek Model |
|---|---|---|
| Opus 4.6 | DeepSeek | V4 Pro |
| Sonnet 4.6 | DeepSeek | V4 Pro |
| Haiku 4.5 | DeepSeek | V4 Flash |

Switch models mid-chat via the picker — no restart needed.

## Commands

```bash
# Toggle between mixed routing and Anthropic Pro
claude-mode 3p     # use DeepSeek routing
claude-mode 1p     # use Anthropic Pro subscription
claude-mode toggle # flip current mode
claude-mode status # show current

# Check proxy health
curl -s http://127.0.0.1:3200/_proxy/status

# Uninstall everything except Claude-3p profiles
npx deepclaude-mixed-uninstall
```

## Verification

After install, verify the proxy is running:

```bash
curl -s http://127.0.0.1:3200/_proxy/status
```

Expected:
```json
{
  "mode": "mixed",
  "anthropicKey": "MISSING",
  "deepseekKey": "set",
  "routes": {
    "opus": "deepseek-v4-pro",
    "sonnet": "deepseek-v4-pro",
    "haiku": "deepseek-v4-flash"
  }
}
```

Open Claude Desktop. Picker should show Opus 4.6, Sonnet 4.6, Haiku 4.5. Send a message with each — no errors.

## Troubleshooting

### "Unable to connect to API" in Claude Desktop

Proxy not running.

**macOS:**
```bash
launchctl list | grep deepclaude
tail /tmp/com.deepclaude.proxy.err.log
# Restart manually:
launchctl unload ~/Library/LaunchAgents/com.deepclaude.proxy.plist
launchctl load ~/Library/LaunchAgents/com.deepclaude.proxy.plist
```

**Windows:**
```cmd
schtasks /Query /TN DeepclaudeProxy
type %TEMP%\deepclaude-proxy.err.log
```

**Linux:**
```bash
systemctl --user status deepclaude-proxy
journalctl --user -u deepclaude-proxy -f
```

### Still shows Pro plan usage in Settings

App is in 1p mode. Run:
```bash
claude-mode 3p
```

### Invalid model errors

Make sure you have the latest version:
```bash
npx deepclaude-mixed-setup@latest
```

### "sk-..." API key not accepted

DeepSeek keys start with `sk-`. Get one at https://platform.deepseek.com/api_keys. Minimum 20 characters.

## Add Anthropic Opus (Optional)

If you want real Anthropic Opus for the Opus picker slot:

1. Get an Anthropic API key from https://console.anthropic.com
2. Edit the auto-start config:

**macOS:** Edit `~/Library/LaunchAgents/com.deepclaude.proxy.plist` — add `ANTHROPIC_API_KEY` to `EnvironmentVariables`

**Linux:** Edit `~/.config/systemd/user/deepclaude-proxy.service` — add `Environment=ANTHROPIC_API_KEY=sk-ant-...`

**Windows:** Re-run installer with `ANTHROPIC_API_KEY` env var set

3. Restart the proxy service

With the key set, Opus picker routes to real Anthropic Opus instead of DeepSeek V4 Pro.

## Uninstall

```bash
npx deepclaude-mixed-uninstall
```

Removes: proxy script, auto-start service. Keeps: Claude-3p profiles (delete manually in Claude Desktop UI if desired).

## Security

- API keys stored in OS auto-start configs, never in plaintext files
- Proxy listens on `127.0.0.1` only (localhost, no external access)
- No telemetry, no phoning home
- Thinking blocks from DeepSeek preserved in-flight (required by API); stripped only before forwarding to Anthropic
