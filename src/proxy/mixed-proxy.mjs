import { createServer } from 'http';
import { request as httpsRequest } from 'https';
import { request as httpRequest } from 'http';

export function pickRoute(model, { anthropicKey, deepseekKey }) {
    const m = (model || '').toLowerCase();
    if (m.includes('opus') && anthropicKey) {
        return { host: 'api.anthropic.com', port: 443, pathPrefix: '', headerName: 'x-api-key', headerValue: anthropicKey, remap: null };
    }
    if (m.includes('opus') || m.includes('sonnet')) {
        return { host: 'api.deepseek.com', port: 443, pathPrefix: '/anthropic', headerName: 'authorization', headerValue: `Bearer ${deepseekKey}`, remap: 'deepseek-v4-pro' };
    }
    if (m.includes('haiku')) {
        return { host: 'api.deepseek.com', port: 443, pathPrefix: '/anthropic', headerName: 'authorization', headerValue: `Bearer ${deepseekKey}`, remap: 'deepseek-v4-flash' };
    }
    // default
    return { host: 'api.deepseek.com', port: 443, pathPrefix: '/anthropic', headerName: 'authorization', headerValue: `Bearer ${deepseekKey}`, remap: 'deepseek-v4-pro' };
}

export function stripForeignThinking(body) {
    if (!body || !Array.isArray(body.messages)) return body;
    for (const m of body.messages) {
        if (m.role === 'assistant' && Array.isArray(m.content)) {
            m.content = m.content.filter(b => b.type !== 'thinking' && b.type !== 'redacted_thinking');
        }
    }
    return body;
}

export function forwardRequest(clientReq, clientRes, route, body, log = console.log) {
    const headers = { ...clientReq.headers };
    headers['host'] = route.host;
    headers['content-length'] = Buffer.byteLength(body);
    delete headers['authorization'];
    delete headers['x-api-key'];
    headers[route.headerName] = route.headerValue;
    if (route.headerName === 'x-api-key') {
        headers['anthropic-version'] = headers['anthropic-version'] || '2023-06-01';
    }

    const reqFn = route.useHttp ? httpRequest : httpsRequest;
    const upstream = reqFn({
        hostname: route.host,
        port: route.port,
        path: route.pathPrefix + clientReq.url,
        method: clientReq.method,
        headers,
    }, (upRes) => {
        clientRes.writeHead(upRes.statusCode, upRes.headers);
        upRes.pipe(clientRes);
    });

    upstream.on('error', (e) => {
        log('[proxy] upstream error:', e.message);
        if (!clientRes.headersSent) {
            clientRes.writeHead(502, { 'content-type': 'application/json' });
            clientRes.end(JSON.stringify({ error: e.message }));
        }
    });

    upstream.write(body);
    upstream.end();
}

export function startProxy({ port = 3200, anthropicKey, deepseekKey, routeOverride } = {}) {
    return new Promise((resolve) => {
        const server = createServer((req, res) => {
            if (req.url === '/_proxy/status') {
                res.writeHead(200, { 'content-type': 'application/json' });
                res.end(JSON.stringify({
                    mode: 'mixed',
                    anthropicKey: anthropicKey ? 'set' : 'MISSING',
                    deepseekKey: deepseekKey ? 'set' : 'MISSING',
                    routes: { opus: anthropicKey ? 'anthropic' : 'deepseek-v4-pro', sonnet: 'deepseek-v4-pro', haiku: 'deepseek-v4-flash' },
                }));
                return;
            }

            const chunks = [];
            req.on('data', c => chunks.push(c));
            req.on('end', () => {
                let body = Buffer.concat(chunks).toString();
                let parsed = {};
                try { parsed = JSON.parse(body); } catch {}

                const route = routeOverride
                    ? routeOverride(parsed.model)
                    : pickRoute(parsed.model, { anthropicKey, deepseekKey });

                stripForeignThinking(parsed);

                if (route.remap) parsed.model = route.remap;
                body = JSON.stringify(parsed);

                if (!route.headerValue) {
                    res.writeHead(500, { 'content-type': 'application/json' });
                    res.end(JSON.stringify({ error: `API key missing for ${route.host}` }));
                    return;
                }

                forwardRequest(req, res, route, body);
            });
        });

        server.listen(port, '127.0.0.1', () => {
            const actualPort = server.address().port;
            console.log(`[mixed-proxy] listening on 127.0.0.1:${actualPort}`);
            resolve({ port: actualPort, close: () => server.close() });
        });
    });
}

// CLI invocation
if (import.meta.url === `file://${process.argv[1]}`) {
    startProxy({
        port: parseInt(process.env.PROXY_PORT || '3200', 10),
        anthropicKey: process.env.ANTHROPIC_API_KEY || '',
        deepseekKey: process.env.DEEPSEEK_API_KEY || '',
    });
}
