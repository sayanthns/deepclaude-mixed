# Team Guide — DeepClaude Mixed Setup

Use DeepSeek-backed Claude models in Claude Desktop, Claude Code CLI, VS Code, and Cursor. One proxy, all tools.

---

## Prerequisites (Everyone)

1. **Node.js 18+** — [nodejs.org](https://nodejs.org)
2. **DeepSeek API key** — [platform.deepseek.com/api_keys](https://platform.deepseek.com/api_keys)
3. **Claude Desktop** — [claude.ai/download](https://claude.ai/download) (required even if you only use CLI/IDE)

---

## Step 1 — Install the Proxy

### macOS / Linux

```bash
npx deepclaude-mixed-setup
```

Paste your DeepSeek key. Claude Desktop restarts. Proxy runs on `127.0.0.1:3200`.

### Windows

**PowerShell (Run as Administrator):**
```powershell
npx deepclaude-mixed-setup
```

Paste your DeepSeek key. Claude Desktop restarts.

> If `npx` fails with network error: open **Command Prompt as Administrator**, run `npm install -g deepclaude-mixed-setup`, then `deepclaude-mixed-setup`.

### Verify (All OS)

**macOS / Linux (bash/zsh):**
```bash
curl -s http://127.0.0.1:3200/_proxy/status
```

**Windows (PowerShell):**
```powershell
Invoke-RestMethod http://127.0.0.1:3200/_proxy/status
```

**Windows (Command Prompt):**
```cmd
curl -s http://127.0.0.1:3200/_proxy/status
```

Expected: `"deepseekKey": "set"`. If you see `"deepseekKey": "MISSING"`, re-run installer.

---

## Claude Desktop

No extra steps — installer configures it. Open Claude Desktop. Picker shows **Opus 4.6 / Sonnet 4.6 / Haiku 4.5** — all routed through DeepSeek.

### Switching Between DeepSeek (3p) and Anthropic (1p)

**macOS / Linux:**
```bash
claude-mode 3p      # DeepSeek routing
claude-mode 1p      # Anthropic Pro direct
claude-mode toggle  # flip
claude-mode status  # show current
```

**Windows (Command Prompt):**
```cmd
claude-mode 3p
claude-mode 1p
claude-mode toggle
claude-mode status
```

Restart Claude Desktop after switching for it to take effect.

> Mode switching only affects **Claude Desktop**. CLI and IDE tools use independent settings — change those separately.

---

## Claude Code CLI

### macOS / Linux

Add to your shell profile (`~/.zshrc` or `~/.bashrc`):

```bash
export ANTHROPIC_BASE_URL=http://127.0.0.1:3200
export ANTHROPIC_API_KEY=unused
```

Reload:
```bash
source ~/.zshrc   # or source ~/.bashrc
```

Test:
```bash
claude --version
claude -p "say hello in one word"
```

### Windows

**PowerShell — current session only:**
```powershell
$env:ANTHROPIC_BASE_URL="http://127.0.0.1:3200"
$env:ANTHROPIC_API_KEY="unused"
```

**Permanent (PowerShell profile):**

1. Check if profile exists: `Test-Path $PROFILE`
2. Create if needed: `New-Item -Path $PROFILE -Type File -Force`
3. Edit: `notepad $PROFILE`
4. Add lines:
   ```powershell
   $env:ANTHROPIC_BASE_URL="http://127.0.0.1:3200"
   $env:ANTHROPIC_API_KEY="unused"
   ```
5. Save, reload: `. $PROFILE`

**Permanent (System Environment Variables):**

1. Press `Win` → type "environment variables" → **Edit the system environment variables**
2. Click **Environment Variables...**
3. Under **User variables**, click **New**
4. Add two entries:
   - Name: `ANTHROPIC_BASE_URL` Value: `http://127.0.0.1:3200`
   - Name: `ANTHROPIC_API_KEY` Value: `unused`
5. Click OK → OK. Restart Terminal/VS Code.

### To switch back to direct Anthropic

Remove or unset `ANTHROPIC_BASE_URL`. Set `ANTHROPIC_API_KEY` to your real Anthropic key.

> The proxy speaks Anthropic wire protocol, so Claude Code works identically — same slash commands, tool use, extended thinking.

---

## VS Code

Two options. **Claude Code extension** (recommended — what the team uses) or **Continue** (open-source alternative).

---

### Option A — Claude Code Extension (Recommended)

The official [Claude Code VS Code extension](https://marketplace.visualstudio.com/items?itemName=anthropic.claude-code) wraps the Claude Code CLI. It honors the same `ANTHROPIC_BASE_URL` / `ANTHROPIC_API_KEY` environment variables.

**Step 1 — Set env vars**

Follow the [Claude Code CLI](#claude-code-cli) section for your OS to set these permanently:

| Variable | Value |
|---|---|
| `ANTHROPIC_BASE_URL` | `http://127.0.0.1:3200` |
| `ANTHROPIC_API_KEY` | `unused` |

**Step 2 — Reload VS Code**

`Ctrl+Shift+P` → **Developer: Reload Window** (or quit and reopen).

**Step 3 — Verify**

Open Claude Code sidebar (`Ctrl+Shift+P` → **Claude Code: Open**). Send "hello" — response comes back via DeepSeek.

> The extension picks up env vars on launch. If you set env vars AFTER opening VS Code, reload the window.
>
> To switch back to direct Anthropic: unset `ANTHROPIC_BASE_URL`, set `ANTHROPIC_API_KEY` to your real Anthropic key, reload.

---

### Option B — Continue (Alternative)

[Continue](https://marketplace.visualstudio.com/items?itemName=Continue.continue) — open-source, supports custom Anthropic endpoints.

**Step 1 — Install**

VS Code → `Ctrl+Shift+X` → search **Continue** → Install.

**Step 2 — Open Continue sidebar (CRITICAL)**

`Ctrl+Shift+P` → type **Continue: Open Chat** → press Enter.

The sidebar opens. This creates the `~/.continue` folder and default `config.json`. Close the sidebar — you'll edit the file directly.

> **Skipping this step = file not found.** Continue doesn't create the folder until you open it once.

**Step 3 — Edit config**

`Ctrl+Shift+P` → **Continue: Open config.json** → replace all contents with:

```json
{
  "models": [
    {
      "title": "Sonnet (DeepSeek Pro)",
      "provider": "anthropic",
      "model": "claude-sonnet-4-6",
      "apiBase": "http://127.0.0.1:3200",
      "apiKey": "unused"
    },
    {
      "title": "Haiku (DeepSeek Flash)",
      "provider": "anthropic",
      "model": "claude-haiku-4-5-20251001",
      "apiBase": "http://127.0.0.1:3200",
      "apiKey": "unused"
    }
  ],
  "tabAutocompleteModel": {
    "title": "Haiku (DeepSeek Flash)",
    "provider": "anthropic",
    "model": "claude-haiku-4-5-20251001",
    "apiBase": "http://127.0.0.1:3200",
    "apiKey": "unused"
  }
}
```

Save (`Ctrl+S`).

**Step 4 — Reload + Verify**

`Ctrl+Shift+P` → **Developer: Reload Window**.

`Ctrl+L` to open Continue sidebar. Select **Sonnet (DeepSeek Pro)** from model dropdown. Send "hello" — response comes back.

### VS Code Common Issues

| Problem | Fix |
|---|---|
| Claude Code extension: "no API key" | Env vars not set. Check `echo $ANTHROPIC_BASE_URL` (or `echo $env:ANTHROPIC_BASE_URL` on PowerShell). Reload window. |
| Claude Code extension: ignores proxy | Set env vars in System Environment Variables, not just shell profile — VS Code may not inherit shell profile exports. |
| Continue: `config.json` not found | Do Step 2 first — open Continue sidebar once |
| Continue: "Unable to connect" | Proxy not running. Run `npx deepclaude-mixed-setup@latest` |
| Continue: Model not in dropdown | Reload VS Code: `Ctrl+Shift+P` → Developer: Reload Window |
| Continue: Tab autocomplete not working | Both `models` AND `tabAutocompleteModel` must have Haiku |

### WSL Users

**Claude Code extension with Remote-WSL:**
Env vars set inside WSL are picked up by the extension running in Remote-WSL context. Follow the [Claude Code CLI](#claude-code-cli) Linux instructions inside WSL.

**Continue with Remote-WSL (recommended for Continue):**
Follow Steps 1-4 inside your WSL VS Code session. Continue runs in WSL context. Config goes to `~/.continue/config.json` inside WSL. Proxy reachable at `127.0.0.1:3200` (WSL2 with `networkingMode=mirrored`).

**Continue on Windows host:**
Proxy runs on Windows. Continue extension runs on Windows. Config path: `%USERPROFILE%\.continue\config.json`. Everything uses `127.0.0.1`.

Either way: verify proxy reachable:
```bash
curl -s http://127.0.0.1:3200/_proxy/status
```
Must show `"deepseekKey": "set"`.

---

## Cursor

### macOS

1. Open Cursor → **Settings** (`Cmd+,`) → **Models**
2. Under **API Keys**, find **Anthropic API Key** → enter `unused`
3. Find **Anthropic Base URL** field → enter `http://127.0.0.1:3200`
4. Save

**Alternative — env var launch:**
```bash
ANTHROPIC_BASE_URL=http://127.0.0.1:3200 ANTHROPIC_API_KEY=unused open /Applications/Cursor.app
```

Or add to `~/.zshrc` for permanent.

### Windows

1. Open Cursor → **File** → **Preferences** → **Settings** (`Ctrl+,`)
2. Search "anthropic"
3. Set:
   - **Anthropic: Api Key:** `unused`
   - **Anthropic: Base Url:** `http://127.0.0.1:3200`
4. Save

**Alternative — env var launch (PowerShell):**
```powershell
$env:ANTHROPIC_BASE_URL="http://127.0.0.1:3200"
$env:ANTHROPIC_API_KEY="unused"
& "$env:LOCALAPPDATA\Programs\Cursor\Cursor.exe"
```

Or set permanent system env vars (see Claude Code CLI / Windows section above).

### Linux

1. Open Cursor → **Settings** → **Models**
2. **Anthropic API Key:** `unused`
3. **Anthropic Base URL:** `http://127.0.0.1:3200`
4. Save

**Alternative — env var launch:**
```bash
ANTHROPIC_BASE_URL=http://127.0.0.1:3200 ANTHROPIC_API_KEY=unused cursor
```

### Model Names (All OS)

Use standard Anthropic model IDs — proxy auto-remaps:

| Model name in Cursor | Routes to |
|---|---|
| `claude-opus-4-6` | DeepSeek V4 Pro |
| `claude-sonnet-4-6` | DeepSeek V4 Pro |
| `claude-haiku-4-5-20251001` | DeepSeek V4 Flash |

---

## Verify Everything Works

### macOS / Linux
```bash
curl -s http://127.0.0.1:3200/_proxy/status | python3 -m json.tool
```

### Windows (PowerShell)
```powershell
Invoke-RestMethod http://127.0.0.1:3200/_proxy/status | ConvertTo-Json
```

### Windows (Command Prompt)
```cmd
curl -s http://127.0.0.1:3200/_proxy/status
```

Send a test message in your tool of choice. If response comes back, routing works.

---

## Proxy Auto-Start

Installer sets up a system service — proxy starts automatically on login.

| OS | Service | Manual Restart |
|---|---|---|
| macOS | LaunchAgent | `launchctl unload ~/Library/LaunchAgents/com.deepclaude.proxy.plist && launchctl load ~/Library/LaunchAgents/com.deepclaude.proxy.plist` |
| Linux | systemd-user | `systemctl --user restart deepclaude-proxy` |
| Windows | Task Scheduler | `schtasks /Run /TN DeepclaudeProxy` |

### Logs

| OS | Log Location | View Command |
|---|---|---|
| macOS | `/tmp/com.deepclaude.proxy.err.log` | `tail -f /tmp/com.deepclaude.proxy.err.log` |
| Linux | journald | `journalctl --user -u deepclaude-proxy -f` |
| Windows | `%TEMP%\deepclaude-proxy.err.log` | `type %TEMP%\deepclaude-proxy.err.log` (cmd) |

---

## Model Routing

| Picker Label | Backend | DeepSeek Model | Notes |
|---|---|---|---|
| Opus 4.6 | DeepSeek | V4 Pro | Reasoning quality |
| Sonnet 4.6 | DeepSeek | V4 Pro | Default workhorse |
| Haiku 4.5 | DeepSeek | V4 Flash | Fast + cheap |

Switch mid-chat via Claude Desktop picker — no restart needed.

---

## Upgrading

```bash
npx deepclaude-mixed-setup@latest
```

Re-deploys latest proxy script, restarts service. Your API key preserved.

**When to upgrade:** unexpected 400 errors, model routing issues. Check [releases](https://github.com/sayanthns/deepclaude-mixed/releases).

---

## Troubleshooting

### Proxy not running after reboot

**macOS:**
```bash
launchctl load ~/Library/LaunchAgents/com.deepclaude.proxy.plist
```

**Linux:**
```bash
systemctl --user enable --now deepclaude-proxy
```

**Windows:**
```cmd
schtasks /Run /TN DeepclaudeProxy
```

### 400 error on second message (multi-turn)

Old proxy version. Run `npx deepclaude-mixed-setup@latest`. Fixed in v0.1.2.

### Claude Code ignores proxy

**macOS / Linux:**
```bash
echo $ANTHROPIC_BASE_URL   # must print http://127.0.0.1:3200
```
If empty, re-add exports to shell profile and `source` it.

**Windows (PowerShell):**
```powershell
echo $env:ANTHROPIC_BASE_URL
```

### Cursor shows "invalid API key"

Set API key to literal string `unused`. Proxy doesn't validate it — DeepSeek auth handled server-side via proxy's stored key.

### "Unable to connect" in Continue / Cline

1. Verify proxy running: `curl -s http://127.0.0.1:3200/_proxy/status`
2. Check `apiBase` has no trailing slash
3. Check `apiBase` uses `http://` not `https://`

### Stale env vars from manual setup (pre-npm)

Check if old manual setup lines override the gateway:

**macOS / Linux:**
```bash
grep -E "ANTHROPIC_BASE_URL|ANTHROPIC_AUTH_TOKEN|CLAUDE_CODE_SUBAGENT" ~/.zshrc ~/.bashrc ~/.zprofile 2>/dev/null
```

If anything matches, **remove those lines**, then:
```bash
source ~/.zshrc
```

**Windows (PowerShell):**
```powershell
Get-ChildItem env: | Where-Object { $_.Name -like "*ANTHROPIC*" }
```

Remove stale env vars from System Environment Variables or PowerShell profile.

---

## Uninstall

### macOS / Linux
```bash
npx deepclaude-mixed-uninstall
```

### Windows (Command Prompt)
```cmd
npx deepclaude-mixed-uninstall
```

Removes: proxy script, auto-start service. Keep: Claude-3p profiles (delete via Claude Desktop UI). Remove env vars from shell profile / system variables manually. Remove Continue/Cline config entries manually.
