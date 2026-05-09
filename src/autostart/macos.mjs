import { writeFileSync, mkdirSync, existsSync, unlinkSync } from 'fs';
import { join } from 'path';
import { execSync } from 'child_process';
import { getLaunchAgentDir, getAutoStartLabel } from '../config/paths.mjs';

function plistPath(opts) {
    return join(getLaunchAgentDir(opts), `${getAutoStartLabel()}.plist`);
}

export function install({ home, nodePath, scriptPath, env }) {
    const label = getAutoStartLabel();
    const envXml = Object.entries(env).map(([k,v]) => `        <key>${k}</key>\n        <string>${v}</string>`).join('\n');
    const plist = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Label</key><string>${label}</string>
    <key>ProgramArguments</key>
    <array>
        <string>${nodePath}</string>
        <string>${scriptPath}</string>
    </array>
    <key>EnvironmentVariables</key>
    <dict>
${envXml}
        <key>PATH</key><string>/usr/local/bin:/opt/homebrew/bin:/usr/bin:/bin</string>
    </dict>
    <key>RunAtLoad</key><true/>
    <key>KeepAlive</key><true/>
    <key>StandardOutPath</key><string>/tmp/${label}.out.log</string>
    <key>StandardErrorPath</key><string>/tmp/${label}.err.log</string>
</dict>
</plist>
`;
    mkdirSync(getLaunchAgentDir({ home }), { recursive: true });
    writeFileSync(plistPath({ home }), plist);
    try { execSync(`launchctl unload "${plistPath({ home })}"`, { stdio: 'ignore' }); } catch {}
    execSync(`launchctl load "${plistPath({ home })}"`);
}

export function uninstall({ home }) {
    const p = plistPath({ home });
    if (!existsSync(p)) return false;
    try { execSync(`launchctl unload "${p}"`, { stdio: 'ignore' }); } catch {}
    unlinkSync(p);
    return true;
}

export function isInstalled({ home }) {
    return existsSync(plistPath({ home }));
}
