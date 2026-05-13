import * as vscode from 'vscode';

export type StatusMode = '1p' | '3p';

export class StatusBarManager {
    private item: vscode.StatusBarItem;
    private currentMode: StatusMode = '3p';

    constructor(context: vscode.ExtensionContext) {
        this.item = vscode.window.createStatusBarItem(
            vscode.StatusBarAlignment.Right,
            100
        );
        this.item.command = 'deepclaude-mixed.showStatus';
        this.item.tooltip = 'DeepClaude Mixed proxy status';
        this.setStopped();
        this.item.show();
        context.subscriptions.push(this.item);
    }

    setMode(mode: StatusMode): void {
        this.currentMode = mode;
    }

    getMode(): StatusMode {
        return this.currentMode;
    }

    setHealthy(port: number): void {
        const modeLabel = this.currentMode === '3p' ? '3p' : '1p';
        this.item.text = `$(check) DeepClaude :${port} ${modeLabel}`;
        this.item.backgroundColor = undefined;
        this.item.tooltip = `DeepClaude Mixed — ${this.currentMode === '3p' ? 'DeepSeek proxy' : 'Anthropic direct'} on 127.0.0.1:${port}\nClick to show status`;
        this.item.command = 'deepclaude-mixed.showStatus';
    }

    setHealthy1p(): void {
        this.setMode('1p');
        this.item.text = `$(circle-slash) DeepClaude 1p`;
        this.item.backgroundColor = undefined;
        this.item.tooltip = 'DeepClaude Mixed — Anthropic direct (proxy bypassed)\nClick to show status';
        this.item.command = 'deepclaude-mixed.showStatus';
    }

    setError(msg: string): void {
        this.item.text = `$(error) DeepClaude`;
        this.item.tooltip = `Proxy error: ${msg}`;
        this.item.command = 'deepclaude-mixed.showStatus';
    }

    setStarting(): void {
        this.item.text = `$(sync~spin) DeepClaude`;
        this.item.tooltip = 'DeepClaude Mixed proxy — starting...';
        this.item.command = 'deepclaude-mixed.showStatus';
    }

    setStopped(): void {
        this.item.text = `$(circle-slash) DeepClaude`;
        this.item.tooltip = 'DeepClaude Mixed proxy — stopped (auto-start disabled)';
        this.item.command = 'deepclaude-mixed.showStatus';
    }
}
