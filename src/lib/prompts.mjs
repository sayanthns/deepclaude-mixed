import prompts from 'prompts';

export async function askKeys() {
    return prompts([
        {
            type: 'password',
            name: 'deepseekKey',
            message: 'DeepSeek API key (required, sk-...)',
            validate: v => /^sk-[a-zA-Z0-9]{20,}$/.test(v) || 'Looks invalid, expected sk-...',
        },
    ], { onCancel: () => process.exit(1) });
}
