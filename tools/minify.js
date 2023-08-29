// Minify files
import fs from 'fs';
import path from 'path';
const files = [];

function getFiles(directory) {
    return new Promise((resolve, reject) => {
        if (!fs.existsSync(directory)) reject('Directory does not exist');
        const dir = fs.readdirSync(directory);
        for (const file of dir) {
            const filePath = path.join(directory, file);
            if (fs.statSync(filePath).isDirectory())            
                getFiles(filePath);
            else {
                if (file.endsWith('.js')) {
                    files.push(filePath);
                }
            }
        }
        resolve(files);
    });
}

function readFile (file) {
    return new Promise((resolve, reject) => {
        try {
            const data = fs.readFileSync(file, 'utf8');
            resolve(data);
        } catch (err) {
            reject(err);
        }
    });
}

function regex (file) {
    return new Promise((resolve) => {
        const minified = file.replace(/(\r\n|\n|\r|\t)/gm, '').replace(/ +(?= )/g,'');
        resolve(minified);
    });
}

async function minify (directory) {
    try {
        const result = await getFiles(directory);
        for (const file of result) {
            const data = await readFile(file);
            if (data.length !== 0) {
                const minified = await regex(data);
                fs.writeFileSync(file, minified);
            }
        }
    } catch (err) {
        throw new Error(err);
    }
}

minify(path.join(process.cwd(), 'dist'));