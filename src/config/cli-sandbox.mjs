// Claude Code CLI sandbox network allowlist.
// Separate from Cowork sandbox — this is what subagents (spawned via Code mode)
// use for outbound HTTP. Lives at ~/.claude/settings.json under sandbox.network.allowedHosts.

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
    return cfg.sandbox?.network?.allowedHosts || null;
}

/**
 * Add hosts to Claude Code CLI sandbox allowlist.
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
    const existing = cfg.sandbox.network.allowedHosts || [];
    const next = merge
        ? [...new Set([...existing, ...hosts])]
        : hosts;
    cfg.sandbox.network.allowedHosts = next;
    writeFileSync(p, JSON.stringify(cfg, null, 2));
    return next;
}
