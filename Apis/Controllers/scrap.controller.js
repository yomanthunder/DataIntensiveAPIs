const express = require('express');

const scrapController = (req,res)=>{
    res.send(`Hello Scrap Controller here`);
}
module.exports = {
    scrapController,
}