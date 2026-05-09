import { describe, it, expect } from 'vitest';
import { stripForeignThinking } from '../../src/proxy/mixed-proxy.mjs';

describe('stripForeignThinking', () => {
    it('removes thinking blocks from assistant turns', () => {
        const body = {
            messages: [
                { role: 'user', content: 'hi' },
                { role: 'assistant', content: [
                    { type: 'thinking', thinking: 'x', signature: 'sig' },
                    { type: 'text', text: 'hello' },
                ]},
                { role: 'user', content: 'bye' },
            ],
        };
        const out = stripForeignThinking(body);
        expect(out.messages[1].content).toEqual([{ type: 'text', text: 'hello' }]);
        expect(out.messages[0]).toEqual({ role: 'user', content: 'hi' });
    });
    it('removes redacted_thinking too', () => {
        const body = { messages: [{ role: 'assistant', content: [
            { type: 'redacted_thinking', data: 'xx' },
            { type: 'text', text: 'ok' },
        ]}]};
        expect(stripForeignThinking(body).messages[0].content).toEqual([{ type: 'text', text: 'ok' }]);
    });
    it('passes through string content unchanged', () => {
        const body = { messages: [{ role: 'assistant', content: 'plain string' }]};
        expect(stripForeignThinking(body).messages[0].content).toBe('plain string');
    });
    it('handles missing messages array', () => {
        expect(stripForeignThinking({})).toEqual({});
    });
});
