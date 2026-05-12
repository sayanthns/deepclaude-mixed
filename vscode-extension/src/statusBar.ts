import * as vscode from 'vscode';

export class StatusBarManager {
    private item: vscode.StatusBarItem;

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

    setHealthy(port: number): void {
        this.item.text = `$(check) DeepClaude :${port}`;
        this.item.backgroundColor = undefined;
        this.item.tooltip = `DeepClaude Mixed proxy — running on 127.0.0.1:${port}`;
    }

    setError(msg: string): void {
        this.item.text = `$(error) DeepClaude`;
        this.item.tooltip = `Proxy error: ${msg}`;
    }

    setStarting(): void {
        this.item.text = `$(sync~spin) DeepClaude`;
        this.item.tooltip = 'DeepClaude Mixed proxy — starting...';
    }

    setStopped(): void {
        this.item.text = `$(circle-slash) DeepClaude`;
        this.item.tooltip = 'DeepClaude Mixed proxy — stopped (auto-start disabled)';
    }
}
