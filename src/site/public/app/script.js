var selection=document.getElementById("show");
var lessonList=document.getElementById("lesson-list");
var contestList=document.getElementById("contest-list")
var popup=document.getElementById("popup")
var app=document.getElementById("app");
function run() {
    HidePopup();

    selection.addEventListener("change",e => {
        var val = e.target.value;
        lessonList.update(val);
    });

    lessonList.update = type => {
        var cond;
        if (type=="0") {
            cond=()=>true;
        } else if (type=="1") {
            cond=lesson=>!lesson.finished;
        } else {
            cond=lesson=>lesson.finished;
        }
        lessons_filtered=lessons.filter(cond);
        lessonList.innerHTML = "";
        if (lessons_filtered.length == 0) {
            lessonList.innerHTML="No lessons.";
        } else {
            lessons_filtered.forEach(lesson => {
                
                lessonList.innerHTML+=LessonPreview(lesson)
            });
        }
    }
    lessonList.update(selection.value);
    contests.forEach(contest => {
        contestList.innerHTML+=ContestPreview(contest);
    })
}

function LessonPreview(props) {
    return `
    <div class="pre" onclick="openLesson(${props.id})">
        <img class="thumbnail" src="${props.thumbnail}">
        <span class="video-length">${props.video.length}</span>
        <a class="title">${props.title}</a>
    </div>
    `;
}

function ContestPreview(props) {
    return `
    <div class="pre" onclick="openContest(${props.id})">
        <img class="video-thumbnail" src="${props.thumbnail}">
        <a class="title">${props.title}</a>
    </div>
    `;
}

function Lesson(props) {
    return `
        <button id="close">Close</button>
        <h1>${props.title}</h1>
        <video controls id="lesson-video" src="${props.video.link}"></video>
        <h1>Quiz</h1>
        <div id="question-box">
            <button id="btn1">previous</button>
            <button id="btn2">next</button>
            <div id="question"><p>Loading Quiz...</p></div>
            <button disabled id="submit">Submit</button>
            <p id="info">Answer all questions to submit.</p>
        </div>
    `;
}
function Contest(props) {
    return `
    <button id="close">Close</button>
    <h1>Contest</h1>
    <div id="question-box">
        <button id="btn1">previous</button>
        <button id="btn2">next</button>
        <div id="question"><p>Loading Quiz...</p></div>
        <button disabled id="submit">Submit</button>
    </div>
    `;
}

function Option(props,checked) {
    return `
    <input type="radio" id="${props.id}" name="selection" ${checked?"checked":""}>
    <label for="${props.id}">${props.body}</label>
    `
}

