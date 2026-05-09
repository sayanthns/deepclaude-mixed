import { rmSync, existsSync } from 'fs';
import { homedir } from 'os';
import * as autostart from '../autostart/index.mjs';
import { killClaude } from '../claude-app/lifecycle.mjs';
import { getInstallRoot } from '../config/paths.mjs';
import { ok, info } from '../lib/log.mjs';

export async function main() {
    info('Uninstalling deepclaude-mixed-setup…');
    autostart.uninstall({ home: homedir() });
    ok('Removed auto-start service');

    const root = getInstallRoot();
    if (existsSync(root)) {
        rmSync(root, { recursive: true, force: true });
        ok(`Removed ${root}`);
    }

    killClaude();
    info('Note: gateway profile remains in Claude-3p/configLibrary — delete via Claude Desktop UI if desired.');
    ok('Done.');
}

main();
