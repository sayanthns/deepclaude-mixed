import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';
import { setEgressAllowedHosts, getEgressAllowedHosts, DEFAULT_HOSTS } from '../../src/config/egress.mjs';
import { makeTmpHome } from '../helpers/tmp-home.mjs';

describe('cowork egress allowlist', () => {
    let tmp;
    beforeEach(() => { tmp = makeTmpHome(); });
    afterEach(() => tmp.cleanup());

    it('returns null when unset', () => {
        expect(getEgressAllowedHosts({ home: tmp.home, platform: 'darwin' })).toBe(null);
    });

    it('writes hosts and reads back', () => {
        setEgressAllowedHosts({ home: tmp.home, platform: 'darwin', hosts: ['github.com', '*.enfono.com'] });
        const got = getEgressAllowedHosts({ home: tmp.home, platform: 'darwin' });
        expect(got).toEqual(['github.com', '*.enfono.com']);
    });

    it('merges by default', () => {
        setEgressAllowedHosts({ home: tmp.home, platform: 'darwin', hosts: ['a.com'] });
        setEgressAllowedHosts({ home: tmp.home, platform: 'darwin', hosts: ['b.com'] });
        const got = getEgressAllowedHosts({ home: tmp.home, platform: 'darwin' });
        expect(got.sort()).toEqual(['a.com', 'b.com']);
    });

    it('replaces when merge=false', () => {
        setEgressAllowedHosts({ home: tmp.home, platform: 'darwin', hosts: ['a.com'] });
        setEgressAllowedHosts({ home: tmp.home, platform: 'darwin', hosts: ['b.com'], merge: false });
        expect(getEgressAllowedHosts({ home: tmp.home, platform: 'darwin' })).toEqual(['b.com']);
    });

    it('dedupes on merge', () => {
        setEgressAllowedHosts({ home: tmp.home, platform: 'darwin', hosts: ['a.com', 'b.com'] });
        setEgressAllowedHosts({ home: tmp.home, platform: 'darwin', hosts: ['b.com', 'c.com'] });
        const got = getEgressAllowedHosts({ home: tmp.home, platform: 'darwin' });
        expect(got.sort()).toEqual(['a.com', 'b.com', 'c.com']);
    });

    it('preserves other preferences', () => {
        const cfgPath = join(tmp.home, 'Library', 'Application Support', 'Claude-3p', 'claude_desktop_config.json');
        require('fs').mkdirSync(require('path').dirname(cfgPath), { recursive: true });
        require('fs').writeFileSync(cfgPath, JSON.stringify({ preferences: { foo: 'bar' }, deploymentMode: '3p' }));
        setEgressAllowedHosts({ home: tmp.home, platform: 'darwin', hosts: ['x.com'] });
        const cfg = JSON.parse(readFileSync(cfgPath, 'utf8'));
        expect(cfg.preferences.foo).toBe('bar');
        expect(cfg.deploymentMode).toBe('3p');
        expect(cfg.preferences.coworkEgressAllowedHosts).toEqual(['x.com']);
    });

    it('DEFAULT_HOSTS contains essentials', () => {
        expect(DEFAULT_HOSTS).toContain('api.anthropic.com');
        expect(DEFAULT_HOSTS).toContain('api.deepseek.com');
        expect(DEFAULT_HOSTS).toContain('github.com');
    });
});
