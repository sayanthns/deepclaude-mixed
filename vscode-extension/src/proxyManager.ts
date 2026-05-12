import * as vscode from 'vscode';
import { startProxy } from './proxy';

const MAX_PORT_TRIES = 10; // try 3200-3209

export class ProxyManager {
    private closeFn: (() => void) | null = null;
    private port: number;
    private outputChannel: vscode.OutputChannel;
    private context: vscode.ExtensionContext;
    private reusingExisting: boolean = false;

    constructor(context: vscode.ExtensionContext, outputChannel: vscode.OutputChannel) {
        this.context = context;
        this.outputChannel = outputChannel;
        this.port = vscode.workspace.getConfiguration('deepclaude-mixed').get<number>('proxyPort', 3200);
    }

    async start(): Promise<number> {
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
                const result = await startProxy({
                    port: tryPort,
                    deepseekKey,
                    log: (msg: string) => this.outputChannel.appendLine(msg),
                });

                this.closeFn = result.close;
                this.port = result.port;
                this.reusingExisting = false;
                this.outputChannel.appendLine(`[deepclaude-mixed] Proxy listening on 127.0.0.1:${this.port}`);
                return this.port;
            } catch (e: any) {
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

    async stop(): Promise<void> {
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

    async isRunning(): Promise<boolean> {
        try {
            const res = await fetch(`http://127.0.0.1:${this.port}/_proxy/status`);
            return res.ok;
        } catch {
            return false;
        }
    }

    async getStatus(): Promise<Record<string, unknown>> {
        try {
            const res = await fetch(`http://127.0.0.1:${this.port}/_proxy/status`);
            return (await res.json()) as Record<string, unknown>;
        } catch {
            return { error: 'Proxy not reachable' };
        }
    }

    getPort(): number {
        return this.port;
    }

    setPort(port: number): void {
        this.port = port;
    }

    isReusingExisting(): boolean {
        return this.reusingExisting;
    }

    /**
     * Check if a healthy deepclaude-mixed proxy is already running on a port.
     * Returns true if /_proxy/status responds with a valid status JSON
     * containing the expected fields.
     */
    private async checkExistingProxy(port: number): Promise<boolean> {
        try {
            const res = await fetch(`http://127.0.0.1:${port}/_proxy/status`, { signal: AbortSignal.timeout(500) });
            if (!res.ok) return false;
            const data = await res.json() as Record<string, unknown>;
            // Must look like a deepclaude-mixed proxy response
            return typeof data?.mode === 'string' && typeof data?.deepseekKey === 'string';
        } catch {
            return false;
        }
    }
}
