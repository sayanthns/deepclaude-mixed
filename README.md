# deepclaude-mixed-setup

Route Claude Desktop (and Claude Code CLI) through DeepSeek — pay DeepSeek API rates instead of Anthropic's subscription tier.

**Setup guide:** [docs/GUIDE.md](https://github.com/sayanthns/deepclaude-mixed/blob/master/docs/GUIDE.md) | **Team guide (Claude Code / VS Code / Cursor):** [docs/TEAM-GUIDE.md](https://github.com/sayanthns/deepclaude-mixed/blob/master/docs/TEAM-GUIDE.md)

---

## Quick Start

```bash
npx deepclaude-mixed-setup
```

Paste your DeepSeek API key when prompted. Claude Desktop restarts with DeepSeek routing active.

Get a key: [platform.deepseek.com/api_keys](https://platform.deepseek.com/api_keys)

**Requirements:** Node.js 18+, Claude Desktop installed. macOS / Windows 10+ / Linux (systemd).

---

## Model Routing

| Picker | Backend | Notes |
|---|---|---|
| Opus 4.6 | DeepSeek V4 Pro | Matches reasoning quality |
| Sonnet 4.6 | DeepSeek V4 Pro | Default workhorse |
| Haiku 4.5 | DeepSeek V4 Flash | Fast + cheap |

Switch mid-chat via picker — no restart needed.

---

## Switching Between DeepSeek (3p) and Anthropic (1p)

The proxy supports two modes. Switch any time, no reinstall needed.

```bash
claude-mode 3p       # route through DeepSeek (default after install)
claude-mode 1p       # use your Anthropic Pro subscription directly
claude-mode toggle   # flip current mode
claude-mode status   # show current mode
```

**What changes:**
- `3p` — Claude Desktop sends requests to your local proxy → DeepSeek API
- `1p` — Claude Desktop talks directly to Anthropic servers (your Pro plan)

Restart Claude Desktop after switching mode for it to take effect.

---

## Upgrading

Existing installs: re-run the installer to deploy the latest proxy script.

```bash
npx deepclaude-mixed-setup@latest
```

Your API key is not re-asked if already set in the auto-start config.

> **v0.1.2 fix:** Thinking blocks were incorrectly stripped on DeepSeek routes, causing 400 errors on multi-turn conversations with extended thinking enabled. Fixed — existing users must upgrade.

---

## Commands

```bash
# Mode switching
claude-mode 3p | 1p | toggle | status

# Proxy health
curl -s http://127.0.0.1:3200/_proxy/status

# Uninstall
npx deepclaude-mixed-uninstall
```

---

## How It Works

1. Installer writes a Claude Desktop gateway profile under `Claude-3p/configLibrary/`
2. Sets `deploymentMode = "3p"` in Claude's config — activates third-party inference
3. Installs auto-start service (LaunchAgent / systemd / Task Scheduler) running local proxy on `127.0.0.1:3200`
4. Proxy intercepts Claude's API calls, remaps model names to DeepSeek equivalents
5. Thinking blocks from DeepSeek are preserved and echoed back on multi-turn (required by DeepSeek API); stripped only when forwarding to Anthropic

---

## Files

| Path | Purpose |
|---|---|
| `~/.deepclaude-mixed/mixed-proxy.mjs` | Proxy script (auto-started) |
| `Claude-3p/configLibrary/<uuid>.json` | Gateway profile |
| `Claude-3p/claude_desktop_config.json` | `deploymentMode: "3p"` |
| macOS: `~/Library/LaunchAgents/com.deepclaude.proxy.plist` | Auto-start |
| Linux: `~/.config/systemd/user/deepclaude-proxy.service` | Auto-start |
| Windows: Task Scheduler `DeepclaudeProxy` | Auto-start |

---

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

---

## Troubleshooting

### "Unable to connect to API" in Claude Desktop

Proxy not running.

**macOS:**
```bash
launchctl list | grep deepclaude
tail /tmp/com.deepclaude.proxy.err.log
# Restart:
launchctl unload ~/Library/LaunchAgents/com.deepclaude.proxy.plist
launchctl load  ~/Library/LaunchAgents/com.deepclaude.proxy.plist
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

In 1p mode. Run `claude-mode 3p` then restart Claude Desktop.

### 400 error on multi-turn / extended thinking

Outdated proxy script. Run `npx deepclaude-mixed-setup@latest`.

### Invalid model errors

Run `npx deepclaude-mixed-setup@latest` for latest model names.

---

## Optional: Real Anthropic Opus

Set `ANTHROPIC_API_KEY` in the auto-start config. Opus picker routes to `api.anthropic.com`; Sonnet and Haiku stay on DeepSeek.

- **macOS:** edit `~/Library/LaunchAgents/com.deepclaude.proxy.plist` → add to `EnvironmentVariables`
- **Linux:** edit `~/.config/systemd/user/deepclaude-proxy.service` → add `Environment=ANTHROPIC_API_KEY=sk-ant-...`
- **Windows:** re-run installer with `ANTHROPIC_API_KEY` env var set

Restart proxy service after edit.

---

## Uninstall

```bash
npx deepclaude-mixed-uninstall
```

Removes proxy script and auto-start service. Claude-3p profiles remain — delete via Claude Desktop UI if desired.

---

## Security

- API key stored in OS auto-start config, never in plaintext files elsewhere
- Proxy listens on `127.0.0.1` only — no external network access
- No telemetry, no phoning home
- Thinking blocks from DeepSeek preserved in-flight (required by API); stripped only before forwarding to Anthropic
