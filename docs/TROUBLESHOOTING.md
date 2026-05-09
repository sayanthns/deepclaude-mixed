# Troubleshooting

## API Error: Unable to connect to API (ConnectionRefused)

Proxy not running. Check:

```bash
# macOS
launchctl list | grep deepclaude
curl -s http://127.0.0.1:3200/_proxy/status
tail -f /tmp/com.deepclaude.proxy.err.log

# windows
schtasks /Query /TN DeepclaudeProxy
type %TEMP%\deepclaude-proxy.err.log

# linux
systemctl --user status deepclaude-proxy
journalctl --user -u deepclaude-proxy -f
```

## Invalid `signature` in `thinking` block

Cross-backend signature mismatch. Should be auto-stripped. If still hitting:
- Update package: `npx deepclaude-mixed-setup@latest`
- Start a new chat

## Picker shows "Opus 4.7" but request fails with "model not found"

DeepSeek doesn't recognize `claude-opus-4-7` yet. Use `claude-opus-4-6` in the model list (current installer default).

## Settings → Usage shows Pro plan limits ticking

App is in 1p mode. Run `claude-mode 3p`.

## Anthropic Opus returns 429 mid-session

Tier 1 default = 50 RPM. Upgrade tier or set lower default model. Watch spend cap in console.anthropic.com.

## Chrome/VS Code extension

Outside scope of mixed installer. Use the deepclaude CLI tool separately for Claude Code.
