import { execSync, spawn } from 'child_process';
import { platform as osPlatform } from 'os';

export function killClaude({ platform = osPlatform() } = {}) {
    const cmd = platform === 'darwin'
        ? 'pkill -9 -f "Claude.app"; pkill -9 -f "Claude Helper"'
        : platform === 'win32'
        ? 'taskkill /IM Claude.exe /F'
        : 'pkill -9 -f claude';
    try { execSync(cmd, { stdio: 'ignore' }); } catch {}
}

export function openClaude({ platform = osPlatform() } = {}) {
    if (platform === 'darwin') {
        spawn('open', ['/Applications/Claude.app'], { detached: true, stdio: 'ignore' }).unref();
    } else if (platform === 'win32') {
        spawn('cmd', ['/c', 'start', '', `${process.env.LOCALAPPDATA}\\Claude\\Claude.exe`], { detached: true, stdio: 'ignore', shell: true }).unref();
    } else {
        try { spawn('claude', [], { detached: true, stdio: 'ignore' }).unref(); }
        catch { spawn('xdg-open', ['claude'], { detached: true, stdio: 'ignore' }).unref(); }
    }
}
