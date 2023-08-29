// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
import dotenv from 'dotenv';
dotenv.config();
import * as log from '../utils/logging.js';
import query from '../utils/database.js';
import * as email from '../utils/mailer.js';
import fs from 'fs';
import tar from 'tar';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'node:url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const files = [] as string[];
const tempStorage = [] as any[];

const job = {
    // Clear inactive sessions from the database
    clearInactiveSessions: {
        name: 'Clear Inactive Sessions',
        enabled: true,
        interval: 5000, // 1 hour
        start() {
            query('DELETE FROM sessions WHERE created + interval 8 hour < now()');
        },
    },
    // Backup the source code
    backup: {
        name: 'Backups',
        enabled: true,
        interval: 3.6e+6, // 1 hour
        maxBackups: 5, // Keep the last 5 backups
        start() {
            const backupDir = path.join(__dirname, '..', '..', 'backups');
            const backupFile = path.join(backupDir, 'temp.bak');
            if (!fs.existsSync(backupDir)) fs.mkdirSync(backupDir);
            const directoryToBackup = path.join(__dirname, '..', '..', 'dist');
            if (!fs.existsSync(directoryToBackup)) throw new Error(`Unable to locate ${directoryToBackup}`);
            tar.c({
                gzip: true,
                file: backupFile,
                cwd: directoryToBackup
            }, ['.']).then(() => {
                const date = new Date();
                const year = date.getFullYear();
                let month = date.getMonth() + 1;
                let day = date.getDate();
                let hour = date.getHours();
                let minute = date.getMinutes();
                let second = date.getSeconds();
                if (month.length == 1) month = `0${month}`;
                if (day.length == 1) day = `0${day}`;
                if (hour.length == 1) hour = `0${hour}`;
                if (minute.length == 1) minute = `0${minute}`;
                if (second.length == 1) second = `0${second}`;
                const backupName = `${year}-${month}-${day}_${hour}-${minute}-${second}.bak`;
                const backupPath = path.join(backupDir, backupName);
                fs.rename(backupFile, backupPath, (err: any) => {
                    if (err) throw err;
                    log.info('Backup completed');
                });
                // Delete last backup if there are more than 5
                fs.readdir(backupDir, (err: any, files: any) => {
                    if (err) throw err;
                    const backups = files.filter((file: any) => file.endsWith('.bak'));
                    if (backups.length > this.maxBackups) {
                        const backupsToDelete = backups.slice(0, backups.length - 5);
                        backupsToDelete.forEach((backupToDelete: any) => {
                            const backupToDeletePath = path.join(backupDir, backupToDelete);
                            fs.unlink(backupToDeletePath, (err: any) => {
                                if (err) throw err;
                            });
                        });
                    }
                });
            }).catch((err: any) => {
                log.error(err);
            });
        }
    },
    // Watch dog service. Scans for altered files and notifies EMAIL_ALERTS of any changes.
    watchDog: {
        name: 'Watch Dog Service',
        enabled: true,
        interval: 300000, // 5 minutes
        startImediately: true, // Run on startup
        start() {
            const tempStorageCopy = [...tempStorage];
            const files = [] as string[];
            tempStorageCopy.forEach((file) => {
                const fileBuffer = fs.readFileSync(file.file);
                const hashSum = crypto.createHash('sha256');
                hashSum.update(fileBuffer);
                const hex = hashSum.digest('hex');
                if (hex != file.hash) {
                    log.error(`File ${file.file} has been altered since last scan.`);
                    files.push(file.file);
                }
            });
            if (files.length > 0) {
                email.send(process.env.EMAIL_ALERTS, 'Watch Dog Alert', `The following files have been altered since the last scan: ${files.join(', ')}`);
            }
            this.initialize();
        },
        initialize() {
            tempStorage.length = 0;
            files.length = 0;
            getFiles(path.join(__dirname, '..', '..', 'dist')).then((files) => {
                files.forEach((file) => {
                    const fileBuffer = fs.readFileSync(file);
                    const hashSum = crypto.createHash('sha256');
                    hashSum.update(fileBuffer);
                    const hex = hashSum.digest('hex');
                    tempStorage.push({
                        file,
                        hash: hex
                    });
                });
            }).catch((err) => {
                log.error(err);
            });
        }
    },
};

Object.keys(job).forEach((key: any) => {
    if (job[key].enabled) {
        log.info(`Scheduling job: ${job[key].name}`);
        setInterval(() => {
            try {
                job[key].start();
            } catch (err) {
                log.error(err);
            }
        }, job[key].interval);

        // Run startup jobs
        if (job[key].startImediately) {
            try {
                job[key].initialize();
            } catch (err) {
                log.error(err);
            }
        }
    }
});


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
                }
            }
        }
        resolve(files);
    });
}