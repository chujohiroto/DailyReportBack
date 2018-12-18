const express = require('express');
const bodyParser = require('body-parser');
const https = require('https');
require('dotenv').config();

//express系のSetting
var app = express();

// CORSを許可する
app.use(function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  next();
});

app.use(bodyParser.json());

app.get("/", function (req, res) {
    res.send("Root");
});

app.post("/sendMessage", function (req, res) {
    const member = req.body.member;
    const date = req.body.date;
    const done = req.body.done;
    const todo = req.body.todo;
    const trouble = req.body.trouble;
    var message = "<https://irossoftware.github.io/DailyReportFront/|" +"Daily Report:" + date + ">" + "\n```\n" + date + "\n#やったこと\n" + done + "\n#やること\n" + todo + "\n#困ったこと\n" + trouble + "\n```"
    var senddata = JSON.stringify(
        {
        "username":member,
        "text": message,
        "icon_emoji":":ghost:",
        });
    var options = {
        hostname: 'hooks.slack.com',
        port: 443,
        path: process.env.TOKEN,
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(senddata)
        }
    };

    //リクエスト
    var req = https.request(options, (res) =>{
      if(res.statusCode===200){
        console.log("OK:"+res.statusCode);
      }else{
        console.log("Status Error:"+res.statusCode);
      }
    });

    //そもそもなエラー時
    req.on('error',(e)=>{
        console.error(e);
    });

    //データ送信
    req.write(senddata);
    //終わり
    req.end();
    res.send(200);
});

const PORT = process.env.PORT;

app.listen(PORT, function () {
    console.log("Node.js is listening to PORT:" + PORT);
});
