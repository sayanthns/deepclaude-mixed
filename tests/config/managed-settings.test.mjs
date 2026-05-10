import { describe, it, expect } from 'vitest';
import { getManagedSettingsPath } from '../../src/config/managed-settings.mjs';

describe('managed settings path', () => {
    it('macOS path', () => {
        expect(getManagedSettingsPath({ platform: 'darwin' }))
            .toBe('/Library/Application Support/ClaudeCode/managed-settings.json');
    });
    it('linux path', () => {
        expect(getManagedSettingsPath({ platform: 'linux' }))
            .toBe('/etc/claude-code/managed-settings.json');
    });
    it('windows path', () => {
        expect(getManagedSettingsPath({ platform: 'win32' }))
            .toBe('C:\\Program Files\\ClaudeCode\\managed-settings.json');
    });
});
