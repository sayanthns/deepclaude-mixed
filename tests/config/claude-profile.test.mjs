import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
import { writeProfile, readProfile, listProfiles } from '../../src/config/claude-profile.mjs';
import { makeTmpHome } from '../helpers/tmp-home.mjs';

describe('claude profile', () => {
    let tmp;
    beforeEach(() => { tmp = makeTmpHome(); });
    afterEach(() => tmp.cleanup());

    it('writes profile + meta with applied id', () => {
        const id = writeProfile({
            home: tmp.home,
            platform: 'darwin',
            name: 'Deepseek',
            gatewayBaseUrl: 'http://127.0.0.1:3200',
            gatewayApiKey: 'unused',
            models: [
                { name: 'claude-opus-4-6', supports1m: true },
                { name: 'claude-sonnet-4-6', supports1m: true },
                { name: 'claude-haiku-4-5-20251001', supports1m: false },
            ],
        });
        const dir = join(tmp.home, 'Library', 'Application Support', 'Claude-3p', 'configLibrary');
        expect(existsSync(join(dir, `${id}.json`))).toBe(true);
        const meta = JSON.parse(readFileSync(join(dir, '_meta.json'), 'utf8'));
        expect(meta.appliedId).toBe(id);
        expect(meta.entries.find(e => e.id === id).name).toBe('Deepseek');
    });

    it('round-trip read', () => {
        const id = writeProfile({ home: tmp.home, platform: 'darwin', name: 'X', gatewayBaseUrl: 'http://x', gatewayApiKey: 'k', models: [] });
        const p = readProfile({ home: tmp.home, platform: 'darwin', id });
        expect(p.inferenceProvider).toBe('gateway');
        expect(p.inferenceGatewayBaseUrl).toBe('http://x');
    });

    it('listProfiles returns metadata', () => {
        writeProfile({ home: tmp.home, platform: 'darwin', name: 'A', gatewayBaseUrl: 'http://a', gatewayApiKey: 'k', models: [] });
        writeProfile({ home: tmp.home, platform: 'darwin', name: 'B', gatewayBaseUrl: 'http://b', gatewayApiKey: 'k', models: [] });
        const list = listProfiles({ home: tmp.home, platform: 'darwin' });
        expect(list.length).toBe(2);
        expect(list.map(p => p.name).sort()).toEqual(['A', 'B']);
    });
});
