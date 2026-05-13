import * as vscode from 'vscode';

const ENV_VARS_INJECTED = [
    'ANTHROPIC_BASE_URL',
    'ANTHROPIC_API_KEY',
] as const;

export type DeploymentMode = '1p' | '3p';

const MODE_KEY = 'deepclaude-mixed.deploymentMode';

/**
 * Set env vars in the extension host process. These are inherited by any
 * child process spawned by other extensions (e.g., the Claude Code extension
 * spawning the Claude Code CLI).
 */
export function injectEnvVars(port: number = 3200): void {
    process.env.ANTHROPIC_BASE_URL = `http://127.0.0.1:${port}`;
    process.env.ANTHROPIC_API_KEY = 'unused';
}

/**
 * Switch between 1p (Anthropic direct) and 3p (DeepSeek proxy) modes.
 * 1p: clear proxy env vars → Claude Code uses its own auth (OAuth / API key)
 * 3p: inject proxy env vars → Claude Code routes through local DeepSeek proxy
 *
 * Mode is persisted in VS Code workspace state.
 */
export async function setMode(context: vscode.ExtensionContext, mode: DeploymentMode, port: number = 3200): Promise<DeploymentMode> {
    if (mode === '3p') {
        injectEnvVars(port);
    } else {
        clearEnvVars();
    }
    await context.workspaceState.update(MODE_KEY, mode);
    return mode;
}

export function getMode(context: vscode.ExtensionContext): DeploymentMode {
    return context.workspaceState.get<DeploymentMode>(MODE_KEY, '3p');
}

/**
 * Restore env vars to their original values on deactivation.
 */
export function clearEnvVars(): void {
    for (const key of ENV_VARS_INJECTED) {
        delete process.env[key];
    }
}
