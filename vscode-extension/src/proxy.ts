import * as http from 'http';
import * as https from 'https';

export interface ProxyOpts {
    port?: number;
    anthropicKey?: string;
    deepseekKey: string;
    log?: (msg: string) => void;
}

interface Route {
    host: string;
    port: number;
    pathPrefix: string;
    headerName: string;
    headerValue: string;
    remap: string | null;
    useHttp?: boolean;
}

export function pickRoute(model: string, opts: { anthropicKey?: string; deepseekKey: string }): Route {
    const m = (model || '').toLowerCase();
    if (m.includes('opus') && opts.anthropicKey) {
        return { host: 'api.anthropic.com', port: 443, pathPrefix: '', headerName: 'x-api-key', headerValue: opts.anthropicKey, remap: null };
    }
    if (m.includes('opus') || m.includes('sonnet')) {
        return { host: 'api.deepseek.com', port: 443, pathPrefix: '/anthropic', headerName: 'authorization', headerValue: `Bearer ${opts.deepseekKey}`, remap: 'deepseek-v4-pro' };
    }
    if (m.includes('haiku')) {
        return { host: 'api.deepseek.com', port: 443, pathPrefix: '/anthropic', headerName: 'authorization', headerValue: `Bearer ${opts.deepseekKey}`, remap: 'deepseek-v4-flash' };
    }
    // default
    return { host: 'api.deepseek.com', port: 443, pathPrefix: '/anthropic', headerName: 'authorization', headerValue: `Bearer ${opts.deepseekKey}`, remap: 'deepseek-v4-pro' };
}

export function stripForeignThinking(body: any): any {
    if (!body || !Array.isArray(body.messages)) return body;
    for (const m of body.messages) {
        if (m.role === 'assistant' && Array.isArray(m.content)) {
            m.content = m.content.filter((b: any) => b.type !== 'thinking' && b.type !== 'redacted_thinking');
        }
    }
    return body;
}

export function forwardRequest(
    clientReq: http.IncomingMessage,
    clientRes: http.ServerResponse,
    route: Route,
    body: string,
    log: (msg: string) => void = console.log
): void {
    const headers: Record<string, string> = {};
    for (const [k, v] of Object.entries(clientReq.headers)) {
        if (v !== undefined) headers[k] = Array.isArray(v) ? v[0] : v;
    }
    headers['host'] = route.host;
    headers['content-length'] = String(Buffer.byteLength(body));
    delete headers['authorization'];
    delete headers['x-api-key'];
    headers[route.headerName] = route.headerValue;
    if (route.headerName === 'x-api-key') {
        headers['anthropic-version'] = headers['anthropic-version'] || '2023-06-01';
    }

    const reqFn = route.useHttp ? http.request : https.request;
    const upstream = reqFn({
        hostname: route.host,
        port: route.port,
        path: route.pathPrefix + clientReq.url,
        method: clientReq.method,
        headers,
    }, (upRes) => {
        clientRes.writeHead(upRes.statusCode ?? 200, upRes.headers);
        upRes.pipe(clientRes);
    });

    upstream.on('error', (e: Error) => {
        log(`[proxy] upstream error: ${e.message}`);
        if (!clientRes.headersSent) {
            clientRes.writeHead(502, { 'content-type': 'application/json' });
            clientRes.end(JSON.stringify({ error: e.message }));
        }
    });

    upstream.write(body);
    upstream.end();
}

export function startProxy(opts: ProxyOpts): Promise<{ port: number; close: () => void }> {
    const { port = 3200, anthropicKey, deepseekKey } = opts;
    const log = opts.log || console.log;

    return new Promise((resolve, reject) => {
        const server = http.createServer((req, res) => {
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

            const chunks: Buffer[] = [];
            req.on('data', c => chunks.push(c));
            req.on('end', () => {
                let raw = Buffer.concat(chunks).toString();
                let parsed: any = {};
                try { parsed = JSON.parse(raw); } catch { /* ignore parse errors */ }

                const model: string = parsed.model || '';
                const route = pickRoute(model, { anthropicKey, deepseekKey });

                // Only strip thinking blocks when sending to Anthropic — DeepSeek
                // requires its own thinking blocks to be echoed back in multi-turn.
                if (route.host === 'api.anthropic.com') stripForeignThinking(parsed);

                if (route.remap) parsed.model = route.remap;
                raw = JSON.stringify(parsed);

                if (!route.headerValue) {
                    res.writeHead(500, { 'content-type': 'application/json' });
                    res.end(JSON.stringify({ error: `API key missing for ${route.host}` }));
                    return;
                }

                forwardRequest(req, res, route, raw, log);
            });
        });

        server.listen(port, '127.0.0.1', () => {
            const actualPort = (server.address() as any).port;
            log(`[deepclaude-mixed] listening on 127.0.0.1:${actualPort}`);
            resolve({ port: actualPort, close: () => server.close() });
        });

        server.on('error', (e: Error) => reject(e));
    });
}
