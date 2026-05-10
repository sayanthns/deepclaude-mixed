# Team Guide — DeepClaude Mixed Setup

Use DeepSeek-backed Claude models in Claude Desktop, Claude Code CLI, VS Code, and Cursor. One proxy, all tools.

---

## Prerequisites (Everyone)

1. **Node.js 18+** — [nodejs.org](https://nodejs.org)
2. **DeepSeek API key** — [platform.deepseek.com/api_keys](https://platform.deepseek.com/api_keys)
3. **Claude Desktop** — [claude.ai/download](https://claude.ai/download) (required even if you only use the CLI/IDE)

---

## Step 1 — Install the Proxy

```bash
npx deepclaude-mixed-setup
```

Paste your DeepSeek key. Claude Desktop restarts. Proxy runs on `127.0.0.1:3200`.

Verify:
```bash
curl -s http://127.0.0.1:3200/_proxy/status
```

Expected: `"deepseekKey": "set"`. If you see `"deepseekKey": "MISSING"` the key wasn't saved — re-run the installer.

---

## Claude Desktop

Nothing extra needed — the installer already configures it.

Open Claude Desktop. Picker shows **Opus 4.6 / Sonnet 4.6 / Haiku 4.5** — all routed through DeepSeek.

**Switching back to Anthropic Pro:**
```bash
claude-mode 1p   # direct Anthropic
claude-mode 3p   # back to DeepSeek
```
Restart Claude Desktop after switching.

---

## Claude Code CLI

Claude Code reads two env vars for a custom API endpoint. Add them to your shell profile (`~/.zshrc`, `~/.bashrc`, or `~/.zprofile`):

```bash
export ANTHROPIC_BASE_URL=http://127.0.0.1:3200
export ANTHROPIC_API_KEY=unused
```

Reload shell:
```bash
source ~/.zshrc   # or ~/.bashrc
```

Test:
```bash
claude --version   # should show claude version
claude -p "say hello"   # routes through proxy → DeepSeek
```

**To switch back to direct Anthropic:** replace `ANTHROPIC_API_KEY=unused` with your real Anthropic API key and unset `ANTHROPIC_BASE_URL`.

> The proxy is Anthropic-wire-protocol compatible, so Claude Code works identically — same slash commands, same tool use, same extended thinking.

---

## Cursor

Cursor supports custom Anthropic API endpoints natively.

### Setup

1. Open Cursor → **Settings** (⌘,) → **Models**
2. Under **API Keys**, find **Anthropic API Key** — enter `unused`
3. Find **Override OpenAI Base URL** or **Anthropic Base URL** field — enter `http://127.0.0.1:3200`
4. Save and close Settings

> If Cursor does not show an Anthropic base URL field, use the alternative below.

### Alternative — via env var

Launch Cursor from Terminal:
```bash
ANTHROPIC_BASE_URL=http://127.0.0.1:3200 ANTHROPIC_API_KEY=unused /Applications/Cursor.app/Contents/MacOS/Cursor
```

Or add to your shell profile so it always applies.

### Model names in Cursor

Use standard Anthropic model IDs — Cursor passes them to the proxy which remaps:

| Cursor model name | Routes to |
|---|---|
| `claude-opus-4-6` | DeepSeek V4 Pro |
| `claude-sonnet-4-6` | DeepSeek V4 Pro |
| `claude-haiku-4-5-20251001` | DeepSeek V4 Flash |

---

## VS Code

### Option A — Continue extension (recommended)

[Continue](https://marketplace.visualstudio.com/items?itemName=Continue.continue) is an open-source AI coding assistant that supports custom Anthropic endpoints.

1. Install the **Continue** extension from VS Code marketplace
2. Open Continue config (`~/.continue/config.json`)
3. Add a provider:

```json
{
  "models": [
    {
      "title": "DeepSeek via Proxy (Sonnet)",
      "provider": "anthropic",
      "model": "claude-sonnet-4-6",
      "apiBase": "http://127.0.0.1:3200",
      "apiKey": "unused"
    },
    {
      "title": "DeepSeek via Proxy (Haiku)",
      "provider": "anthropic",
      "model": "claude-haiku-4-5-20251001",
      "apiBase": "http://127.0.0.1:3200",
      "apiKey": "unused"
    }
  ]
}
```

4. Reload VS Code — models appear in Continue sidebar.

### Option B — Cline extension

[Cline](https://marketplace.visualstudio.com/items?itemName=saoudrizwan.claude-dev) supports custom Anthropic base URLs.

1. Install Cline from VS Code marketplace
2. Open Cline settings (gear icon in sidebar)
3. Set:
   - **API Provider:** Anthropic
   - **API Key:** `unused`
   - **Base URL:** `http://127.0.0.1:3200`
4. Save — Cline now routes through the proxy.

### Option C — Claude extension (Anthropic official)

The official Claude VS Code extension currently does not expose a custom base URL setting. Use Continue or Cline instead.

---

## Verify Everything Is Working

Check proxy is alive:
```bash
curl -s http://127.0.0.1:3200/_proxy/status | python3 -m json.tool
```

Send a test message in your tool of choice. If you see a response, routing is working.

---

## Proxy Auto-Start

The installer sets up a system service — proxy starts automatically on login.

| OS | Service | Manual restart |
|---|---|---|
| macOS | LaunchAgent | `launchctl unload ~/Library/LaunchAgents/com.deepclaude.proxy.plist && launchctl load ~/Library/LaunchAgents/com.deepclaude.proxy.plist` |
| Linux | systemd-user | `systemctl --user restart deepclaude-proxy` |
| Windows | Task Scheduler | `schtasks /Run /TN DeepclaudeProxy` |

Logs:
- macOS: `/tmp/com.deepclaude.proxy.err.log`
- Windows: `%TEMP%\deepclaude-proxy.err.log`
- Linux: `journalctl --user -u deepclaude-proxy -f`

---

## Switching Modes (1p ↔ 3p)

| Mode | What it does |
|---|---|
| `3p` | All Claude Desktop traffic → local proxy → DeepSeek |
| `1p` | Claude Desktop talks directly to Anthropic (your Pro plan) |

```bash
claude-mode 3p      # DeepSeek routing
claude-mode 1p      # Anthropic direct
claude-mode toggle  # flip
claude-mode status  # show current
```

> Mode switching only affects **Claude Desktop**. Claude Code CLI, Cursor, and VS Code extensions use env vars / settings independently — change those separately.

---

## Upgrading

```bash
npx deepclaude-mixed-setup@latest
```

Re-runs the installer, redeploys the updated proxy script, restarts the service. Your API key is preserved.

**When to upgrade:** any time you see unexpected 400 errors or model routing issues — check [releases](https://github.com/sayanthns/deepclaude-mixed/releases) for what changed.

---

## Troubleshooting

### Proxy not running after reboot

macOS LaunchAgent didn't load. Run:
```bash
launchctl load ~/Library/LaunchAgents/com.deepclaude.proxy.plist
```

### 400 error on second message (multi-turn)

Old proxy version. Run `npx deepclaude-mixed-setup@latest`. Fixed in v0.1.2.

### Claude Code ignores proxy

Confirm env vars are exported in the correct profile file and you've reloaded the shell. Run:
```bash
echo $ANTHROPIC_BASE_URL   # should print http://127.0.0.1:3200
```

### Cursor shows "invalid API key"

Set API key to the literal string `unused` — the proxy doesn't validate keys, DeepSeek auth is handled server-side via the proxy's stored key.

### "Unable to connect" in Continue / Cline

Confirm proxy is running (`curl -s http://127.0.0.1:3200/_proxy/status`). Check `apiBase` has no trailing slash.

---

## Uninstall

```bash
npx deepclaude-mixed-uninstall
```

Removes proxy script and auto-start service. Remove env vars from shell profile manually. Remove Continue/Cline config entries manually.
