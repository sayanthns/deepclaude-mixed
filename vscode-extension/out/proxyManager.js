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
exports.ProxyManager = void 0;
const vscode = __importStar(require("vscode"));
const proxy_1 = require("./proxy");
const MAX_PORT_TRIES = 10; // try 3200-3209
class ProxyManager {
    closeFn = null;
    port;
    outputChannel;
    context;
    reusingExisting = false;
    constructor(context, outputChannel) {
        this.context = context;
        this.outputChannel = outputChannel;
        this.port = vscode.workspace.getConfiguration('deepclaude-mixed').get('proxyPort', 3200);
    }
    async start() {
        const deepseekKey = await this.context.secrets.get('deepclaude-mixed.deepseekKey');
        if (!deepseekKey) {
            throw new Error('DeepSeek API key not set. Run "DeepClaude Mixed: Set DeepSeek API Key" from the command palette.');
        }
        const basePort = this.port;
        for (let offset = 0; offset < MAX_PORT_TRIES; offset++) {
            const tryPort = basePort + offset;
            if (offset > 0) {
                this.outputChannel.appendLine(`[deepclaude-mixed] Port ${basePort} unavailable, trying ${tryPort}...`);
            }
            // Check if an existing healthy proxy is on this port
            const existingHealthy = await this.checkExistingProxy(tryPort);
            if (existingHealthy) {
                this.port = tryPort;
                this.reusingExisting = true;
                this.outputChannel.appendLine(`[deepclaude-mixed] Found healthy proxy on 127.0.0.1:${tryPort} — reusing`);
                return this.port;
            }
            try {
                this.outputChannel.appendLine(`[deepclaude-mixed] Starting proxy on 127.0.0.1:${tryPort}...`);
                const result = await (0, proxy_1.startProxy)({
                    port: tryPort,
                    deepseekKey,
                    log: (msg) => this.outputChannel.appendLine(msg),
                });
                this.closeFn = result.close;
                this.port = result.port;
                this.reusingExisting = false;
                this.outputChannel.appendLine(`[deepclaude-mixed] Proxy listening on 127.0.0.1:${this.port}`);
                return this.port;
            }
            catch (e) {
                if (e.code === 'EADDRINUSE') {
                    // Port in use but not a healthy proxy — continue to next port
                    this.outputChannel.appendLine(`[deepclaude-mixed] Port ${tryPort} in use by unknown process, skipping...`);
                    continue;
                }
                throw e; // other errors should surface
            }
        }
        throw new Error(`No available port after trying ${basePort}-${basePort + MAX_PORT_TRIES - 1}.`);
    }
    async stop() {
        if (this.reusingExisting) {
            this.outputChannel.appendLine('[deepclaude-mixed] Shared proxy — not stopping');
            this.closeFn = null;
            return;
        }
        if (this.closeFn) {
            this.outputChannel.appendLine('[deepclaude-mixed] Stopping proxy...');
            this.closeFn();
            this.closeFn = null;
        }
    }
    async isRunning() {
        try {
            const res = await fetch(`http://127.0.0.1:${this.port}/_proxy/status`);
            return res.ok;
        }
        catch {
            return false;
        }
    }
    async getStatus() {
        try {
            const res = await fetch(`http://127.0.0.1:${this.port}/_proxy/status`);
            return (await res.json());
        }
        catch {
            return { error: 'Proxy not reachable' };
        }
    }
    getPort() {
        return this.port;
    }
    setPort(port) {
        this.port = port;
    }
    isReusingExisting() {
        return this.reusingExisting;
    }
    /**
     * Check if a healthy deepclaude-mixed proxy is already running on a port.
     * Returns true if /_proxy/status responds with a valid status JSON
     * containing the expected fields.
     */
    async checkExistingProxy(port) {
        try {
            const res = await fetch(`http://127.0.0.1:${port}/_proxy/status`, { signal: AbortSignal.timeout(500) });
            if (!res.ok)
                return false;
            const data = await res.json();
            // Must look like a deepclaude-mixed proxy response
            return typeof data?.mode === 'string' && typeof data?.deepseekKey === 'string';
        }
        catch {
            return false;
        }
    }
}
exports.ProxyManager = ProxyManager;
//# sourceMappingURL=proxyManager.js.map