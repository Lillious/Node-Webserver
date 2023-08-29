import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'node:url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
import * as readline from 'node:readline/promises';
import * as log from '../utils/logging.js';
const settings = path.join(__dirname, '..', '..', 'config', 'settings.cfg');

if (!fs.existsSync(path.join(__dirname, '..', '..', 'config'))) {
    fs.mkdirSync(path.join(__dirname, '..', '..', 'config'));
}
if (!fs.existsSync(settings)) {
    fs.writeFileSync(settings, 'registration -> false\n');
    fs.writeFileSync(settings, 'maintenance -> false\n');
}

export function getSetting (setting: string): Promise<any> {
    return new Promise((resolve, reject) => {
        setting = setting.toLowerCase();
        const rl = readline.createInterface({ input: fs.createReadStream(settings) });
        rl.on('line', (line: string) => {
            if (line.startsWith('#')) return;
            const [key, value] = line.split(' -> ');
            if (!key || !value) return log.error(`Invalid setting: ${line}`);
            if (key === setting) {
                resolve(value);
            }
        }).on('close', () => {
            reject(undefined);
        }).on('error', (err: any) => {
            if (err) {
                log.error(err);
                reject(undefined);
            }
        });
    });
}

export function updateSetting (setting: string, value: string) {
    setting = setting.toLowerCase();
    fs.readFile(settings, 'utf8', (err, data) => {
        if (err) return log.error('Error reading settings.cfg');
        const lines = data.split('\n');
        const newLines = lines.filter((line: string) => !line.startsWith(setting));
        newLines.push(`${setting} -> ${value}`);
        fs.writeFile(settings, newLines.join('\n'), (err) => {
            if (err) return log.error('Error writing settings.cfg');
            log.info(`Updated setting ${setting} to ${value}`);
        });
    });
}