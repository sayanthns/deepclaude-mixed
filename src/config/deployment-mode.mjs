import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs';
import { join } from 'path';
import { getClaudeUserDataDir } from './paths.mjs';

function configPath(opts) {
    return join(getClaudeUserDataDir(opts), 'claude_desktop_config.json');
}

export function getDeploymentMode(opts) {
    const p = configPath(opts);
    if (!existsSync(p)) return null;
    try { return JSON.parse(readFileSync(p, 'utf8')).deploymentMode || null; }
    catch { return null; }
}

export function setDeploymentMode({ mode, ...opts }) {
    if (mode !== '1p' && mode !== '3p') throw new Error(`mode must be 1p or 3p, got ${mode}`);
    const p = configPath(opts);
    mkdirSync(getClaudeUserDataDir(opts), { recursive: true });
    let cfg = {};
    if (existsSync(p)) {
        try { cfg = JSON.parse(readFileSync(p, 'utf8')); } catch {}
    }
    cfg.deploymentMode = mode;
    writeFileSync(p, JSON.stringify(cfg, null, 2));
}
