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
exports.activate = activate;
exports.deactivate = deactivate;
const vscode = __importStar(require("vscode"));
const proxyManager_1 = require("./proxyManager");
const statusBar_1 = require("./statusBar");
const env_1 = require("./env");
let proxyManager;
let statusBar;
let healthPollInterval;
async function activate(context) {
    // Step 1: Inject env vars IMMEDIATELY. Must happen before any other
    // extension spawns a child process (the Claude Code extension inherits
    // these when it spawns the Claude Code CLI).
    const port = vscode.workspace.getConfiguration('deepclaude-mixed').get('proxyPort', 3200);
    (0, env_1.injectEnvVars)(port);
    // Step 2: Create output channel for proxy logs
    const outputChannel = vscode.window.createOutputChannel('DeepClaude Mixed', { log: true });
    context.subscriptions.push(outputChannel);
    // Step 3: Initialize managers
    proxyManager = new proxyManager_1.ProxyManager(context, outputChannel);
    statusBar = new statusBar_1.StatusBarManager(context);
    // Step 4: Register commands
    context.subscriptions.push(vscode.commands.registerCommand('deepclaude-mixed.setApiKey', () => handleSetApiKey(context)), vscode.commands.registerCommand('deepclaude-mixed.restartProxy', () => handleRestart()), vscode.commands.registerCommand('deepclaude-mixed.showStatus', () => handleShowStatus(outputChannel)));
    // Step 5: Listen for port config changes
    context.subscriptions.push(vscode.workspace.onDidChangeConfiguration(e => {
        if (e.affectsConfiguration('deepclaude-mixed.proxyPort')) {
            const newPort = vscode.workspace.getConfiguration('deepclaude-mixed').get('proxyPort', 3200);
            proxyManager.setPort(newPort);
            (0, env_1.injectEnvVars)(newPort);
            handleRestart();
        }
        if (e.affectsConfiguration('deepclaude-mixed.healthPollIntervalSec')) {
            startHealthPolling(context);
        }
    }));
    // Step 6: Auto-start proxy
    const autoStart = vscode.workspace.getConfiguration('deepclaude-mixed').get('autoStart', true);
    if (autoStart) {
        try {
            const actualPort = await proxyManager.start();
            // Update env vars to actual port (may differ if auto-incremented from 3200→3201)
            (0, env_1.injectEnvVars)(actualPort);
            statusBar.setHealthy(actualPort);
            // If port changed, tell user
            if (actualPort !== port) {
                const msg = proxyManager.isReusingExisting()
                    ? `DeepClaude: Using existing proxy on port ${actualPort}`
                    : `DeepClaude: Port ${port} in use — proxy on port ${actualPort}`;
                vscode.window.showInformationMessage(msg);
            }
        }
        catch (e) {
            if (e.message?.includes('API key')) {
                const action = await vscode.window.showWarningMessage('DeepClaude Mixed: DeepSeek API key not set.', 'Set API Key');
                if (action === 'Set API Key') {
                    await handleSetApiKey(context);
                    try {
                        const actualPort = await proxyManager.start();
                        (0, env_1.injectEnvVars)(actualPort);
                        statusBar.setHealthy(actualPort);
                    }
                    catch (e2) {
                        statusBar.setError(e2.message);
                    }
                }
            }
            else {
                statusBar.setError(e.message);
            }
        }
    }
    else {
        statusBar.setStopped();
    }
    // Step 7: Start health polling
    startHealthPolling(context);
}
async function deactivate() {
    if (healthPollInterval)
        clearInterval(healthPollInterval);
    await proxyManager?.stop();
    (0, env_1.clearEnvVars)();
}
async function handleSetApiKey(context) {
    const key = await vscode.window.showInputBox({
        prompt: 'Enter your DeepSeek API key (from platform.deepseek.com/api_keys)',
        placeHolder: 'sk-...',
        password: true,
        ignoreFocusOut: true,
    });
    if (!key)
        return;
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
async function handleRestart() {
    try {
        statusBar.setStarting();
        await proxyManager?.stop();
        await proxyManager?.start();
        statusBar.setHealthy(proxyManager.getPort());
        vscode.window.showInformationMessage(`DeepClaude proxy restarted on port ${proxyManager.getPort()}`);
    }
    catch (e) {
        statusBar.setError(e.message);
        vscode.window.showErrorMessage(`Failed to start proxy: ${e.message}`);
    }
}
async function handleShowStatus(outputChannel) {
    outputChannel.show();
    const healthy = await proxyManager?.isRunning().catch(() => false);
    if (healthy) {
        const status = await proxyManager?.getStatus();
        outputChannel.appendLine(JSON.stringify(status, null, 2));
        vscode.window.showInformationMessage('DeepClaude Mixed proxy is running.');
    }
    else {
        outputChannel.appendLine('[deepclaude-mixed] Proxy is not running.');
        vscode.window.showInformationMessage('DeepClaude Mixed proxy is not running.');
    }
}
function startHealthPolling(context) {
    if (healthPollInterval)
        clearInterval(healthPollInterval);
    const config = vscode.workspace.getConfiguration('deepclaude-mixed');
    const intervalSec = Math.max(10, Math.min(300, config.get('healthPollIntervalSec', 30)));
    healthPollInterval = setInterval(async () => {
        const healthy = await proxyManager?.isRunning().catch(() => false);
        if (healthy) {
            statusBar?.setHealthy(proxyManager.getPort());
        }
        else {
            statusBar?.setError('Proxy not reachable');
        }
    }, intervalSec * 1000);
    context.subscriptions.push({ dispose: () => clearInterval(healthPollInterval) });
}
//# sourceMappingURL=extension.js.map