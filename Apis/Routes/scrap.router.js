const express = require('express');
const router = express.Router();
const {scrapController} = require('../Controllers/scrap.controller');
router.get('/',scrapController);

module.exports = {router};