import { homedir, platform as osPlatform } from 'os';
import { join } from 'path';

const LABEL = 'com.deepclaude.proxy';

export function getClaudeUserDataDir({ platform = osPlatform(), home = homedir(), appdata = process.env.APPDATA } = {}) {
    if (platform === 'darwin') return join(home, 'Library', 'Application Support', 'Claude-3p');
    if (platform === 'win32')  return join(appdata, 'Claude-3p').replace(/\//g, '\\');
    return join(home, '.config', 'Claude-3p');
}

export function getLaunchAgentDir({ home = homedir() } = {}) {
    return join(home, 'Library', 'LaunchAgents');
}

export function getSystemdUserDir({ home = homedir() } = {}) {
    return join(home, '.config', 'systemd', 'user');
}

export function getAutoStartLabel() {
    return LABEL;
}

export function getProxyPort() {
    return 3200;
}

export function getInstallRoot({ home = homedir() } = {}) {
    return join(home, '.deepclaude-mixed');
}
