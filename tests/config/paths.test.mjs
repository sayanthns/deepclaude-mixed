import { describe, it, expect } from 'vitest';
import { getClaudeUserDataDir, getLaunchAgentDir, getSystemdUserDir, getAutoStartLabel } from '../../src/config/paths.mjs';

describe('paths', () => {
    it('claudeUserDataDir on darwin', () => {
        expect(getClaudeUserDataDir({ platform: 'darwin', home: '/Users/x' }))
            .toBe('/Users/x/Library/Application Support/Claude-3p');
    });
    it('claudeUserDataDir on win32', () => {
        expect(getClaudeUserDataDir({ platform: 'win32', appdata: 'C:\\Users\\x\\AppData\\Roaming' }))
            .toBe('C:\\Users\\x\\AppData\\Roaming\\Claude-3p');
    });
    it('claudeUserDataDir on linux', () => {
        expect(getClaudeUserDataDir({ platform: 'linux', home: '/home/x' }))
            .toBe('/home/x/.config/Claude-3p');
    });
    it('autostart label is stable', () => {
        expect(getAutoStartLabel()).toBe('com.deepclaude.proxy');
    });
});
