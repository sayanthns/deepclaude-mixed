import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

const BRAIN_URL = 'https://brain.enfonoerp.com/mcp';
const SECRET_KEY = 'deepclaude-mixed.brainApiKey';
const CLAUDE_CONFIG_PATH = path.join(os.homedir(), '.claude.json');

interface ClaudeConfig {
    mcpServers?: Record<string, McpServer>;
    [key: string]: unknown;
}

interface McpServer {
    url?: string;
    transport?: string;
    headers?: Record<string, string>;
    disabled?: boolean;
}

function readClaudeConfig(): ClaudeConfig {
    try {
        if (fs.existsSync(CLAUDE_CONFIG_PATH)) {
            return JSON.parse(fs.readFileSync(CLAUDE_CONFIG_PATH, 'utf8'));
        }
    } catch { /* ignore parse errors */ }
    return {};
}

function writeClaudeConfig(cfg: ClaudeConfig): void {
    const dir = path.dirname(CLAUDE_CONFIG_PATH);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(CLAUDE_CONFIG_PATH, JSON.stringify(cfg, null, 2), 'utf8');
}

export async function setBrainApiKey(context: vscode.ExtensionContext): Promise<boolean> {
    const key = await vscode.window.showInputBox({
        prompt: 'Enter your Frappe Brain API key (from Sayanth)',
        placeHolder: 'sk-brain-...',
        password: true,
        ignoreFocusOut: true,
    });
    if (!key) return false;

    await context.secrets.store(SECRET_KEY, key);
    vscode.window.showInformationMessage('Frappe Brain API key saved securely.');
    return true;
}

export async function enableBrain(context: vscode.ExtensionContext): Promise<void> {
    const apiKey = await context.secrets.get(SECRET_KEY);
    if (!apiKey) {
        const action = await vscode.window.showWarningMessage(
            'Frappe Brain API key not set.',
            'Set API Key'
        );
        if (action === 'Set API Key') {
            const ok = await setBrainApiKey(context);
            if (!ok) return;
        } else {
            return;
        }
    }

    const key = await context.secrets.get(SECRET_KEY);
    if (!key) return;

    const cfg = readClaudeConfig();
    cfg.mcpServers = cfg.mcpServers || {};
    cfg.mcpServers['frappe-brain'] = {
        url: BRAIN_URL,
        transport: 'streamableHttp',
        headers: { 'x-api-key': key },
    };
    writeClaudeConfig(cfg);

    vscode.window.showInformationMessage(
        'Frappe Brain enabled. Restart Claude Code (or reload VS Code) for tools to appear.'
    );
}

export async function disableBrain(): Promise<void> {
    const cfg = readClaudeConfig();
    if (cfg.mcpServers?.['frappe-brain']) {
        cfg.mcpServers['frappe-brain'].disabled = true;
        writeClaudeConfig(cfg);
        vscode.window.showInformationMessage('Frappe Brain disabled. Restart Claude Code to apply.');
    } else {
        vscode.window.showInformationMessage('Frappe Brain is not configured.');
    }
}

export async function toggleBrain(context: vscode.ExtensionContext): Promise<void> {
    const cfg = readClaudeConfig();
    const brainCfg = cfg.mcpServers?.['frappe-brain'];

    if (!brainCfg || brainCfg.disabled) {
        await enableBrain(context);
    } else {
        await disableBrain();
    }
}

export async function showBrainStatus(outputChannel: vscode.OutputChannel): Promise<void> {
    outputChannel.show();
    outputChannel.appendLine('=== Frappe Brain Status ===');

    // Check config
    const cfg = readClaudeConfig();
    const brainCfg = cfg.mcpServers?.['frappe-brain'];
    const enabled = brainCfg && !brainCfg.disabled;

    outputChannel.appendLine(`Configured: ${brainCfg ? 'Yes' : 'No'}`);
    outputChannel.appendLine(`Enabled: ${enabled ? 'Yes' : 'No'}`);
    outputChannel.appendLine(`URL: ${brainCfg?.url || BRAIN_URL}`);

    // Check connectivity
    try {
        const res = await fetch(`${BRAIN_URL}/status`, { signal: AbortSignal.timeout(3000) });
        if (res.ok) {
            const body = await res.text();
            outputChannel.appendLine(`Connectivity: OK (${res.status})`);
            outputChannel.appendLine(`Response: ${body.slice(0, 200)}`);
        } else {
            outputChannel.appendLine(`Connectivity: Error (${res.status})`);
        }
    } catch (e: any) {
        outputChannel.appendLine(`Connectivity: Unreachable — ${e.message}`);
    }

    outputChannel.appendLine('===========================');

    const msg = enabled
        ? 'Frappe Brain is configured and enabled.'
        : 'Frappe Brain is disabled or not configured.';
    vscode.window.showInformationMessage(msg);
}
