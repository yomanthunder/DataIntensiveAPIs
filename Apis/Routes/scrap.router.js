const express = require('express');
const router = express.Router();
const {writeDataToCSV} = require('../Controllers/scrap.controller');

router.get('/',writeDataToCSV);


module.exports = {router};