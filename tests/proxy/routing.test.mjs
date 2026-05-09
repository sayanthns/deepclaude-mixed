import { describe, it, expect } from 'vitest';
import { pickRoute } from '../../src/proxy/mixed-proxy.mjs';

describe('pickRoute', () => {
    it('opus → anthropic', () => {
        const r = pickRoute('claude-opus-4-6', { anthropicKey: 'a', deepseekKey: 'd' });
        expect(r.host).toBe('api.anthropic.com');
        expect(r.headerName).toBe('x-api-key');
        expect(r.remap).toBeNull();
    });
    it('sonnet → deepseek pro', () => {
        const r = pickRoute('claude-sonnet-4-6', { anthropicKey: 'a', deepseekKey: 'd' });
        expect(r.host).toBe('api.deepseek.com');
        expect(r.pathPrefix).toBe('/anthropic');
        expect(r.headerName).toBe('authorization');
        expect(r.remap).toBe('deepseek-v4-pro');
    });
    it('haiku → deepseek flash', () => {
        const r = pickRoute('claude-haiku-4-5-20251001', { anthropicKey: 'a', deepseekKey: 'd' });
        expect(r.remap).toBe('deepseek-v4-flash');
        expect(r.host).toBe('api.deepseek.com');
    });
    it('unknown → default deepseek pro', () => {
        const r = pickRoute('mystery-model', { anthropicKey: 'a', deepseekKey: 'd' });
        expect(r.remap).toBe('deepseek-v4-pro');
    });
});
