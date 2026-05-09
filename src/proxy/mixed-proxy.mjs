export function pickRoute(model, { anthropicKey, deepseekKey }) {
    const m = (model || '').toLowerCase();
    if (m.includes('opus')) {
        return { host: 'api.anthropic.com', port: 443, pathPrefix: '', headerName: 'x-api-key', headerValue: anthropicKey, remap: null };
    }
    if (m.includes('sonnet')) {
        return { host: 'api.deepseek.com', port: 443, pathPrefix: '/anthropic', headerName: 'authorization', headerValue: `Bearer ${deepseekKey}`, remap: 'deepseek-v4-pro' };
    }
    if (m.includes('haiku')) {
        return { host: 'api.deepseek.com', port: 443, pathPrefix: '/anthropic', headerName: 'authorization', headerValue: `Bearer ${deepseekKey}`, remap: 'deepseek-v4-flash' };
    }
    // default to cheap deepseek pro
    return { host: 'api.deepseek.com', port: 443, pathPrefix: '/anthropic', headerName: 'authorization', headerValue: `Bearer ${deepseekKey}`, remap: 'deepseek-v4-pro' };
}
