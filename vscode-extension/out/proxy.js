"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.pickRoute = pickRoute;
exports.stripForeignThinking = stripForeignThinking;
exports.forwardRequest = forwardRequest;
exports.startProxy = startProxy;
const http = __importStar(require("http"));
const https = __importStar(require("https"));
function pickRoute(model, opts) {
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
function stripForeignThinking(body) {
    if (!body || !Array.isArray(body.messages))
        return body;
    for (const m of body.messages) {
        if (m.role === 'assistant' && Array.isArray(m.content)) {
            m.content = m.content.filter((b) => b.type !== 'thinking' && b.type !== 'redacted_thinking');
        }
    }
    return body;
}
function forwardRequest(clientReq, clientRes, route, body, log = console.log) {
    const headers = {};
    for (const [k, v] of Object.entries(clientReq.headers)) {
        if (v !== undefined)
            headers[k] = Array.isArray(v) ? v[0] : v;
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
    upstream.on('error', (e) => {
        log(`[proxy] upstream error: ${e.message}`);
        if (!clientRes.headersSent) {
            clientRes.writeHead(502, { 'content-type': 'application/json' });
            clientRes.end(JSON.stringify({ error: e.message }));
        }
    });
    upstream.write(body);
    upstream.end();
}
function startProxy(opts) {
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
            const chunks = [];
            req.on('data', c => chunks.push(c));
            req.on('end', () => {
                let raw = Buffer.concat(chunks).toString();
                let parsed = {};
                try {
                    parsed = JSON.parse(raw);
                }
                catch { /* ignore parse errors */ }
                const model = parsed.model || '';
                const route = pickRoute(model, { anthropicKey, deepseekKey });
                // Only strip thinking blocks when sending to Anthropic — DeepSeek
                // requires its own thinking blocks to be echoed back in multi-turn.
                if (route.host === 'api.anthropic.com')
                    stripForeignThinking(parsed);
                if (route.remap)
                    parsed.model = route.remap;
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
            const actualPort = server.address().port;
            log(`[deepclaude-mixed] listening on 127.0.0.1:${actualPort}`);
            resolve({ port: actualPort, close: () => server.close() });
        });
        server.on('error', (e) => reject(e));
    });
}
//# sourceMappingURL=proxy.js.map