const mysql = require("mysql");
const pool = require('../config/db')();

// const db = mysql.createConnection({
//     host: process.env.DATABASE_HOST,
//     user: process.env.DATABASE_USER,
//     password: process.env.DATABASE_PASSWORD,
//     database: process.env.DATABASE
// });

exports.getDrawInfo = (req, res) => {
    const testSql = "SELECT * FROM draw_info"; //  rename

    pool.getConnection((err, conn) => {
        conn.query(testSql, (err, data) => {
            if (err) {
                console.log(err);
            }
            else {
                console.log(data);
            }
        });
        conn.release();
    });
}