function Question(props,sid,qid) {
    return `
    <h3>Question #${qid}</h3>
    <p class="question">${props.quest}</p>
    ${props.options.map(e => {
        return Option(e,props.options.indexOf(e)==sid);
    }).join("<br>")}
    `;
}
function ShowPopup() {
    popup.style.backgroundColor="white";
    popup.style.border="1px solid black";
    popup.style.pointerEvents = "auto";
    app.style.filter="blur(5px)";
    app.style.pointerEvents = "none";
}
function HidePopup() {
    popup.style.border="none";
    popup.style.backgroundColor="transparent";
    popup.style.pointerEvents = "none";
    app.style.filter="";
    app.style.pointerEvents = "auto";
}
function fetchQuiz(address,cb) {
    fetch(address)
    .then(res => res.json())
    .then(json => cb(json))
    .catch(err => cb(err));
}
function submitAnswers({type,id},answers,cb) {
    fetch("/submitquiz",{
        method:"POST",
        headers: {
            "Content-Type":"application/json"
        },
        body: JSON.stringify({answers,type,id})
    })
    .then(res => res.json())
    .then(data => cb(data))
    .catch(err => cb(err));
}
function openLesson(lessonid) {
    var lesson;
    var quiz = [];
    var answers;
    lessons.forEach(elem => {
        if (elem.id == lessonid) {
            lesson=elem;
        };
    });
    popup.innerHTML=Lesson(lesson);
    ShowPopup();
    var info=document.getElementById("info");
    var questionDiv=document.getElementById("question");
    var close = document.getElementById("close");
    var btn1=document.getElementById("btn1");
    var btn2=document.getElementById("btn2");
    var submit = document.getElementById("submit");
    var qid=0
    close.onclick = () => {
        popup.innerHTML="";
        HidePopup();
    };
    btn1.onclick = () => {
        if (qid > 0) {
            qid-=1;
            questionDiv.innerHTML=Question(quiz[qid],answers[qid],qid);
        }
    };
    btn2.onclick = () => {
        if (qid < quiz.length-1) {
            qid+=1;
            questionDiv.innerHTML=Question(quiz[qid],answers[qid],qid);
        }
    };
    submit.onclick = e => {
        e.target.innerHTML="Submitting...";
        e.target.disabled=true;
        submitAnswers({type:"lesson",id:lesson.id},answers,res => {
            if (res.success) {
                if (!res.all_correct) {
                    info.innerHTML="You have wrong answers, please try again."
                }
                else {
                    info.innerHTML="You answered all questions correctly."
                }
            } else if (res.errorCode==0) {
                info.innerHTML="Your answers could not be submitted. Please try again."
            } else if (res.errorCode==1) {
                info.innerHTML="You have already submitted your correct answers."
            }
            e.target.disabled=false;
            e.target.innerHTML="Submit";
        });
    };
    fetchQuiz(lesson.questions, q => {
        if (Array.isArray(q)) {
            quiz=q;
            answers=Array(quiz.length).fill(null);
            questionDiv.innerHTML=Question(quiz[qid],answers[qid],qid);
        } else {
            questionDiv.querySelector("p")
            .innerHTML=`
            <span style="color:red">
            An error occured while loading quiz.
            </span>`
            console.error(q)
        };
    });
    questionDiv.addEventListener("change",e => {
        if (e.target.type == "radio") {
           answers[qid]=e.target.id; 
        }
        if (!answers.includes(null)) {
            submit.disabled=false;
        }
    });
}
function openContest(contestid) {
    var contest;
    var quiz=[];
    var qid=0;
    contests.forEach(c => {
        if (c.id == contestid) {
            contest=c;
        }
    });
    popup.innerHTML=Contest(contest);
    ShowPopup();
    var close = document.getElementById("close");
    var btn1=document.getElementById("btn1");
    var btn2=document.getElementById("btn2");
    var questionDiv=document.getElementById("question");
    close.onclick = () => {
        popup.innerHTML="";
        HidePopup();
    };
    btn1.onclick = () => {
        if (qid > 0) {
            qid-=1;
            questionDiv.innerHTML=Question(quiz[qid],answers[qid])
        }
    };
    btn2.onclick = () => {
        if (qid < quiz.length-1) {
            qid+=1;
            questionDiv.innerHTML=Question(quiz[qid],answers[qid])
        }
    };
    submit.onclick = e => {
        e.target.innerHTML="Submitting...";
        e.target.disabled=true;
        submitAnswers({type:"contest",id:contest.id},answers,res => {
            if (res.success) {
                info.innerHTML="You answered all questions correctly."
            } else if (res.errorCode==0) {
                info.innerHTML="Your answers could not be submitted. Please try again."
            } else if (res.errorCode==1) {
                info.innerHTML="You have already submitted your answers."
            }
            e.target.disabled=false;
            e.target.innerHTML="Submit";
        });
    }
    fetchQuiz(contest.questions, q => {
        if (Array.isArray(q)) {
            quiz=q;
            answers=Array(quiz.length).fill(null);
            questionDiv.innerHTML=Question(quiz[qid],answers[qid]);
        }
        else {
            questionDiv.querySelector("p")
            .innerHTML=`
            <span style="color:red">
            An error occured while loading quiz.
            </span>`;
            console.error(q);
        };
    });
    questionDiv.addEventListener("change",e => {
        if (e.target.type == "radio") {
           answers[qid]=e.target.id; 
        };
        if (!answers.includes(null)) {
            submit.disabled=false;
        };
    });
};