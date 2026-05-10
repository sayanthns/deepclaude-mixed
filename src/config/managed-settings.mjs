// Claude Code MANAGED settings (system-wide, root-owned).
// Critical: Cowork spawns subagents with `allowManagedDomainsOnly: true`,
// which means user/project/local settings are SILENTLY IGNORED for the
// network sandbox allowlist. Only managed settings are honored.
//
// macOS: /Library/Application Support/ClaudeCode/managed-settings.json
// Linux: /etc/claude-code/managed-settings.json
// Windows: C:\Program Files\ClaudeCode\managed-settings.json (admin)
//
// Writing this file requires sudo / admin elevation.

import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { execSync } from 'child_process';
import { platform as osPlatform } from 'os';
import { tmpdir } from 'os';

export function getManagedSettingsPath({ platform = osPlatform() } = {}) {
    if (platform === 'darwin') return '/Library/Application Support/ClaudeCode/managed-settings.json';
    if (platform === 'win32')  return 'C:\\Program Files\\ClaudeCode\\managed-settings.json';
    return '/etc/claude-code/managed-settings.json';
}

function readCfg(p) {
    if (!existsSync(p)) return {};
    try { return JSON.parse(readFileSync(p, 'utf8')); } catch { return {}; }
}

export function getManagedAllowedDomains(opts = {}) {
    const p = getManagedSettingsPath(opts);
    if (!existsSync(p)) return null;
    const cfg = readCfg(p);
    return cfg.sandbox?.network?.allowedDomains || null;
}

/**
 * Write managed settings via sudo. Prompts for password.
 * @param {Object} opts
 * @param {string[]} opts.hosts
 * @param {boolean} [opts.merge=true]
 * @param {string}  [opts.platform]
 */
export function setManagedAllowedDomains({ hosts, merge = true, ...opts }) {
    if (!Array.isArray(hosts)) throw new Error('hosts must be an array of strings');
    const platform = opts.platform || osPlatform();
    const p = getManagedSettingsPath({ platform });

    // Read existing (if readable; managed file may be root-only on read too on some setups)
    let existing = [];
    try {
        const cur = existsSync(p) ? JSON.parse(readFileSync(p, 'utf8')) : {};
        existing = cur.sandbox?.network?.allowedDomains || [];
    } catch {}

    const next = merge ? [...new Set([...existing, ...hosts])] : hosts;

    // Build full config preserving any existing keys
    let cfg = {};
    try {
        cfg = existsSync(p) ? JSON.parse(readFileSync(p, 'utf8')) : {};
    } catch {}
    cfg.sandbox = cfg.sandbox || {};
    cfg.sandbox.network = cfg.sandbox.network || {};
    cfg.sandbox.network.allowedDomains = next;

    const json = JSON.stringify(cfg, null, 2);

    if (platform === 'darwin' || platform === 'linux') {
        // Write to tmp, then sudo install
        const tmp = join(tmpdir(), `dcm-managed-${Date.now()}.json`);
        writeFileSync(tmp, json);

        const dir = dirname(p);
        // Single sudo invocation: mkdir + install
        const cmd = `sudo sh -c 'mkdir -p "${dir}" && cp "${tmp}" "${p}" && chown root:wheel "${p}" && chmod 644 "${p}"'`;
        execSync(cmd, { stdio: 'inherit' });

        try { execSync(`rm -f "${tmp}"`); } catch {}
    } else if (platform === 'win32') {
        // Windows: write via PowerShell elevated
        const tmp = join(tmpdir(), `dcm-managed-${Date.now()}.json`);
        writeFileSync(tmp, json);
        const dir = dirname(p);
        const ps = `Start-Process powershell -Verb RunAs -ArgumentList '-NoProfile','-Command',"New-Item -ItemType Directory -Force -Path '${dir}' | Out-Null; Copy-Item -Force '${tmp}' '${p}'"`;
        execSync(`powershell -NoProfile -Command "${ps}"`, { stdio: 'inherit' });
    }

    return next;
}
