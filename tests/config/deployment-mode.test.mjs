import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { getDeploymentMode, setDeploymentMode } from '../../src/config/deployment-mode.mjs';
import { makeTmpHome } from '../helpers/tmp-home.mjs';
import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

describe('deployment mode', () => {
    let tmp;
    beforeEach(() => { tmp = makeTmpHome(); });
    afterEach(() => tmp.cleanup());

    it('returns null when no config exists', () => {
        expect(getDeploymentMode({ home: tmp.home, platform: 'darwin' })).toBe(null);
    });
    it('writes and reads back 3p', () => {
        setDeploymentMode({ home: tmp.home, platform: 'darwin', mode: '3p' });
        expect(getDeploymentMode({ home: tmp.home, platform: 'darwin' })).toBe('3p');
    });
    it('preserves other keys when toggling', () => {
        setDeploymentMode({ home: tmp.home, platform: 'darwin', mode: '3p' });
        const path = join(tmp.home, 'Library', 'Application Support', 'Claude-3p', 'claude_desktop_config.json');
        const f = JSON.parse(readFileSync(path, 'utf8'));
        f.preferences = { foo: 'bar' };
        writeFileSync(path, JSON.stringify(f));
        setDeploymentMode({ home: tmp.home, platform: 'darwin', mode: '1p' });
        expect(JSON.parse(readFileSync(path, 'utf8')).preferences.foo).toBe('bar');
    });
});
