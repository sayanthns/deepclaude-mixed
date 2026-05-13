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
const brain_1 = require("./brain");
let proxyManager;
let statusBar;
let healthPollInterval;
async function activate(context) {
    // Step 1: Read stored deployment mode (default 3p)
    const storedMode = (0, env_1.getMode)(context);
    // Step 2: Inject env vars ONLY if in 3p mode
    const port = vscode.workspace.getConfiguration('deepclaude-mixed').get('proxyPort', 3200);
    if (storedMode === '3p') {
        (0, env_1.injectEnvVars)(port);
    }
    // Step 3: Create output channel for proxy logs
    const outputChannel = vscode.window.createOutputChannel('DeepClaude Mixed', { log: true });
    context.subscriptions.push(outputChannel);
    // Step 4: Initialize managers
    proxyManager = new proxyManager_1.ProxyManager(context, outputChannel);
    statusBar = new statusBar_1.StatusBarManager(context);
    statusBar.setMode(storedMode);
    // Step 5: Register commands
    context.subscriptions.push(vscode.commands.registerCommand('deepclaude-mixed.setApiKey', () => handleSetApiKey(context)), vscode.commands.registerCommand('deepclaude-mixed.restartProxy', () => handleRestart()), vscode.commands.registerCommand('deepclaude-mixed.showStatus', () => handleShowStatus(outputChannel)), vscode.commands.registerCommand('deepclaude-mixed.toggleMode', () => handleToggleMode(context, outputChannel)), 
    // Frappe Brain commands
    vscode.commands.registerCommand('deepclaude-mixed.configureBrain', () => handleConfigureBrain(context)), vscode.commands.registerCommand('deepclaude-mixed.enableBrain', () => (0, brain_1.enableBrain)(context)), vscode.commands.registerCommand('deepclaude-mixed.disableBrain', () => (0, brain_1.disableBrain)()), vscode.commands.registerCommand('deepclaude-mixed.toggleBrain', () => (0, brain_1.toggleBrain)(context)), vscode.commands.registerCommand('deepclaude-mixed.brainStatus', () => (0, brain_1.showBrainStatus)(outputChannel)));
    // Step 6: Listen for port config changes
    context.subscriptions.push(vscode.workspace.onDidChangeConfiguration(e => {
        if (e.affectsConfiguration('deepclaude-mixed.proxyPort')) {
            const newPort = vscode.workspace.getConfiguration('deepclaude-mixed').get('proxyPort', 3200);
            proxyManager.setPort(newPort);
            const mode = (0, env_1.getMode)(context);
            if (mode === '3p') {
                (0, env_1.injectEnvVars)(newPort);
            }
            handleRestart();
        }
        if (e.affectsConfiguration('deepclaude-mixed.healthPollIntervalSec')) {
            startHealthPolling(context);
        }
    }));
    // Step 7: Auto-start proxy (3p mode only)
    const autoStart = vscode.workspace.getConfiguration('deepclaude-mixed').get('autoStart', true);
    if (storedMode === '1p') {
        // 1p mode: skip proxy, show direct
        statusBar.setHealthy1p();
        outputChannel.appendLine('[deepclaude-mixed] 1p mode — proxy bypassed, using Anthropic direct');
    }
    else if (autoStart) {
        try {
            const actualPort = await proxyManager.start();
            (0, env_1.injectEnvVars)(actualPort);
            statusBar.setHealthy(actualPort);
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
    // Step 8: Start health polling
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
async function handleToggleMode(context, outputChannel) {
    const current = (0, env_1.getMode)(context);
    const target = current === '3p' ? '1p' : '3p';
    const port = proxyManager?.getPort() || vscode.workspace.getConfiguration('deepclaude-mixed').get('proxyPort', 3200);
    if (target === '1p') {
        // Switching to 1p: clear env vars so Claude Code uses its own auth
        await (0, env_1.setMode)(context, '1p');
        statusBar.setHealthy1p();
        outputChannel.appendLine('[deepclaude-mixed] Switched to 1p — Anthropic direct (proxy bypassed)');
        vscode.window.showInformationMessage('Switched to 1p (Anthropic direct). Reload VS Code window for Claude Code to pick up changes.', 'Reload Window').then(action => {
            if (action === 'Reload Window') {
                vscode.commands.executeCommand('workbench.action.reloadWindow');
            }
        });
    }
    else {
        // Switching to 3p: inject env vars, ensure proxy running
        await (0, env_1.setMode)(context, '3p', port);
        statusBar.setMode('3p');
        // Start proxy if not running
        const healthy = await proxyManager?.isRunning().catch(() => false);
        if (!healthy) {
            try {
                const actualPort = await proxyManager?.start();
                if (actualPort && actualPort !== port) {
                    (0, env_1.injectEnvVars)(actualPort);
                }
                statusBar.setHealthy(proxyManager?.getPort() || port);
                outputChannel.appendLine(`[deepclaude-mixed] Switched to 3p — proxy on port ${proxyManager?.getPort() || port}`);
            }
            catch (e) {
                statusBar.setError(e.message);
                vscode.window.showErrorMessage(`Failed to start proxy: ${e.message}`);
                return;
            }
        }
        else {
            statusBar.setHealthy(proxyManager?.getPort() || port);
            outputChannel.appendLine(`[deepclaude-mixed] Switched to 3p — reusing proxy on port ${proxyManager?.getPort() || port}`);
        }
        vscode.window.showInformationMessage('Switched to 3p (DeepSeek proxy). Reload VS Code window for Claude Code to pick up changes.', 'Reload Window').then(action => {
            if (action === 'Reload Window') {
                vscode.commands.executeCommand('workbench.action.reloadWindow');
            }
        });
    }
}
async function handleShowStatus(outputChannel) {
    outputChannel.show();
    const mode = statusBar?.getMode() || '3p';
    const healthy = await proxyManager?.isRunning().catch(() => false);
    outputChannel.appendLine(`Mode: ${mode} (${mode === '3p' ? 'DeepSeek proxy' : 'Anthropic direct'})`);
    if (mode === '1p') {
        outputChannel.appendLine('[deepclaude-mixed] 1p mode — proxy bypassed. Claude Code uses its own auth.');
    }
    else if (healthy) {
        const status = await proxyManager?.getStatus();
        outputChannel.appendLine(JSON.stringify(status, null, 2));
    }
    else {
        outputChannel.appendLine('[deepclaude-mixed] 3p mode — proxy is not running.');
    }
}
async function handleConfigureBrain(context) {
    const ok = await (0, brain_1.setBrainApiKey)(context);
    if (ok) {
        await (0, brain_1.enableBrain)(context);
    }
}
function startHealthPolling(context) {
    if (healthPollInterval)
        clearInterval(healthPollInterval);
    const config = vscode.workspace.getConfiguration('deepclaude-mixed');
    const intervalSec = Math.max(10, Math.min(300, config.get('healthPollIntervalSec', 30)));
    healthPollInterval = setInterval(async () => {
        const mode = statusBar?.getMode() || '3p';
        if (mode === '1p') {
            statusBar?.setHealthy1p();
            return;
        }
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