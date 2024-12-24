const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
require('dotenv').config();

const app = express();
const Port = process.env.Port||3000;
const {router} = require('./Apis/Routes/scrap.router');

app.get('/',(req,res)=>{
    res.send(`hello world`);
});

app.use('/scrap', router);
console.log('HELLO');
app.listen(Port,()=>{
    console.log(`Running on port ${Port}`);
})