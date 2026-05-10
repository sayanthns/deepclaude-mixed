import { copyFileSync, mkdirSync, chmodSync } from 'fs';
import { join } from 'path';
import { homedir, platform as osPlatform } from 'os';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';
import { askKeys } from '../lib/prompts.mjs';
import { info, ok, warn, err } from '../lib/log.mjs';
import { writeProfile } from '../config/claude-profile.mjs';
import { setDeploymentMode } from '../config/deployment-mode.mjs';
import { setEgressAllowedHosts, DEFAULT_HOSTS } from '../config/egress.mjs';
import { setCliSandboxHosts } from '../config/cli-sandbox.mjs';
import { getInstallRoot, getProxyPort } from '../config/paths.mjs';
import * as autostart from '../autostart/index.mjs';
import { killClaude, openClaude } from '../claude-app/lifecycle.mjs';

const __dirname = fileURLToPath(new URL('.', import.meta.url));

function findNode() {
    const cmd = osPlatform() === 'win32' ? 'where node' : 'which node';
    return execSync(cmd).toString().trim().split('\n')[0];
}

export async function main() {
    info(`Detected: ${osPlatform()} ${process.arch}, Node ${process.versions.node}`);

    const { deepseekKey } = await askKeys();
    if (!deepseekKey) { err('DeepSeek key required'); process.exit(1); }

    const installRoot = getInstallRoot();
    mkdirSync(installRoot, { recursive: true });
    const proxyDest = join(installRoot, 'mixed-proxy.mjs');
    const proxySrc  = join(__dirname, '..', 'proxy', 'mixed-proxy.mjs');
    copyFileSync(proxySrc, proxyDest);
    chmodSync(proxyDest, 0o755);

    const port = getProxyPort();
    writeProfile({
        name: 'Deepseek-Mixed',
        gatewayBaseUrl: `http://127.0.0.1:${port}`,
        gatewayApiKey: 'unused',
        models: [
            { name: 'claude-opus-4-6', supports1m: true },
            { name: 'claude-sonnet-4-6', supports1m: true },
            { name: 'claude-haiku-4-5-20251001', supports1m: false },
        ],
    });
    ok('Wrote Claude Desktop profile');

    setDeploymentMode({ mode: '3p' });
    ok('Set deploymentMode = 3p');

    const cowork = setEgressAllowedHosts({ hosts: DEFAULT_HOSTS, merge: true });
    ok(`Cowork egress allowlist: ${cowork.length} hosts`);

    const cli = setCliSandboxHosts({ hosts: DEFAULT_HOSTS, merge: true });
    ok(`Claude Code CLI sandbox allowlist: ${cli.length} hosts`);

    autostart.install({
        home: homedir(),
        nodePath: findNode(),
        scriptPath: proxyDest,
        env: {
            DEEPSEEK_API_KEY: deepseekKey,
            PROXY_PORT: String(port),
        },
    });
    ok('Installed auto-start service');

    info('Restarting Claude Desktop…');
    killClaude();
    setTimeout(() => {
        openClaude();
        ok('Done. Pick model in Claude Desktop:');
        info('  Opus → DeepSeek V4 Pro');
        info('  Sonnet → DeepSeek V4 Pro');
        info('  Haiku → DeepSeek V4 Flash');
        info(`Proxy status: curl -s http://127.0.0.1:${port}/_proxy/status`);
    }, 2000);
}

main().catch(e => { err(e); process.exit(1); });
