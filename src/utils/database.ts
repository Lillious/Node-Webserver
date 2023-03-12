const mysql = require('mysql2');
require('dotenv').config();
const fs = require('fs');

const pool = mysql.createPool({
    host: process.env.DATABASE_HOST,
    user: process.env.DATABASE_USER,
    password: process.env.DATABASE_PASSWORD,
    database: process.env.DATABASE_NAME,
    ssl: {
        ca: fs.readFileSync(__dirname + '/ca-certificate.crt')
    }
});

export const query = (sql: string, values: any) => {
    return new Promise((resolve, reject) => {
        pool.getConnection((err: any, connection: any) => {
            if (err) {
                return reject(err);
            }
            connection.query(mysql.format(sql, values), (err: any, rows: any) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(rows);
                }
                connection.release();
            });
        });
    });
};