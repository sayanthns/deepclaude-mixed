import { setDeploymentMode, getDeploymentMode } from '../config/deployment-mode.mjs';
import { killClaude, openClaude } from '../claude-app/lifecycle.mjs';
import { info, ok } from '../lib/log.mjs';

const action = process.argv[2] || 'toggle';
const current = getDeploymentMode() || '3p';

let target;
if (action === 'status') {
    info(`current mode: ${current}`);
    process.exit(0);
} else if (action === 'toggle') {
    target = current === '3p' ? '1p' : '3p';
} else if (action === '1p' || action === '3p') {
    target = action;
} else {
    info('usage: claude-mode [1p|3p|toggle|status]');
    process.exit(1);
}

setDeploymentMode({ mode: target });
ok(`switched: ${current} → ${target}`);
killClaude();
setTimeout(() => { openClaude(); ok('relaunched'); }, 2000);
