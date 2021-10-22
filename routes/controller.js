const express = require('express');
const router = express.Router();
const db = require('../config/db.js');
const logging = require('../log');

router.get('/', (req, res) => {
    res.send("Welcome to Draw_alarm");
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

router.get('/nike/:name', (req, res) => {
    const brandName = 'Nike';
    const sneakersName = req.params.name.replace(/_/g, ' ');
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

router.get('/nike/api/:date', (req, res) => {
    const brandName = 'Nike';
    const date = req.params.date;
    const getColumn = 'full_name, product_price, product_url, draw_date, draw_start_time, draw_end_time, img_url';
    const getSneakersDataSql = `SELECT ${getColumn} FROM draw_info WHERE brand_name=? AND draw_date=?`;
    const clientIp = req.ip;

    db.query(getSneakersDataSql, [brandName, date], (err, result) => {
        if (err) {
            console.log(err);
        }
        else {
            res.json(result);
            logging('api', `${clientIp} get api`);
        }
    });
});

module.exports = router;