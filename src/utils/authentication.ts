const db = require('./database');

export const checkSession = (session: string, ip: string) => {
    return new Promise((resolve, reject) => {
        db.query('SELECT * FROM sessions WHERE session = ? AND ip = ?', [session, ip]).then((results: any) => {
            if (results.length > 0) {
                resolve([results[0].email, results[0].code]);
            } else {
                reject();
            }
        }).catch((err: any) => {
            reject(err);
        });
    });
}

export const checkCode = (email: string, code: string) => {
    return new Promise((resolve, reject) => {
        db.query('SELECT * FROM sessions WHERE email = ? AND code = ?', [email, code]).then((results: any) => {
            if (results.length > 0) {
                resolve(results[0]);
            } else {
                reject();
            }
        }).catch((err: any) => {
            reject(err);
        });
    });
}