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
exports.setBrainApiKey = setBrainApiKey;
exports.enableBrain = enableBrain;
exports.disableBrain = disableBrain;
exports.toggleBrain = toggleBrain;
exports.showBrainStatus = showBrainStatus;
const vscode = __importStar(require("vscode"));
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const os = __importStar(require("os"));
const BRAIN_URL = 'https://brain.enfonoerp.com/mcp';
const SECRET_KEY = 'deepclaude-mixed.brainApiKey';
const CLAUDE_CONFIG_PATH = path.join(os.homedir(), '.claude.json');
function readClaudeConfig() {
    try {
        if (fs.existsSync(CLAUDE_CONFIG_PATH)) {
            return JSON.parse(fs.readFileSync(CLAUDE_CONFIG_PATH, 'utf8'));
        }
    }
    catch { /* ignore parse errors */ }
    return {};
}
function writeClaudeConfig(cfg) {
    const dir = path.dirname(CLAUDE_CONFIG_PATH);
    if (!fs.existsSync(dir))
        fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(CLAUDE_CONFIG_PATH, JSON.stringify(cfg, null, 2), 'utf8');
}
async function setBrainApiKey(context) {
    const key = await vscode.window.showInputBox({
        prompt: 'Enter your Frappe Brain API key (from Sayanth)',
        placeHolder: 'sk-brain-...',
        password: true,
        ignoreFocusOut: true,
    });
    if (!key)
        return false;
    await context.secrets.store(SECRET_KEY, key);
    vscode.window.showInformationMessage('Frappe Brain API key saved securely.');
    return true;
}
async function enableBrain(context) {
    const apiKey = await context.secrets.get(SECRET_KEY);
    if (!apiKey) {
        const action = await vscode.window.showWarningMessage('Frappe Brain API key not set.', 'Set API Key');
        if (action === 'Set API Key') {
            const ok = await setBrainApiKey(context);
            if (!ok)
                return;
        }
        else {
            return;
        }
    }
    const key = await context.secrets.get(SECRET_KEY);
    if (!key)
        return;
    const cfg = readClaudeConfig();
    cfg.mcpServers = cfg.mcpServers || {};
    cfg.mcpServers['frappe-brain'] = {
        url: BRAIN_URL,
        transport: 'streamableHttp',
        headers: { 'x-api-key': key },
    };
    writeClaudeConfig(cfg);
    vscode.window.showInformationMessage('Frappe Brain enabled. Restart Claude Code (or reload VS Code) for tools to appear.');
}
async function disableBrain() {
    const cfg = readClaudeConfig();
    if (cfg.mcpServers?.['frappe-brain']) {
        cfg.mcpServers['frappe-brain'].disabled = true;
        writeClaudeConfig(cfg);
        vscode.window.showInformationMessage('Frappe Brain disabled. Restart Claude Code to apply.');
    }
    else {
        vscode.window.showInformationMessage('Frappe Brain is not configured.');
    }
}
async function toggleBrain(context) {
    const cfg = readClaudeConfig();
    const brainCfg = cfg.mcpServers?.['frappe-brain'];
    if (!brainCfg || brainCfg.disabled) {
        await enableBrain(context);
    }
    else {
        await disableBrain();
    }
}
async function showBrainStatus(outputChannel) {
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
        }
        else {
            outputChannel.appendLine(`Connectivity: Error (${res.status})`);
        }
    }
    catch (e) {
        outputChannel.appendLine(`Connectivity: Unreachable — ${e.message}`);
    }
    outputChannel.appendLine('===========================');
    const msg = enabled
        ? 'Frappe Brain is configured and enabled.'
        : 'Frappe Brain is disabled or not configured.';
    vscode.window.showInformationMessage(msg);
}
//# sourceMappingURL=brain.js.map