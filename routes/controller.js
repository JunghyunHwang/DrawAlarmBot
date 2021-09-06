const express = require('express');
const router = express.Router();
const dotenv = require('dotenv');
const mysql = require('mysql');
const kakaoLogin = require('../notification.js');
dotenv.config();

const db = mysql.createConnection({
    host: process.env.DATABASE_HOST,
    user: process.env.DATABASE_USER,
    password: process.env.DATABASE_PASSWORD,
    database: process.env.DATABASE
});

db.connect((error) => {
    if (error) { // re logging
        console.log(error);
    }
});

router.get('/nike', (req, res) => {
    const brandName = 'Nike';
    const getDrawDataSql = 'SELECT id, type_name, sneakers_name, img_url FROM draw_info WHERE brand_name=?';

    db.query(getDrawDataSql, [brandName], (err, result) => {
        if (err) {
            console.log(err); // re logging export
        }
        else {
            res.json({
                draw_data: result
            });
        }
    });
});

router.get('/nike/:id', (req, res) => {
    const brandName = 'Nike';
    const sneakersName = req.params.id.replace(/_/g, ' ');
    const getSneakersDataSql = 'SELECT id, type_name, sneakers_name, img_url FROM draw_info WHERE brand_name=? AND sneakers_name=?';
    db.query(getSneakersDataSql, [brandName, sneakersName], (err, result) => {
        if (err) {
            console.log(err); // re logging export
        }
        else {
            res.json({
                draw_data: result
            });
        }
    });
});

router.get('/oauth', (req, res) => {
    const token = req.query.code;
    console.log(token);
    res.json({
        value: token
    });
});

module.exports = router;