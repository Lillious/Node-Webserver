import fs from 'fs';
import path from 'path';

const excludedFileTypes = ['.ts'];
const excludedFolders = [];

export default function Copy (source, target) {
    return new Promise((resolve, reject) => {
        try {
            // Check if directory exists
            if (!fs.existsSync(source)) {
                reject(`Directory ${source} does not exist.`);
            }

            // If target directory does not exist, create the whole path
            if (!fs.existsSync(target)) {
                fs.mkdirSync(target, { recursive: true });
            }

            // Get all files in directory
            const files = fs.readdirSync(source);

            // Loop through files
            for (const file of files) {
                const filePath = path.join(source, file);
                // Check if file is a directory
                if (fs.statSync(filePath).isDirectory()) {
                    // Check if directory is excluded
                    if (!excludedFolders.includes(file)) {
                        // Check if target directory exists
                        if (!fs.existsSync(target)) {
                            fs.mkdirSync(target);
                        }
                        // Copy directory
                        Copy(filePath, path.join(target, file));
                    }
                } else {
                    // Check if file is excluded
                    if (!excludedFileTypes.includes(path.extname(file))) {
                        // Check if target directory exists
                        if (!fs.existsSync(target)) {
                            fs.mkdirSync(target);
                        }
                        // Copy file
                        fs.copyFileSync(filePath, path.join(target, file));
                    }
                }
            }
            resolve();
        } catch (err) {
            reject(err);
        }
    });
}