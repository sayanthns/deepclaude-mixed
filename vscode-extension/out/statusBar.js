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
exports.StatusBarManager = void 0;
const vscode = __importStar(require("vscode"));
class StatusBarManager {
    item;
    currentMode = '3p';
    constructor(context) {
        this.item = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
        this.item.command = 'deepclaude-mixed.showStatus';
        this.item.tooltip = 'DeepClaude Mixed proxy status';
        this.setStopped();
        this.item.show();
        context.subscriptions.push(this.item);
    }
    setMode(mode) {
        this.currentMode = mode;
    }
    getMode() {
        return this.currentMode;
    }
    setHealthy(port) {
        const modeLabel = this.currentMode === '3p' ? '3p' : '1p';
        this.item.text = `$(check) DeepClaude :${port} ${modeLabel}`;
        this.item.backgroundColor = undefined;
        this.item.tooltip = `DeepClaude Mixed — ${this.currentMode === '3p' ? 'DeepSeek proxy' : 'Anthropic direct'} on 127.0.0.1:${port}\nClick to show status`;
        this.item.command = 'deepclaude-mixed.showStatus';
    }
    setHealthy1p() {
        this.setMode('1p');
        this.item.text = `$(circle-slash) DeepClaude 1p`;
        this.item.backgroundColor = undefined;
        this.item.tooltip = 'DeepClaude Mixed — Anthropic direct (proxy bypassed)\nClick to show status';
        this.item.command = 'deepclaude-mixed.showStatus';
    }
    setError(msg) {
        this.item.text = `$(error) DeepClaude`;
        this.item.tooltip = `Proxy error: ${msg}`;
        this.item.command = 'deepclaude-mixed.showStatus';
    }
    setStarting() {
        this.item.text = `$(sync~spin) DeepClaude`;
        this.item.tooltip = 'DeepClaude Mixed proxy — starting...';
        this.item.command = 'deepclaude-mixed.showStatus';
    }
    setStopped() {
        this.item.text = `$(circle-slash) DeepClaude`;
        this.item.tooltip = 'DeepClaude Mixed proxy — stopped (auto-start disabled)';
        this.item.command = 'deepclaude-mixed.showStatus';
    }
}
exports.StatusBarManager = StatusBarManager;
//# sourceMappingURL=statusBar.js.map