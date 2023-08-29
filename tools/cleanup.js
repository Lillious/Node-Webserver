import fs from 'fs';

export default function Cleanup (sourceDir) {
    return new Promise((resolve, reject) => {
        try {
            if (!fs.existsSync(sourceDir)) resolve();
            const excludedFolders = [];
            const folders = fs.readdirSync(sourceDir);
            for (const folder of folders) {
                if (!excludedFolders.includes(folder)) {
                    const folderPath = `${sourceDir}/${folder}`;
                    if (fs.statSync(folderPath).isDirectory()) {
                        Cleanup(folderPath);
                    } else {
                        fs.unlinkSync(folderPath);
                    }
                }
            }
            const _folders = fs.readdirSync(sourceDir);
            for (const _folder of _folders) {
                const folderPath = `${sourceDir}/${_folder}`;
                if (!excludedFolders.includes(_folder)) {
                    if (fs.readdirSync(folderPath).length === 0) {
                        fs.rmdirSync(folderPath);
                    }
                }
            }
            resolve();
        } catch (err) {
            reject(err);
        }
    });
}