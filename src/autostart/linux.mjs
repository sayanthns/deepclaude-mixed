import { writeFileSync, mkdirSync, unlinkSync, existsSync } from 'fs';
import { join } from 'path';
import { execSync } from 'child_process';
import { getSystemdUserDir } from '../config/paths.mjs';

const UNIT = 'deepclaude-proxy.service';

function unitPath(opts) {
    return join(getSystemdUserDir(opts), UNIT);
}

function trySystemctl(args, fallback) {
    try {
        execSync(`systemctl --user ${args}`, { stdio: 'pipe' });
        return true;
    } catch (e) {
        // D-Bus session not available (SSH, WSL, cron, non-GUI login)
        if (e.stderr && e.stderr.toString().includes('not defined')) {
            return false;
        }
        // systemd user instance not running — try not to crash
        if (fallback) fallback(e);
        return false;
    }
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

    const ok = trySystemctl('daemon-reload');
    if (ok) {
        trySystemctl(`enable ${UNIT}`);
        trySystemctl(`restart ${UNIT}`);
    } else {
        console.warn('');
        console.warn('⚠  systemd user session not available (SSH / WSL / headless?).');
        console.warn('   Unit file written. Start manually when logged in via GUI:');
        console.warn(`   systemctl --user daemon-reload`);
        console.warn(`   systemctl --user enable ${UNIT}`);
        console.warn(`   systemctl --user start ${UNIT}`);
        console.warn('');
        console.warn('   Or run directly (not auto-start):');
        console.warn(`   ${nodePath} ${scriptPath} &`);
        console.warn('');
        // Don't crash — profile and deployment mode are already set.
        // User can start the proxy manually.
    }
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
