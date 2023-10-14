import mysql from "mysql2";
import dotenv from "dotenv";
dotenv.config();

const pool = mysql.createPool({
  host: process.env.DATABASE_HOST,
  user: process.env.DATABASE_USER,
  password: process.env.DATABASE_PASSWORD,
  database: process.env.DATABASE_NAME,
  waitForConnections: true,
});

export default function query(sql: string, values?: any): Promise<any> {
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
}
