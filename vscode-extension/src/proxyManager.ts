import * as vscode from 'vscode';
import { startProxy } from './proxy';

export class ProxyManager {
    private closeFn: (() => void) | null = null;
    private port: number;
    private outputChannel: vscode.OutputChannel;
    private context: vscode.ExtensionContext;

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

        this.outputChannel.appendLine(`[deepclaude-mixed] Starting proxy on 127.0.0.1:${this.port}...`);

        const result = await startProxy({
            port: this.port,
            deepseekKey,
            log: (msg: string) => this.outputChannel.appendLine(msg),
        });

        this.closeFn = result.close;
        this.port = result.port;
        this.outputChannel.appendLine(`[deepclaude-mixed] Proxy listening on 127.0.0.1:${this.port}`);
        return this.port;
    }

    async stop(): Promise<void> {
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
}
