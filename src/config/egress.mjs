import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs';
import { join } from 'path';
import { getClaudeUserDataDir } from './paths.mjs';

const PREF_KEY = 'coworkEgressAllowedHosts';

function configPath(opts) {
    return join(getClaudeUserDataDir(opts), 'claude_desktop_config.json');
}

function readCfg(p) {
    if (!existsSync(p)) return {};
    try { return JSON.parse(readFileSync(p, 'utf8')); } catch { return {}; }
}

export function getEgressAllowedHosts(opts) {
    const cfg = readCfg(configPath(opts));
    return cfg.preferences?.[PREF_KEY] || null;
}

/**
 * Set Cowork sandbox egress allowlist.
 * @param {Object} opts
 * @param {string[]} opts.hosts - hosts/wildcards (e.g. "*.enfono.com") or ["*"] for unrestricted
 * @param {boolean} [opts.merge=true] - merge with existing list (true) or replace (false)
 */
export function setEgressAllowedHosts({ hosts, merge = true, ...opts }) {
    if (!Array.isArray(hosts)) throw new Error('hosts must be an array of strings');
    const p = configPath(opts);
    mkdirSync(getClaudeUserDataDir(opts), { recursive: true });
    const cfg = readCfg(p);
    cfg.preferences = cfg.preferences || {};
    const existing = cfg.preferences[PREF_KEY] || [];
    const next = merge
        ? [...new Set([...existing, ...hosts])]
        : hosts;
    cfg.preferences[PREF_KEY] = next;
    writeFileSync(p, JSON.stringify(cfg, null, 2));
    return next;
}

export const DEFAULT_HOSTS = [
    // Anthropic / DeepSeek
    'api.anthropic.com', 'console.anthropic.com',
    'api.deepseek.com', 'platform.deepseek.com',
    // Code hosting / package mirrors
    'github.com', 'api.github.com', 'raw.githubusercontent.com',
    'codeload.github.com', 'objects.githubusercontent.com',
    'registry.npmjs.org', 'pypi.org', 'files.pythonhosted.org',
    // Enfono internal — devs can append per-team via env or flag
    '*.enfonoerp.com', '*.enfono.com',
];
