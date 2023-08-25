const port=5500;
const submissionsFile = "./submissions.json";
var submissions = {
    get: ({type,id,user}) => {
        var data=JSON.parse(fs.readFileSync(submissionsFile,"utf-8"))[type];
        if (data) {
            var users=data[id];
            if (users) {
                return users[user]
            } else {
                return false;
            }
        } else {
            return false
        };
    },
    set: ({type,id,user},answers) => {
        var data=JSON.parse(fs.readFileSync(submissionsFile,"utf-8"));
        if (data[type]) {
            var users=data[type][id];
            if (users) {
                if (users[user]) {
                    return -1;
                } else {
                    data[type][id][user]=answers;
                    
                }
            } else {
                return false;
            }
        } else {
            return false
        };
        fs.writeFileSync(submissionsFile,JSON.stringify(data));
        return 1;
    }
}

const fs = require("fs");
const express = require("express");
const app=express();
const bp=require("body-parser");
const admin = require("./admin.js");
app.use(bp.json());
app.use(bp.urlencoded({extended:true}));
app.use(express.static("./site/public"));
app.get("/*",(req,res) => {
    res.redirect("/app");
});
app.post("/submitquiz",(req,res) => {
    var data=req.body;
    var ret=submissions.set({type:data.type,id:data.id,user:data.user},data.answers);
    if (ret == -1) {
        res.send(JSON.stringify({success:false,errorCode:1}))
    } else if (!ret) {
        res.send(JSON.stringify({success:false,errorCode:0}));
    } else {
        res.send(JSON.stringify({success:true}));
    };
});
app.listen(port, () => {
    console.log("Running client page at http://127.0.0.1:"+port);
    console.log("Running admin panel at http://127.0.0.1:"+admin.port)
});