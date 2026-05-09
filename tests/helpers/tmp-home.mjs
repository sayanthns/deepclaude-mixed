import { mkdtempSync, rmSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';

export function makeTmpHome() {
    const home = mkdtempSync(join(tmpdir(), 'dcm-test-'));
    return {
        home,
        cleanup: () => rmSync(home, { recursive: true, force: true }),
    };
}
