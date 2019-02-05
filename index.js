const express = require('express');
const bodyParser = require('body-parser');
const https = require('https');
require('dotenv').config();
const schedule = require("node-schedule");
const sqlite3 = require('sqlite3').verbose();
var db = new sqlite3.Database('test.sqlite');

db.serialize(function() {
  // テーブルがなければ作成
  db.run('CREATE TABLE IF NOT EXISTS DATA(member TEXT,date TEXT, done TEXT, todo TEXT, trouble TEXT)');
});

//express系のSetting
var app = express();

app.use((_,response,next)=>
{
    response.header("Access-Control-Allow-Origin", "*");
    next();
});

app.use(bodyParser.json());

app.get("/", function (req, res) {
    res.send("Welcome to DailyReport API");
});

app.post("/sendMessage", function (req, res) {
    const member = req.body.member;
    const date = req.body.date;
    const done = req.body.done;
    const todo = req.body.todo;
    const trouble = req.body.trouble;

    sendMessage(member,date,done,todo,trouble);
});

app.post("/saveMessage", function (req, res) {
    const member = req.body.member;
    const date = req.body.date;
    const done = req.body.done;
    const todo = req.body.todo;
    const trouble = req.body.trouble;

    if(member == "None"){
        res.send(505)
    }
    
    console.log("Save Message " + member + date);

    db.serialize(() => {  
        var stmt = db.prepare('DELETE FROM DATA where member == ?');
        stmt.run([member]);
        stmt.finalize();

        var stmt = db.prepare('INSERT INTO DATA VALUES (?,?,?,?,?)');
        stmt.run([member,date,done,todo,trouble]);
        stmt.finalize();
    });
    res.send(200)
});

function sendMessage(member,date,done,todo,trouble)
{
    console.log(date);
    var message = member + "\n<https://tea-app.jp/DailyReportFront/?date=" + date + "|" + date + ">" + "\n```\n" + date;
    
    if(done != undefined || done != "undefined" || done != ""){
        message += "\n\n#やったこと\n" + done;
    }
    if(todo != undefined || todo != "undefined" || done != ""){
        message += "\n\n#やること\n" + todo;
    }
    if(trouble != undefined || trouble != "undefined" || done != ""){
        message += "\n\n#困ったこと\n" + trouble;
    }
    
    message += "\n```";


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
}

const PORT = process.env.PORT;

app.listen(PORT, function () {
    console.log("Node.js is listening to PORT:" + PORT);
});

var dailyjob = schedule.scheduleJob({hour : 8 ,minute : 0
}, function () {
db.serialize(() => {
  db.each('SELECT * FROM DATA', (error, row) => {
    if(error) {
      console.error('Error!', error);
      return;
    }    
    sendMessage(row.member,row.date ,row.done ,row.todo, row.trouble);
        var stmt = db.prepare('DELETE FROM DATA where member == ?');
        stmt.run([row.member]);
        stmt.finalize();
  });
});
});

dailyjob.on("scheduled", function () {
  console.log(this.name + "の予定が登録されました");
});
dailyjob.on("run", function () {
  console.log(this.name + "の予定が実行されました");
});
dailyjob.on("canceled", function () {
  console.log(this.name + "の予定がキャンセルされました");
});
