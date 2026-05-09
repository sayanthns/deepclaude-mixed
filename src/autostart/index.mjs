import { platform as osPlatform } from 'os';
import * as macos from './macos.mjs';
import * as win from './windows.mjs';
import * as linux from './linux.mjs';

function impl(p = osPlatform()) {
    if (p === 'darwin') return macos;
    if (p === 'win32')  return win;
    return linux;
}

export const install     = (opts) => impl(opts?.platform).install(opts);
export const uninstall   = (opts) => impl(opts?.platform).uninstall(opts);
export const isInstalled = (opts) => impl(opts?.platform).isInstalled(opts);
