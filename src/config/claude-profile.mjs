import { mkdirSync, writeFileSync, readFileSync, existsSync } from 'fs';
import { join } from 'path';
import { randomUUID } from 'crypto';
import { getClaudeUserDataDir } from './paths.mjs';

function configLibraryDir(opts) {
    return join(getClaudeUserDataDir(opts), 'configLibrary');
}

function metaPath(opts) {
    return join(configLibraryDir(opts), '_meta.json');
}

function readMeta(opts) {
    const p = metaPath(opts);
    if (!existsSync(p)) return { appliedId: '', entries: [] };
    return JSON.parse(readFileSync(p, 'utf8'));
}

function writeMeta(opts, meta) {
    const p = metaPath(opts);
    mkdirSync(configLibraryDir(opts), { recursive: true });
    writeFileSync(p, JSON.stringify(meta, null, 2));
}

export function writeProfile({ home, platform, appdata, name, gatewayBaseUrl, gatewayApiKey, models }) {
    const opts = { home, platform, appdata };
    const id = randomUUID();
    const profile = {
        inferenceProvider: 'gateway',
        inferenceGatewayBaseUrl: gatewayBaseUrl,
        inferenceGatewayApiKey: gatewayApiKey,
        inferenceModels: models,
    };
    mkdirSync(configLibraryDir(opts), { recursive: true });
    writeFileSync(join(configLibraryDir(opts), `${id}.json`), JSON.stringify(profile, null, 2));

    const meta = readMeta(opts);
    const entries = (meta.entries || []).filter(e => e.name !== name);
    entries.push({ id, name });
    writeMeta(opts, { appliedId: id, entries });

    return id;
}

export function readProfile({ home, platform, appdata, id }) {
    return JSON.parse(readFileSync(join(configLibraryDir({ home, platform, appdata }), `${id}.json`), 'utf8'));
}

export function listProfiles({ home, platform, appdata }) {
    const meta = readMeta({ home, platform, appdata });
    return meta.entries || [];
}
