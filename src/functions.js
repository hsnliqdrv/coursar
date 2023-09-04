const { getVideoDurationInSeconds } = require('get-video-duration');
const fs = require("fs");

exports.save = function(name,buffer) {
    fs.writeFileSync(name,buffer);
    return name;
}

function convertDurationToLength(duration) {
    let b=3600;
    let arr=[];
    for (var i = 0; i < 3; i++) {
        let c = ((duration-duration%b)/b).toString();
        duration=duration%b;
        let z = 2-c.length;
        arr.push(z>0?"0".repeat(z)+c:c)
        b /= 60;
    }
    return arr.join(":");
}
const public="./site/public"

const saveFileLessons="./site/public/lessons.json";
exports.lessons = {
    set: (id=-1,{title,video,image,questions}) => {
        let lsn=require(saveFileLessons);
        let data;
        if (id < 0) {
            id=lsn.length;
            let link=`/video/${video.originalName}`;
            save(public+link,video.buffer);
            getVideoDurationInSeconds(public+link)
            .then(d => {
                length=convertDurationToLength(d);
                
                let thumbnail=`/pictures/${image.originalName}`;
                save(public+thumbnail,image.buffer);

                let quiz=`/questions/q${id}.json`;
                save(public+quiz,JSON.stringify(questions));

                data = {id,title,video:{link,length},thumbnail,questions:quiz};
            });
            lsn.push(data);
            save(saveFileLessons,JSON.stringify(lsn))
        } else {
            let lesson;
            var index;
            for (let i = 0; i < lsn.length; i++) {
                if (lsn[i].id==id) {
                    lesson=lsn[i];
                    index=i;
                    break
                };
            };
            if (title) {
                lesson.title=title;
            };
            if (video) {
                save(public+lesson.video.link,video.buffer);
                getVideoDurationInSeconds(public+lesson.video.link)
                .then(d => {
                    lesson.video.length=convertDurationToLength(d);
                });
            };
            if (image) {
                save(public+lesson.video.link,image.buffer)
            };
            if (questions) {
                save(public+lesson.questions,JSON.stringify(questions));
            };
            lsn[index]=lesson;
            save(saveFileLessons,JSON.stringify(lsn));
        };
    },
    get: id => {
        let lsn=require(saveFileLessons);
        let lesson=lsn.filter(i => i.id==id)[0];
        if (lesson) {
            return {
                title:lesson.title,
                video:lesson.video.link,
                image:lesson.thumbnail,
                questions:lesson.questions
            };
        } else {
            return false;
        }
    }
};
const saveFileContests="./admin/public/contests.json";
exports.contests = {
    set: (id=-1,{title,image,questions}) => {
        let cnt=require(saveFileContests);
        let data;
        if (id < 0) {
            id=cnt.length;
            
            let thumbnail=`/pictures/${image.originalName}`;
            save(public+thumbnail,image.buffer);

            let quiz=`/questions/q${id}.json`;
            save(public+quiz,JSON.stringify(questions));

            data = {id,title,thumbnail,questions:quiz};

            cnt.push(data);
        } else {
            let contest;
            var index;
            for (let i = 0; i < lsn.length; i++) {
                if (cnt[i].id==id) {
                    contest=cnt[i];
                    index=i;
                    break
                };
            };
            if (title) {
                contest.title=title;
            };
            if (image) {
                save(public+contest.video.link,image.buffer)
            };
            if (questions) {
                save(public+contest.questions,JSON.stringify(questions));
            };
            cnt[index]=contest;
        };
        save(saveFileContests,JSON.stringify(cnt));
    },
    get: id => {
        let cnt=require(saveFileContests);
        let contest=cnt.filter(i => i.id==id)[0];
        if (contest) {
            return {
                title:contest.title,
                image:contest.thumbnail,
                questions:contest.questions
            };
        } else {
            return false;
        }
    }
};
const saveFileUsers="./admin/users.json";
exports.users = {
    get: (id=-1) => {
        let users=require(saveFileUsers);
        if (id==-1) {
            return users;
        } else {
            let user=users.filter(i => i.id == id);
            if (user.length==0) {
                return false;
            };
            return user;
        };
    },
    set: (id=-1,{name,mail,keyHash,points,finishedLessons,takenContests}) => { 
        let data;
        let users=require(saveFileUsers);
        if (id == -1) {
            id=users.length;
            data={name,mail,keyHash,points,finishedLessons,takenContests}
            users.push(data);
        } else {
            let index=users.find(i => i.id == id);
            let user=users[index];
            if (user) {
                if (name) {
                    user.name=name
                }
                if (mail) {
                    user.mail=mail
                }
                if (keyHash) {
                    user.keyHash=keyHash
                }
                if (points) {
                    user.points=points
                }
                if (finishedLessons) {
                    user.finishedLessons=finishedLessons
                }
                if (takenContests) {
                    user.takenContests=takenContests
                }
            } else {
                return false;
            }
            users[index]=user;
        }
        save(saveFileUsers,JSON.stringify(users));
    }
}
