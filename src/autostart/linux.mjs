import { writeFileSync, mkdirSync, unlinkSync, existsSync } from 'fs';
import { join } from 'path';
import { execSync } from 'child_process';
import { getSystemdUserDir } from '../config/paths.mjs';

const UNIT = 'deepclaude-proxy.service';

function unitPath(opts) {
    return join(getSystemdUserDir(opts), UNIT);
}

export function install({ home, nodePath, scriptPath, env }) {
    const envLines = Object.entries(env).map(([k,v]) => `Environment=${k}=${v}`).join('\n');
    const unit = `[Unit]
Description=DeepClaude Mixed Proxy
After=network-online.target

[Service]
ExecStart=${nodePath} ${scriptPath}
Restart=always
RestartSec=5
${envLines}
StandardOutput=append:/tmp/deepclaude-proxy.out.log
StandardError=append:/tmp/deepclaude-proxy.err.log

[Install]
WantedBy=default.target
`;
    mkdirSync(getSystemdUserDir({ home }), { recursive: true });
    writeFileSync(unitPath({ home }), unit);
    execSync('systemctl --user daemon-reload');
    execSync(`systemctl --user enable ${UNIT}`);
    execSync(`systemctl --user restart ${UNIT}`);
}

export function uninstall({ home }) {
    const p = unitPath({ home });
    if (!existsSync(p)) return false;
    try { execSync(`systemctl --user stop ${UNIT}`); } catch {}
    try { execSync(`systemctl --user disable ${UNIT}`); } catch {}
    unlinkSync(p);
    execSync('systemctl --user daemon-reload');
    return true;
}

export function isInstalled({ home }) {
    return existsSync(unitPath({ home }));
}
