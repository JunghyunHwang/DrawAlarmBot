const express = require("express");
const router = express.Router();
const dataController = require("../controllers/drawInfo");

router.get('/api/get/draw_info', dataController.getDrawInfo);

module.exports = router;
