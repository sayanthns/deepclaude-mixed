import { writeFileSync, unlinkSync, existsSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import { execSync } from 'child_process';

const TASK_NAME = 'DeepclaudeProxy';

export function install({ nodePath, scriptPath, env }) {
    const envClause = Object.entries(env).map(([k,v]) => `set "${k}=${v}"`).join(' & ');
    const cmd = `cmd /c "${envClause} & "${nodePath}" "${scriptPath}" >> "%TEMP%\\deepclaude-proxy.out.log" 2>> "%TEMP%\\deepclaude-proxy.err.log""`;
    const xmlPath = join(tmpdir(), 'deepclaude-task.xml');
    const xml = `<?xml version="1.0" encoding="UTF-16"?>
<Task version="1.4" xmlns="http://schemas.microsoft.com/windows/2004/02/mit/task">
  <Triggers><LogonTrigger><Enabled>true</Enabled></LogonTrigger></Triggers>
  <Settings>
    <DisallowStartIfOnBatteries>false</DisallowStartIfOnBatteries>
    <StopIfGoingOnBatteries>false</StopIfGoingOnBatteries>
    <ExecutionTimeLimit>PT0S</ExecutionTimeLimit>
    <RestartOnFailure><Interval>PT1M</Interval><Count>999</Count></RestartOnFailure>
  </Settings>
  <Actions><Exec><Command>${cmd.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')}</Command></Exec></Actions>
</Task>`;
    writeFileSync(xmlPath, '﻿' + xml, 'utf16le');
    try { execSync(`schtasks /Delete /TN ${TASK_NAME} /F`, { stdio: 'ignore' }); } catch {}

    try {
        execSync(`schtasks /Create /TN ${TASK_NAME} /XML "${xmlPath}"`);
        execSync(`schtasks /Run /TN ${TASK_NAME}`);
    } catch (e) {
        console.warn('');
        console.warn('⚠  Task Scheduler requires Administrator privileges for auto-start.');
        console.warn('   Profile and deployment mode are set — proxy needs manual start:');
        console.warn(`   Open Command Prompt and run: node "${scriptPath}"`);
        console.warn('');
        console.warn('   For auto-start, re-run this installer from an Administrator terminal.');
        console.warn('');
    }
    try { unlinkSync(xmlPath); } catch {}
}

export function uninstall() {
    try {
        execSync(`schtasks /End /TN ${TASK_NAME}`, { stdio: 'ignore' });
    } catch {}
    try {
        execSync(`schtasks /Delete /TN ${TASK_NAME} /F`);
        return true;
    } catch {
        return false;
    }
}

export function isInstalled() {
    try {
        execSync(`schtasks /Query /TN ${TASK_NAME}`, { stdio: 'ignore' });
        return true;
    } catch {
        return false;
    }
}
