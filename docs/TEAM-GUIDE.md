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

> **Critical:** GUI apps (VS Code) do NOT inherit shell profile exports (`~/.zshrc`, `~/.bashrc`) on macOS or Linux. Each OS needs a different method to pass env vars to VS Code.

---

### Option A — Claude Code Extension (Recommended)

The official [Claude Code VS Code extension](https://marketplace.visualstudio.com/items?itemName=anthropic.claude-code) wraps the Claude Code CLI. It needs two env vars:

| Variable | Value |
|---|---|
| `ANTHROPIC_BASE_URL` | `http://127.0.0.1:3200` |
| `ANTHROPIC_API_KEY` | `unused` |

---

#### macOS

**Step 1 — Install extension**

`Cmd+Shift+X` → search **Claude Code** → Install.

**Step 2 — Set env vars (pick one method)**

**Method A — Launch VS Code from terminal (simplest, always works):**

```bash
# First, add to ~/.zshrc so terminal has the vars
echo 'export ANTHROPIC_BASE_URL=http://127.0.0.1:3200' >> ~/.zshrc
echo 'export ANTHROPIC_API_KEY=unused' >> ~/.zshrc
source ~/.zshrc

# Then launch VS Code from this terminal
open -a "Visual Studio Code"
```

VS Code inherits env vars from the terminal that launched it. Always open VS Code from terminal after setting this up.

**Method B — LaunchAgent (auto-start, permanent for all apps):**

This makes the env vars available to ALL GUI apps, not just VS Code.

```bash
# Create the LaunchAgent
cat > ~/Library/LaunchAgents/com.deepclaude.env.plist << 'PLIST'
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Label</key>
    <string>com.deepclaude.env</string>
    <key>ProgramArguments</key>
    <array>
        <string>/bin/launchctl</string>
        <string>setenv</string>
        <string>ANTHROPIC_BASE_URL</string>
        <string>http://127.0.0.1:3200</string>
    </array>
    <key>RunAtLoad</key>
    <true/>
</dict>
</plist>
PLIST

# Load it now
launchctl load ~/Library/LaunchAgents/com.deepclaude.env.plist

# Set ANTHROPIC_API_KEY the same way (need a second entry or use a single script)
# Easiest: combine both in a shell script LaunchAgent
```

**Simpler combined approach — shell script LaunchAgent:**

```bash
cat > ~/Library/LaunchAgents/com.deepclaude.env.plist << 'PLIST'
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Label</key>
    <string>com.deepclaude.env</string>
    <key>ProgramArguments</key>
    <array>
        <string>/bin/bash</string>
        <string>-c</string>
        <string>launchctl setenv ANTHROPIC_BASE_URL http://127.0.0.1:3200; launchctl setenv ANTHROPIC_API_KEY unused</string>
    </array>
    <key>RunAtLoad</key>
    <true/>
</dict>
</plist>
PLIST

launchctl load ~/Library/LaunchAgents/com.deepclaude.env.plist
```

**Log out and log back in** for this to take effect for all apps.

**Step 3 — Verify**

1. Quit VS Code completely (`Cmd+Q`)
2. Reopen VS Code
3. `Cmd+Shift+P` → **Claude Code: Open**
4. Type: `say hello in one word`
5. Response comes back = working

---

#### Linux (Ubuntu/Debian)

**Step 1 — Install extension**

`Ctrl+Shift+X` → search **Claude Code** → Install.

**Step 2 — Set env vars (pick one method)**

**Method A — Launch from terminal (simplest, always works):**

```bash
# Add to ~/.bashrc so terminal has the vars
echo 'export ANTHROPIC_BASE_URL=http://127.0.0.1:3200' >> ~/.bashrc
echo 'export ANTHROPIC_API_KEY=unused' >> ~/.bashrc
source ~/.bashrc

# Launch VS Code from this terminal
code &
```

Always launch VS Code from terminal after setting this up.

**Method B — Custom .desktop file (launch from app menu):**

Creates a new "VS Code (Proxy)" entry in your app launcher.

```bash
cat > ~/.local/share/applications/code-proxy.desktop << 'DESKTOP'
[Desktop Entry]
Name=VS Code (Proxy)
Comment=VS Code with DeepSeek proxy env vars
Exec=/bin/sh -c "ANTHROPIC_BASE_URL=http://127.0.0.1:3200 ANTHROPIC_API_KEY=unused /usr/share/code/code --unity-launch %F"
Icon=com.visualstudio.code
Type=Application
Categories=Development;
DESKTOP

# Refresh app launcher cache
update-desktop-database ~/.local/share/applications/ 2>/dev/null
```

Search "VS Code (Proxy)" in your app launcher and pin it.

> **If `/usr/share/code/code` doesn't exist:** find the real path with `which code` or check `/snap/bin/code` (snap install), `/usr/share/code/bin/code` (flatpak). Update the `Exec=` line accordingly.

**Method C — Environment config file (system-wide):**

```bash
sudo cat > /etc/environment.d/deepclaude.conf << 'ENV'
ANTHROPIC_BASE_URL=http://127.0.0.1:3200
ANTHROPIC_API_KEY=unused
ENV
```

Log out and log back in. This affects ALL applications.

**Step 3 — Verify**

1. Quit VS Code completely (`Ctrl+Q` or `File → Quit`)
2. Reopen VS Code (via terminal or your custom .desktop shortcut)
3. `Ctrl+Shift+P` → **Claude Code: Open**
4. Type: `say hello in one word`
5. Response comes back = working

---

#### Windows

**Step 1 — Install extension**

`Ctrl+Shift+X` → search **Claude Code** → Install.

**Step 2 — Set env vars via System Environment Variables**

This is the ONLY method on Windows that reliably passes env vars to GUI apps.

1. Press `Win` → type **environment variables** → click **Edit the system environment variables**
2. Click **Environment Variables...** button
3. Under **User variables for (your name)**, click **New**
4. Add two entries:
   - Name: `ANTHROPIC_BASE_URL` → Value: `http://127.0.0.1:3200`
   - Name: `ANTHROPIC_API_KEY` → Value: `unused`
5. Click **OK** → **OK** → **OK**
6. **Restart VS Code completely** (close all windows)

> **PowerShell env vars (`$env:...`) do NOT work for GUI apps.** Must use system environment variables dialog.

**Step 3 — Verify**

1. Open VS Code
2. `Ctrl+Shift+P` → **Claude Code: Open**
3. Type: `say hello in one word`
4. Response comes back = working

#### VS Code — Quick Troubleshooting (All OS)

```bash
# Check 1: Proxy alive?
curl -s http://127.0.0.1:3200/_proxy/status
# Must show: "deepseekKey": "set"

# Check 2: Env vars visible INSIDE VS Code?
# Open VS Code terminal (Ctrl+`) and run:
echo $ANTHROPIC_BASE_URL        # macOS/Linux
echo $env:ANTHROPIC_BASE_URL    # Windows PowerShell
# Must print: http://127.0.0.1:3200

