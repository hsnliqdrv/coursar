const port=5501;

const functions=require("./functions.js");

const express = require("express");
const app = express();

const multer = require('multer');
const upload = multer();

const bp=require("body-parser");

const static="./site";

const uploadDir=static+"/upload";

app.use(express.static(static));
app.use(bp.json());
app.use(bp.urlencoded({extended:true}))

app.post('/api/:command', upload.any(),(req, res) => {
    var cmd=req.params.command;
    var body=req.body;
    var files=req.files;
    let resData = {};
    if (cmd == "get") {
        let ret;
        if (body.target.type=="lessons") {
            ret=functions.lessons.get(body.target.id);
        } else if (body.target.type=="contests") {
            ret=functions.contests.get(body.target.id);
        } else if (body.target.type=="users") {
            ret=functions.users.get(body.target.id);
        }
        if (ret) {
            ret.success=true;
            resData=ret;
        } else {
            resData={success:false}
        }
    } else if (cmd == "set") {
        let ret;
        if (body.target.type=="lessons") {
            ret=functions.lessons.set(body.target.id,body.data);
        } else if (body.target.type=="contests") {
            ret=functions.contests.set(body.target.id,body.data);
        } else if (body.target.type=="users") {
            ret=functions.users.set(body.target.id,body.data);
        }
        if (ret) {
            resData={success:true}
        } else {
            resData={success:false}
        }
    } else if (cmd == "upload") {
        files.forEach(file => {
            functions.save(uploadDir+"/"+file.originalname,file.buffer);
        });
        resData={
            success:true,
            createdFiles:files.map(i=>i.originalname)
        };
    };

    res.send(JSON.stringify(resData));
});

app.listen(port);
exports.port=port;
