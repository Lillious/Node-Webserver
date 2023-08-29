import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'node:url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
import * as readline from 'node:readline/promises';
import * as log from './logging.js';
const security = path.join(__dirname, '..', '..', 'config', 'security.cfg');

if (!fs.existsSync(path.join(__dirname, '..', '..', 'config'))) fs.mkdirSync(path.join(__dirname, '..', '..', 'config'));
if (!fs.existsSync(security)) {
    fs.writeFileSync(security, '# Security Definitions\n');
}

export function checkSecurityRule (url: string): Promise<any> {
    return new Promise((resolve, reject) => {
        const rl = readline.createInterface({ input: fs.createReadStream(security) });
        rl.on('line', (rule: string) => {
            if (rule.startsWith('#')) return;
            if (url.includes(rule)) resolve(true);
        })
        .on('close', () => {
            reject('NOT_FOUND');
        })
        .on('error', (err: any) => {
            log.error(err);
            reject('Error reading security.cfg');
        });
    });
}