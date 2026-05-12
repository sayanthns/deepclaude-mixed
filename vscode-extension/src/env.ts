const ENV_VARS_INJECTED = [
    'ANTHROPIC_BASE_URL',
    'ANTHROPIC_API_KEY',
] as const;

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
 * Restore env vars to their original values on deactivation.
 */
export function clearEnvVars(): void {
    for (const key of ENV_VARS_INJECTED) {
        delete process.env[key];
    }
}
