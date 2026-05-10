import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { readFileSync, writeFileSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { setCliSandboxHosts, getCliSandboxHosts } from '../../src/config/cli-sandbox.mjs';
import { makeTmpHome } from '../helpers/tmp-home.mjs';

describe('CLI sandbox allowlist', () => {
    let tmp;
    beforeEach(() => { tmp = makeTmpHome(); });
    afterEach(() => tmp.cleanup());

    it('returns null when unset', () => {
        expect(getCliSandboxHosts({ home: tmp.home })).toBe(null);
    });

    it('writes hosts and reads back', () => {
        setCliSandboxHosts({ home: tmp.home, hosts: ['github.com', '*.x.com'] });
        expect(getCliSandboxHosts({ home: tmp.home })).toEqual(['github.com', '*.x.com']);
    });

    it('merges with existing', () => {
        setCliSandboxHosts({ home: tmp.home, hosts: ['a.com'] });
        setCliSandboxHosts({ home: tmp.home, hosts: ['b.com'] });
        expect(getCliSandboxHosts({ home: tmp.home }).sort()).toEqual(['a.com', 'b.com']);
    });

    it('replaces when merge=false', () => {
        setCliSandboxHosts({ home: tmp.home, hosts: ['a.com'] });
        setCliSandboxHosts({ home: tmp.home, hosts: ['b.com'], merge: false });
        expect(getCliSandboxHosts({ home: tmp.home })).toEqual(['b.com']);
    });

    it('preserves unrelated keys (hooks, plugins, etc)', () => {
        const p = join(tmp.home, '.claude', 'settings.json');
        mkdirSync(dirname(p), { recursive: true });
        writeFileSync(p, JSON.stringify({
            enabledPlugins: { foo: true },
            hooks: { UserPromptSubmit: [{ matcher: '' }] },
        }));
        setCliSandboxHosts({ home: tmp.home, hosts: ['x.com'] });
        const cfg = JSON.parse(readFileSync(p, 'utf8'));
        expect(cfg.enabledPlugins.foo).toBe(true);
        expect(cfg.hooks.UserPromptSubmit[0].matcher).toBe('');
        expect(cfg.sandbox.network.allowedHosts).toEqual(['x.com']);
    });

    it('dedupes on merge', () => {
        setCliSandboxHosts({ home: tmp.home, hosts: ['a.com', 'b.com'] });
        setCliSandboxHosts({ home: tmp.home, hosts: ['b.com', 'c.com'] });
        expect(getCliSandboxHosts({ home: tmp.home }).sort()).toEqual(['a.com', 'b.com', 'c.com']);
    });
});
