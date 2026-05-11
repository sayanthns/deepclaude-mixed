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

### Option A — Continue extension (recommended)

[Continue](https://marketplace.visualstudio.com/items?itemName=Continue.continue) is open-source, supports custom Anthropic endpoints.

#### Setup (All OS)

1. VS Code → Extensions (`Ctrl+Shift+X`) → search **Continue** → Install
2. Open Continue config:
   - **macOS:** `~/.continue/config.json`
   - **Linux:** `~/.continue/config.json`
   - **Windows:** `%USERPROFILE%\.continue\config.json` (paste in File Explorer address bar)
   
   Or via VS Code: `Ctrl+Shift+P` → **Continue: Open config.json**

3. Replace contents with:

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

4. Save (`Ctrl+S`)
5. Reload VS Code: `Ctrl+Shift+P` → **Developer: Reload Window**
6. Open Continue sidebar (`Ctrl+L`) — select "Sonnet (DeepSeek Pro)" from model dropdown

#### Troubleshooting Continue

- **Model not appearing:** config path must match exactly. Windows: `%USERPROFILE%\.continue\config.json` (not `.txt` extension)
- **"Unable to connect":** proxy not running — verify with `curl` or `Invoke-RestMethod`
- **Tab autocomplete not working:** Haiku model must be present in the `models` array AND referenced in `tabAutocompleteModel`

### Option B — Cline extension

[Cline](https://marketplace.visualstudio.com/items?itemName=saoudrizwan.claude-dev) supports custom Anthropic base URLs.

#### Setup (All OS)

1. VS Code → Extensions → search **Cline** → Install
2. Open Cline sidebar (robot icon in activity bar)
3. Click gear icon (⚙) → **API Provider**
4. Set:
   - **API Provider:** Anthropic
   - **API Key:** `unused`
   - **Base URL:** `http://127.0.0.1:3200`
5. Save. Cline routes through your proxy.

### Option C — Anthropic official extension

The official Claude VS Code extension does not expose a custom base URL setting. Use Continue or Cline instead.

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
