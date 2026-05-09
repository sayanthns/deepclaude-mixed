import prompts from 'prompts';

export async function askKeys() {
    return prompts([
        {
            type: 'password',
            name: 'deepseekKey',
            message: 'DeepSeek API key (required, sk-...)',
            validate: v => /^sk-[a-zA-Z0-9]{20,}$/.test(v) || 'Looks invalid, expected sk-...',
        },
        {
            type: 'password',
            name: 'anthropicKey',
            message: 'Anthropic API key (optional, sk-ant-...; press Enter to skip — Opus disabled)',
            validate: v => v === '' || /^sk-ant-[a-zA-Z0-9_-]{20,}/.test(v) || 'Looks invalid, expected sk-ant-...',
        },
    ], { onCancel: () => process.exit(1) });
}
