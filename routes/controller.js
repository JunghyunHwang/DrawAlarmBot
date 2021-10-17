const express = require('express');
const router = express.Router();
const db = require('../config/db.js');

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

module.exports = router;