// Claude Code CLI sandbox network allowlist.
// Separate from Cowork sandbox — this is what subagents (spawned via Code mode)
// use for outbound HTTP. Lives at ~/.claude/settings.json under
// sandbox.network.allowedDomains. Note: the binary internally renames this to
// "allowedHosts" for UI display, but the settings.json key MUST be
// "allowedDomains" — using "allowedHosts" silently no-ops.

import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { homedir } from 'os';

function settingsPath({ home = homedir() } = {}) {
    return join(home, '.claude', 'settings.json');
}

function readCfg(p) {
    if (!existsSync(p)) return {};
    try { return JSON.parse(readFileSync(p, 'utf8')); } catch { return {}; }
}

export function getCliSandboxHosts(opts = {}) {
    const cfg = readCfg(settingsPath(opts));
    return cfg.sandbox?.network?.allowedDomains || null;
}

/**
 * Add hosts to Claude Code CLI sandbox allowlist (sandbox.network.allowedDomains).
 * @param {Object} opts
 * @param {string[]} opts.hosts
 * @param {boolean} [opts.merge=true]
 * @param {string}  [opts.home]
 */
export function setCliSandboxHosts({ hosts, merge = true, ...opts }) {
    if (!Array.isArray(hosts)) throw new Error('hosts must be an array of strings');
    const p = settingsPath(opts);
    mkdirSync(dirname(p), { recursive: true });
    const cfg = readCfg(p);
    cfg.sandbox = cfg.sandbox || {};
    cfg.sandbox.network = cfg.sandbox.network || {};

    // Migrate any v0.1.4 misnamed key
    const legacy = cfg.sandbox.network.allowedHosts;
    if (Array.isArray(legacy) && legacy.length > 0) {
        const merged = cfg.sandbox.network.allowedDomains || [];
        cfg.sandbox.network.allowedDomains = [...new Set([...merged, ...legacy])];
        delete cfg.sandbox.network.allowedHosts;
    }

    const existing = cfg.sandbox.network.allowedDomains || [];
    const next = merge
        ? [...new Set([...existing, ...hosts])]
        : hosts;
    cfg.sandbox.network.allowedDomains = next;
    writeFileSync(p, JSON.stringify(cfg, null, 2));
    return next;
}
