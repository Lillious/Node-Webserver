import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'node:url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
import * as readline from 'node:readline/promises';
import * as log from './logging.js';
const redirects = path.join(__dirname, '..', '..', 'config', 'redirects.cfg');

if (!fs.existsSync(path.join(__dirname, '..', '..', 'config'))) fs.mkdirSync(path.join(__dirname, '..', '..', 'config'));
if (!fs.existsSync(redirects)) {
    fs.writeFileSync(redirects, '# Redirect rules\n');
    fs.writeFileSync(redirects, '# Redirects must be written in the below format otherwise they will be skipped\n');
    fs.writeFileSync(redirects, '# path/to/redirect/from/ -> path/to/redirect/to/\n');
    addRedirect('localhost/', 'localhost/login/');
}


export function redirect (req: any, res: any, next: any): void {
    const rl = readline.createInterface({ input: fs.createReadStream(redirects) });
    const url = `${req.headers['x-forwarded-proto'] || req.protocol}://${req.headers.host}${req.url}`;
    let found = false;
    rl.on('line', (line: string) => {
        if (line.startsWith('#')) return;
        const [from, to] = line.split(' -> ');
        if (!from || !to) return log.error(`Invalid redirect: ${line}`);
        if (url === `${req.headers['x-forwarded-proto'] || req.protocol}://${from}`) {
            log.info(`Redirecting ${from} to ${to}`);
            found = true;
            res.redirect(`${req.headers['x-forwarded-proto'] || req.protocol}://${to}`);
        }            
    }).on('close', () => {
        if (!found) next();
    }).on('error', (err: any) => {
        log.error(err);
        next();
    });
}

export function addRedirect (from: string, to: string): Promise<any> {
    return new Promise((resolve, reject) => {
        if (!fs.readFileSync(redirects, 'utf8').endsWith('\n')) fs.appendFileSync(redirects, '\n');
        if (!from.endsWith('/')) from += '/';
        if (!to.endsWith('/')) to += '/';
        const rl = readline.createInterface({ input: fs.createReadStream(redirects) });
        rl.on('line', (line: string) => {
            if (line.startsWith('#')) return;
            const [redirectFrom] = line.split(' -> ');
            if (from === redirectFrom) reject('ALR_EXISTS');
        }).on('close', () => {
            fs.appendFileSync(redirects, `${from} -> ${to}\n`);
            resolve(true);
        }).on('error', (err: any) => {
            log.error(err);
            reject('Error reading redirects.cfg');
        });
    });
}

export function removeRedirect (from: string): Promise<any> {
    return new Promise((resolve, reject) => {
        if (!from.endsWith('/')) from += '/';
        fs.readFile(redirects, 'utf8', (err, data) => {
            if (err) reject('Error reading redirects.cfg');
            const lines = data.split('\n');
            const newLines = lines.filter((line: string) => !line.startsWith(from));
            fs.writeFile(redirects, newLines.join('\n'), (err) => {
                if (err) reject('Error writing redirects.cfg');
                resolve(true);
            });
        });
    });
}