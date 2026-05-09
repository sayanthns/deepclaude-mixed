# Architecture

## Components

```
Claude Desktop (3p mode, custom gateway profile)
    ↓ HTTPS to local
http://127.0.0.1:3200  (mixed-proxy.mjs, Node.js, no deps)
    ├─ claude-opus-*   → api.anthropic.com  (x-api-key)
    ├─ claude-sonnet-* → api.deepseek.com  (Bearer, model rewritten to deepseek-v4-pro)
    └─ claude-haiku-*  → api.deepseek.com  (Bearer, model rewritten to deepseek-v4-flash)
```

## Why local proxy

DeepSeek's `/anthropic` endpoint accepts any Claude model ID but always routes to `deepseek-v4-flash` regardless of input. To use `deepseek-v4-pro`, the literal name must reach DeepSeek. Claude Desktop validates outgoing model names against an Anthropic whitelist, so `deepseek-v4-pro` cannot leave Claude Desktop. Hence the proxy: it accepts Anthropic-named requests and rewrites the body before forwarding.

## Why thinking-block stripping

Anthropic and DeepSeek both emit `thinking` blocks with provider-signed signatures. Switching providers mid-conversation includes prior assistant turns in the new request. The receiving provider rejects foreign signatures with HTTP 400. The proxy strips `thinking` and `redacted_thinking` blocks from prior assistant content on every request before forwarding.

## Auto-start

| OS | Mechanism | Path |
|---|---|---|
| macOS | LaunchAgent | `~/Library/LaunchAgents/com.deepclaude.proxy.plist` |
| Windows | Task Scheduler | task name `DeepclaudeProxy`, logon trigger |
| Linux | systemd-user | `~/.config/systemd/user/deepclaude-proxy.service` |

## Files written by installer

| Path | Purpose |
|---|---|
| `~/.deepclaude-mixed/mixed-proxy.mjs` | Proxy script (copied from package) |
| `<USERDATA>/Claude-3p/configLibrary/<uuid>.json` | Active gateway profile |
| `<USERDATA>/Claude-3p/configLibrary/_meta.json` | Profile index, applied id |
| `<USERDATA>/Claude-3p/claude_desktop_config.json` | `deploymentMode: "3p"` |
| OS-specific autostart unit | Per table above |

## Mode toggle

`claude-mode 3p` flips `deploymentMode` to `3p` and restarts Claude Desktop. The userData dir auto-suffixes with `-3p` regardless, but the deploymentMode flag inside controls whether the app uses the gateway profile or falls back to 1p.