# Check 3: If check 1 passes but check 2 is empty:
# Env vars aren't reaching VS Code. Re-do Step 2 for your OS.
```

| Symptom | Cause | Fix |
|---|---|---|
| "No API key" in Claude Code extension | Env vars not reaching VS Code | Re-do env var setup for your OS, quit VS Code, reopen |
| Works in terminal `claude` but not VS Code | GUI doesn't inherit shell exports | macOS/Linux: launch VS Code from terminal. Windows: use system env vars. |
| Still not working after env vars set | VS Code not restarted | Quit completely, not just close window. Reopen. |
| Proxy check shows MISSING | Proxy not running or no key | Run `npx deepclaude-mixed-setup@latest` again |

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

### WSL Users (Windows Subsystem for Linux)

> **Do not rely on the Windows-side proxy from WSL.** WSL's `127.0.0.1` is its own loopback — the Windows proxy at `127.0.0.1:3200` is not reachable. Install the proxy **inside WSL** instead.

**Step 1 — Install Node inside WSL (if not present):**
```bash
node --version || (curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash - && sudo apt-get install -y nodejs)
```

**Step 2 — Install proxy inside WSL:**
```bash
npx deepclaude-mixed-setup
```
Paste DeepSeek key. Proxy now runs at `127.0.0.1:3200` inside WSL.

**Step 3 — Set env vars inside WSL:**
```bash
echo 'export ANTHROPIC_BASE_URL=http://127.0.0.1:3200' >> ~/.bashrc
echo 'export ANTHROPIC_API_KEY=unused' >> ~/.bashrc
source ~/.bashrc
```

**Step 4 — Verify:**
```bash
curl -s http://127.0.0.1:3200/_proxy/status
# Must show "deepseekKey": "set"
```

**Step 5 — VS Code Claude Code extension:**
1. Open VS Code → connect to WSL (`Ctrl+Shift+P` → **Remote-WSL: Connect to WSL**)
2. `Ctrl+Shift+X` → search **Claude Code** → click **Install in WSL** (not "Install" — must say WSL)
3. `Ctrl+Shift+P` → **Claude Code: Open**
4. Send test message — should respond through DeepSeek

**Step 5 (alt) — Continue extension in WSL:**
1. In WSL-connected VS Code: install Continue extension (Install in WSL)
2. Config at `~/.continue/config.json` inside WSL:
```json
{
  "models": [
    {
      "title": "DeepSeek Sonnet",
      "provider": "anthropic",
      "model": "claude-sonnet-4-6",
      "apiBase": "http://127.0.0.1:3200",
      "apiKey": "unused"
    }
  ]
}
```
3. Reload VS Code window (`Ctrl+Shift+P` → Developer: Reload Window)

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

### VS Code (Claude Code extension) ignores proxy

**Reason:** GUI apps don't inherit shell profile exports on macOS/Linux. VS Code launched from Dock/Launcher has no access to `~/.zshrc` or `~/.bashrc` variables.

**Fix per OS:**

**macOS:** Always launch VS Code from terminal: `open -a "Visual Studio Code"` (after `source ~/.zshrc`). Or use LaunchAgent.

**Linux:** Always launch VS Code from terminal: `code &`. Or create `.desktop` file with env vars in `Exec=` line.

**Windows:** Set env vars via System Environment Variables dialog (not PowerShell `$env:`). PowerShell env vars don't reach GUI apps.

**Verify env vars reach VS Code:** Open VS Code terminal (`Ctrl+``) and run `echo $ANTHROPIC_BASE_URL`. Must print `http://127.0.0.1:3200`. If empty, re-do fix above.

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
