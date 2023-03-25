// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
const logging = require('../utils/logging');
const job = {
    // Clear inactive sessions from the database
    clearInactiveSessions: {
        name: 'Clear Inactive Sessions',
        enabled: true,
        interval: 3.6e+6, // 1 hour
        start() {
            const db = require('../utils/database');
            db.query('DELETE FROM sessions WHERE created + interval 8 hour < now()');
        }
    },
    // Backup the source code
    backup: {
        name: 'Backups',
        enabled: true,
        interval: 3.6e+6, // 1 hour
        maxBackups: 5, // Keep the last 5 backups
        start() {
            const fs = require('fs'), tar = require('tar'), path = require('path');
            const backupDir = path.join(__dirname, '..', '..', '..', 'backups');
            const backupFile = path.join(backupDir, 'temp.bak');
            if (!fs.existsSync(backupDir)) fs.mkdirSync(backupDir);
            const directoryToBackup = path.join(__dirname, '..', '..', '..', 'src');
            if (!fs.existsSync(directoryToBackup)) throw new Error(`Unable to locate ${directoryToBackup}`);
            logging.log.info('Backup started...');
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
                    logging.log.info('Backup completed...');
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
                logging.log.error(err);
            });
        }
    }
};

Object.keys(job).forEach((key: any) => {
    if (job[key].enabled) {
        logging.log.info(`Scheduling job: ${job[key].name}`);
        setInterval(() => {
            try {
                job[key].start();
            } catch (err) {
                logging.log.error(err);
            }
        }, job[key].interval);
    }
});