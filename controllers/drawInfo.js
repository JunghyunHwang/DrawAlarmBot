const mysql = require("mysql");

const db = mysql.createConnection({
    host: process.env.DATABASE_HOST,
    user: process.env.DATABASE_USER,
    password: process.env.DATABASE_PASSWORD,
    database: process.env.DATABASE
});

exports.getDrawInfo = (req, res) => {
    const testSql = "SELECT * FROM draw_info"; //  rename

    db.query(testSql, (err, result) => {
        if (err) {
            console.log(err);
        }
        else if (result.length === 0) {
            return 0;
        }
        else {
            return result[0];
        }
    });
}