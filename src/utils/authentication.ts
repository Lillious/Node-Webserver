const db = require('./database');

export const checkSession = (session: string) => {
    return new Promise((resolve, reject) => {
        db.query('SELECT * FROM sessions WHERE session = ?', [session]).then((results: any) => {
            if (results.length > 0) {
                resolve(results[0].email);
            } else {
                reject();
            }
        }).catch((err: any) => {
            reject(err);
        });
    });
}