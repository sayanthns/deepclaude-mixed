import { describe, it, expect } from 'vitest';
import { startProxy, forwardRequest, pickRoute, stripForeignThinking } from '../../src/proxy/mixed-proxy.mjs';

describe('proxy modules', () => {
    it('startProxy is a function', () => {
        expect(typeof startProxy).toBe('function');
    });
    it('forwardRequest is a function', () => {
        expect(typeof forwardRequest).toBe('function');
    });
    it('pickRoute works with real proxy', () => {
        const r = pickRoute('claude-opus-4-6', { anthropicKey: 'sk-ant-real', deepseekKey: 'sk-ds-real' });
        expect(r.host).toBe('api.anthropic.com');
        expect(r.headerName).toBe('x-api-key');
        expect(r.headerValue).toBe('sk-ant-real');
    });
    it('strips thinking from proxied messages', () => {
        const body = { messages: [{ role: 'assistant', content: [{ type: 'thinking', thinking: 'x' }, { type: 'text', text: 'ok' }] }] };
        stripForeignThinking(body);
        expect(body.messages[0].content).toEqual([{ type: 'text', text: 'ok' }]);
    });
});
