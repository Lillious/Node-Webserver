// Minify files
import fs from 'fs';
import path from 'path';
import * as log from './logging.js';
const files = [] as string[];

function getFiles(directory: string) : Promise<string[]> {
    return new Promise((resolve, reject) => {
        if (!fs.existsSync(directory)) reject('Directory does not exist');
        const dir = fs.readdirSync(directory);
        for (const file of dir) {
            const filePath = path.join(directory, file);
            if (fs.statSync(filePath).isDirectory())            
                getFiles(filePath);
            else {
                if (file.endsWith('.js') || file.endsWith('.css') || file.endsWith('.html')) {
                    files.push(filePath);
                    log.info(`Minifying ${filePath}`);
                }
            }
        }
        resolve(files);
    });
}

function readFile (file: string) : Promise<string> {
    return new Promise((resolve, reject) => {
        try {
            const data = fs.readFileSync(file, 'utf8');
            resolve(data);
        } catch (err: any) {
            reject(err);
        }
    });
}

function regex (file: string) : Promise<string> {
    return new Promise((resolve) => {
        const minified = file.replace(/(\r\n|\n|\r|\t)/gm, '').replace(/ +(?= )/g,'');
        resolve(minified);
    });
}

export default async function minify (directory: string) {
    try {
        const result = await getFiles(directory);
        for (const file of result) {
            const data = await readFile(file);
            if (data.length !== 0) {
                const minified = await regex(data);
                fs.writeFileSync(file, minified);
            }
        }
    } catch (err: any) {
        throw new Error(err);
    }
}