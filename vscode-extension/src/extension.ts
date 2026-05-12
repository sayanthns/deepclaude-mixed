import * as vscode from 'vscode';
import { ProxyManager } from './proxyManager';
import { StatusBarManager } from './statusBar';
import { injectEnvVars, clearEnvVars } from './env';

let proxyManager: ProxyManager;
let statusBar: StatusBarManager;
let healthPollInterval: NodeJS.Timeout | undefined;

export async function activate(context: vscode.ExtensionContext): Promise<void> {
    // Step 1: Inject env vars IMMEDIATELY. Must happen before any other
    // extension spawns a child process (the Claude Code extension inherits
    // these when it spawns the Claude Code CLI).
    const port = vscode.workspace.getConfiguration('deepclaude-mixed').get<number>('proxyPort', 3200);
    injectEnvVars(port);

    // Step 2: Create output channel for proxy logs
    const outputChannel = vscode.window.createOutputChannel('DeepClaude Mixed', { log: true });
    context.subscriptions.push(outputChannel);

    // Step 3: Initialize managers
    proxyManager = new ProxyManager(context, outputChannel);
    statusBar = new StatusBarManager(context);

    // Step 4: Register commands
    context.subscriptions.push(
        vscode.commands.registerCommand('deepclaude-mixed.setApiKey', () => handleSetApiKey(context)),
        vscode.commands.registerCommand('deepclaude-mixed.restartProxy', () => handleRestart()),
        vscode.commands.registerCommand('deepclaude-mixed.showStatus', () => handleShowStatus(outputChannel)),
    );

    // Step 5: Listen for port config changes
    context.subscriptions.push(
        vscode.workspace.onDidChangeConfiguration(e => {
            if (e.affectsConfiguration('deepclaude-mixed.proxyPort')) {
                const newPort = vscode.workspace.getConfiguration('deepclaude-mixed').get<number>('proxyPort', 3200);
                proxyManager.setPort(newPort);
                injectEnvVars(newPort);
                handleRestart();
            }
            if (e.affectsConfiguration('deepclaude-mixed.healthPollIntervalSec')) {
                startHealthPolling(context);
            }
        })
    );

    // Step 6: Auto-start proxy
    const autoStart = vscode.workspace.getConfiguration('deepclaude-mixed').get<boolean>('autoStart', true);
    if (autoStart) {
        try {
            const actualPort = await proxyManager.start();
            // Update env vars to actual port (may differ if auto-incremented from 3200→3201)
            injectEnvVars(actualPort);
            statusBar.setHealthy(actualPort);

            // If port changed, tell user
            if (actualPort !== port) {
                const msg = proxyManager.isReusingExisting()
                    ? `DeepClaude: Using existing proxy on port ${actualPort}`
                    : `DeepClaude: Port ${port} in use — proxy on port ${actualPort}`;
                vscode.window.showInformationMessage(msg);
            }
        } catch (e: any) {
            if (e.message?.includes('API key')) {
                const action = await vscode.window.showWarningMessage(
                    'DeepClaude Mixed: DeepSeek API key not set.',
                    'Set API Key'
                );
                if (action === 'Set API Key') {
                    await handleSetApiKey(context);
                    try {
                        const actualPort = await proxyManager.start();
                        injectEnvVars(actualPort);
                        statusBar.setHealthy(actualPort);
                    } catch (e2: any) { statusBar.setError(e2.message); }
                }
            } else {
                statusBar.setError(e.message);
            }
        }
    } else {
        statusBar.setStopped();
    }

    // Step 7: Start health polling
    startHealthPolling(context);
}

export async function deactivate(): Promise<void> {
    if (healthPollInterval) clearInterval(healthPollInterval);
    await proxyManager?.stop();
    clearEnvVars();
}

async function handleSetApiKey(context: vscode.ExtensionContext): Promise<void> {
    const key = await vscode.window.showInputBox({
        prompt: 'Enter your DeepSeek API key (from platform.deepseek.com/api_keys)',
        placeHolder: 'sk-...',
        password: true,
        ignoreFocusOut: true,
    });
    if (!key) return;

    if (!key.startsWith('sk-')) {
        await vscode.window.showErrorMessage('Invalid API key format. DeepSeek keys start with "sk-".');
        return;
    }

    await context.secrets.store('deepclaude-mixed.deepseekKey', key);
    vscode.window.showInformationMessage('DeepSeek API key saved securely.');

    if (proxyManager) {
        await handleRestart();
    }
}

async function handleRestart(): Promise<void> {
    try {
        statusBar.setStarting();
        await proxyManager?.stop();
        await proxyManager?.start();
        statusBar.setHealthy(proxyManager.getPort());
        vscode.window.showInformationMessage(`DeepClaude proxy restarted on port ${proxyManager.getPort()}`);
    } catch (e: any) {
        statusBar.setError(e.message);
        vscode.window.showErrorMessage(`Failed to start proxy: ${e.message}`);
    }
}

async function handleShowStatus(outputChannel: vscode.OutputChannel): Promise<void> {
    outputChannel.show();
    const healthy = await proxyManager?.isRunning().catch(() => false);
    if (healthy) {
        const status = await proxyManager?.getStatus();
        outputChannel.appendLine(JSON.stringify(status, null, 2));
        vscode.window.showInformationMessage('DeepClaude Mixed proxy is running.');
    } else {
        outputChannel.appendLine('[deepclaude-mixed] Proxy is not running.');
        vscode.window.showInformationMessage('DeepClaude Mixed proxy is not running.');
    }
}

function startHealthPolling(context: vscode.ExtensionContext): void {
    if (healthPollInterval) clearInterval(healthPollInterval);

    const config = vscode.workspace.getConfiguration('deepclaude-mixed');
    const intervalSec = Math.max(10, Math.min(300, config.get<number>('healthPollIntervalSec', 30)));

    healthPollInterval = setInterval(async () => {
        const healthy = await proxyManager?.isRunning().catch(() => false);
        if (healthy) {
            statusBar?.setHealthy(proxyManager.getPort());
        } else {
            statusBar?.setError('Proxy not reachable');
        }
    }, intervalSec * 1000);

    context.subscriptions.push({ dispose: () => clearInterval(healthPollInterval) });
}
