var blobs=[];
var types;
var app;

function loadingImg() {
    let img=document.createElement("IMG");
    img.src="loading-gif.gif";
    img.className="loading";
    return img;
};

window.onload = () => {
    app=document.getElementById("app");
    addLoading(app);
    let formFiles=Object.values(form.defaults.file);
    let formKeys=Object.keys(form.defaults.file);
    let preload=["types.json",...formFiles];
    load(preload,(id,data,isFinal) => {
        let reader=new FileReader();
        let filename=preload[id];
        let file=new File([data],filename);
        reader.readAsText(file);
        reader.addEventListener("load",() => {
            if (id == 0) {
                types=JSON.parse(reader.result);
            } else {
                form.defaults.file[formKeys[formFiles.indexOf(filename)]]=file;
            };
            if (isFinal) {
                init();
            };
        },false);
    });
    fetch("types.json")
    .then(res => {if (res.ok) return res.json();})
    .then(data => {types=data;init()});
};

function init() {
    removeLoading(app);
    mark(0);
};

function addLoading(elem) {
    deactivate(elem);
    elem.appendChild(loadingImg());
};

function removeLoading(elem) {
    activate(elem);
    elem.querySelector(".loading").remove();
};

function activate(elem) {
    elem.style.pointerEvents="";
    elem.style.userSelect="";
    Array(...elem.children).forEach(child => {
        child.style.filter="";
    });
};

function deactivate(elem) {
    elem.style.pointerEvents="none";
    elem.style.userSelect="none";
    Array(...elem.children).forEach(child => {
        child.style.filter="blur(10px)";
    });
};

function apireq(command,data,cb) {
    let body=new FormData();
    Object.keys(data).forEach(key => {
        body.append(key,data[key])
    });
    fetch(`/api/${command}`,{
        method:"POST",body
    })
    .then(res => res.json())
    .then(data => cb(data))
    .catch(err => cb({success:false,errorCode:0}));
};

var sections = new Array(...document.getElementById("navbar")
                .children).map(e => e.innerHTML);

var markedId;

function listElem(title,id) {
    let div = document.createElement("DIV");
    div.className="elem";
    div.id=id;
    div.addEventListener("click",e => {
        let elem=e.target;
        if (elem.id == selectedElemId) {
            unselect(elem);
        } else {
            if (selectedElemId != null)  {
                unselect(document.getElementById("list").querySelectorAll(".elem")[selectedElemId]);
            };
            select(elem);
        };
    });
    let span=document.createElement("SPAN");
    span.className="title";
    span.innerHTML=title;
    div.appendChild(span);
    return div;
};

function list() {
    let div=document.createElement("div");
    div.id="list";
    let h2=document.createElement("H2");
    h2.innerHTML="Elements";
    let add = document.createElement("BUTTON");
    add.id="add";
    add.onclick = e => {
        let obj={};
        form.keys[markedId].forEach(key=>obj[key]=undefined);
        let elem = listElem("[empty]",elements.length);
        let list=document.getElementById("list");
        list.appendChild(elem);
        elem.classList.add("empty");
        if (selectedElemId)
            unselect(list.querySelectorAll(".elem")[selectedElemId]);
        select(elem);
        elements.push(obj);
        elem.querySelector(".info").click();
    };
    h2.appendChild(add);
    div.appendChild(h2);
    return div;
};

function openPopup(children,title="Pop Up") {
    let close=document.createElement("BUTTON");
    close.className="close";
    close.onclick=() => {
        hidePopup();
    }
    let h3 = document.createElement("H2");
    h3.innerHTML=title;
    let div = document.createElement("div");
    div.id="popup";
    div.appendChild(close);
    div.appendChild(h3);
    children.forEach(child => div.appendChild(child));
    document.body.appendChild(div);
    deactivate(app);
}

function hidePopup() {
    document.getElementById("popup").remove();
    activate(app);
}

var formValueHolder;

function capitalize(s) {
    return s[0].toUpperCase()+s.slice(1);
}

const br=document.createElement("BR");

const errorDesc = {
    0:"Cannot connect to the server"
};

function showError(code) {
    let desc=errorDesc[code];
    if (!desc) {
        desc="Unknown error";
    }
    let dt=document.createElement("H4");
    dt.innerHTML="Description:";
    let dp=document.createElement("P");
    dp.style.color="red";
    dp.innerHTML=desc;
    openPopup([dt,dp],"Error");
};

function expandBtn() {
    let expand=document.createElement("BUTTON");
    expand.className="expand";
    expand.style.backgroundImage=`url("expand_btn.png")`;
    expand.onclick = e => {
        let expable=e.target.parentNode.nextSibling;
        let expanded=expable.style.display=="";
        if (expanded) {
            expable.style.display="none";
            expand.style.backgroundImage=`url("expand_btn.png")`;
        } else {
            expable.style.display="";
            expand.style.backgroundImage=`url("collapse_btn.png")`;
        };
    };
    return expand;
}

const arrayKeys = {
    "questions":"question",
    "options":"option",
    "finishedLessons":"lesson",
    "takenContests":"contest"
};

const objectKeys = {
    "question":["quest","options"],
};

var form = {
    keys: [
        ["title", "thumbnail", "video", "questions" ],
        ["title", "thumbnail", "questions" ],
        ["name", "mail", "points", "finishedLessons", "takenContests" ]
    ],
    defaults: {
        "number":"0",
        "text":"Enter text",
        "file":{
            "image":"blank.png",
            "video":"blank.mp4"
        }
    },
    prompt: ({type,path,key,target},title) => {
        let input=document.createElement("input"),
            button=document.createElement("button");
        
        button.innerHTML="Submit";
        button.type="submit";
        input.type=type;
        if (type == "file") {
            if (key == "thumbnail") {
                input.accept="image/*";
            } else if (key == "video") {
                input.accept="video/*";
            };
        } else if (type == "text") {
            input=document.createElement("textarea");
        };
        input.id="input";
        button.onclick = e => {
            e.preventDefault();
            let inp = e.target.parentNode.querySelector("#input");
            let data = type=="file"?inp.files[0]:inp.value;

            let par = target.querySelector("#data");
            par.parentNode.replaceChild(form.valueElem({data,type,key}),par);

            target.history.push(data);

            form.modified=nestedSet(form.modified,path,data);

            document.getElementById("submit").disabled=false;
            target.querySelector(".undo").style.display="";
            hidePopup();
        };
        openPopup([input,br,button],capitalize(title));
    },
    valueHolder: ({data,type,key},path) => {
        let value=form.valueElem({data,type,key});
        let undo = document.createElement("BUTTON");
            undo.className="undo";
            undo.onclick = e => {
                let par=e.target.parentNode;
                let len=par.history.length;
                let prev=par.history[len-2];
                par.replaceChild(form.valueElem({data:prev,type,key}),
                    par.querySelector("#data"));
                form.modified=nestedSet(form.modified,path,prev);
                par.history=par.history.slice(0,len-1);
                if (len == 2) {
                    undo.style.display="none";
                };
            };
            undo.style.display="none";
        let change=document.createElement("BUTTON");
            change.className="change";
            change.onclick = e => {
                prompt({type,path,key,target:e.target.parentNode},key);
            };
        return [value,change,undo];
    },
    arrayHolder: ({array,key},path) => {
        let list=document.createElement("OL");
        if (!array) array=[];
        array.forEach(elem => {
            let ind=array.indexOf(elem).toString();
            let childPath=[...path,ind];
            let holder=form.holder({data:elem,type:type(key),key},childPath);
            let li=document.createElement("LI");
            li.appendChild(holder);
            list.appendChild(li);
        });
        return [list];
    },
    objectHolder: ({object},path) => {
        let obj=document.createElement("UL");
        Object.keys(object).forEach(key => {
            let childPath = [...path,key];
            let holder=form.holder({data:object[key],type:type(key),key},childPath);
            let li=document.createElement("LI");
            li.appendChild(holder);
            obj.appendChild(li);
        });
        return [obj];
    },
    holder: (val,path) => {
        let index=isNaN(path[path.length-1])?undefined:path[path.length-1];
        let indent=path.length;
        
        let label = document.createElement("H"+(indent<6?indent:6));
        label.innerHTML=capitalize(val.key)+(index?" "+index:"")+":";

        let div = document.createElement("div");
        let value;
        if (Object.keys(arrayKeys).includes(val.key)) {
            value=form.arrayHolder({array:val.data,key:arrayKeys[val.key],index:val.index},path);
            value[0].style.display="none";
            label.appendChild(expandBtn());
            div.className="array";
        } else if (Object.keys(objectKeys).includes(val.key)) {
            value=form.objectHolder({object:val.data,index:val.index},path);
            div.className="object";
        } else {
            value = form.valueHolder(val,path);
            div.history = [val.data];
            div.className=val.type;
        };
        div.appendChild(label);
        value.forEach(elem => div.appendChild(elem));
        return div;
    },
    new: props => {
        let div = document.createElement("div");
        div.id="form";
        props.values.map(val => form.holder(val,[val.key])).forEach(childDiv => div.appendChild(childDiv));
        let button = document.createElement("BUTTON");
        button.id="submit";
        button.innerHTML="Submit";
        button.disabled=true;
        button.onclick=() => {
            addLoading(document.getElementById("form"));
            let isNew=document.getElementById("list").querySelectorAll(".elem")[selectedElemId].classList.contains("empty");
            apireq("set",{target:{
                type:document.getElementById("navbar").children[markedId].innerHTML.toLowerCase(),
                id:isNew?undefined:selectedElemId
            },data},res => {
                if (res.success) {
                    elements[selectedElemId]=form.modified;
                } else {
                    showError(res.errorCode);
                };
                removeLoading(document.getElementById("form"));
            });
        };
        div.appendChild(button);
        return div;
    },
    remove: () => {
        let o = document.getElementById("form");
        if (o) o.remove();
        form.open=false;
        form.modified=null;
    },
    valueElem: ({data,type,key}) => {
        let value;
        if (type == "file") {
            if (key == "video") {
                if (!data) data=form.defaults.file.video;
                value=document.createElement("VIDEO");
                value.src=URL.createObjectURL(data);value.controls=true;
            } else if (key == "thumbnail") {
                if (!data) data=form.defaults.file.image;
                value=document.createElement("IMG");
                value.src=URL.createObjectURL(data);
            };
            blobs.push(value.src);
        } else if (type == "text") {
            if (!data) data=form.defaults.text;
            value=document.createElement("SPAN");
            value.innerHTML=data.replaceAll("\n","<br>");
        } else if (type == "number") {
            if (!data) data=form.defaults.number;
            value=document.createElement("SPAN");
            value.innerHTML=data;
            
        } else {
            value=document.createElement("div");
            value.innerHTML=data;
        };
        value.id="data";
        return value;
    }
};


function nestedSet(obj,path,value) {
    
    if (path.length == 1) {
        obj[path[0]]=value;
    } else if (path.length > 1) {
        obj[path[0]]=nestedSet(obj[path[0]],path.slice(1),value);
    };
    return obj;
}

prompt=form.prompt;

var elements;

const markCb = data => {
    addLoading(app);
    elements=data.elements;
    elements.forEach(element => {
        let ind=elements.indexOf(element);
        let fileKeys=Object.keys(element).filter(k => type(k) == "file");
        let fileUrls=fileKeys.map(f => element[f]);
        if (fileUrls.length == 0) {
            removeLoading(app);
        };
        load(fileUrls,(id,data,isFinal)=>{
            let key = fileKeys[id];
            let fileName=element[key].split("/").pop();
            element[key]=new File([data],fileName);
            if (isFinal && elements.indexOf(element) == elements.length-1) {
                removeLoading(app);
            };
        });
        elements[ind]=element;
    });
    app.querySelector("#body").appendChild(list());
    elements.map(e => listElem(e.title||e.name,elements.indexOf(e))).forEach(e => {
        document.getElementById("list").appendChild(e);
    });
};

function load(files,perCb) {
    files.forEach(file => {
        fetch(file)
        .then(res=>res.arrayBuffer())
        .then(data=>perCb(files.indexOf(file),data,file==files[files.length-1]));
    });
}

var sections=document.getElementById("navbar").children;

function mark(i) {
    if (markedId!=null) {
        unmark();
    };
    if (i == 0) {
        fetchLessons(markCb);
    } else if (i == 1) {
        fetchContests(markCb);
    } else {
        fetchUsers(markCb);
    }
    markedId=i;
    sections[markedId].disabled=true;
};

function unmark() {
    if (selectedElemId)
        unselect(document.getElementById("list").querySelectorAll(".elem")[selectedElemId])
    document.getElementById("list").remove();
    blobs.forEach(blobURL => {
        URL.revokeObjectURL(blobURL);
    });
    blobs=[];
    form.remove();
    sections[markedId].disabled=false;
    markedId=null;
};

var selectedElemId=null;
var isContextOpen=false;

function type(_key) {
    for (var key of Object.keys(types)) {
        if (types[key].includes(_key)) {
            return key;
        }
    }
    return null;
}

function infoBtn() {
    let button = document.createElement("button");
    button.classList.add("info");
    button.addEventListener("click",e => {
        e.stopPropagation();
        if (form.open) form.remove();
        form.open=true;
        let obj = elements[selectedElemId];
        form.modified=obj;
        app.querySelector("#body").appendChild(form.new({
            values:Object.keys(obj).map(key => {
                return {
                    data:obj[key],
                    type:type(key),
                    key
                };
            })
        }));
    });
    return button;
};

function unselect(elem) {
    elem.style.backgroundColor="";
    elem.querySelector(".info").remove();
    form.remove();
    if (elem.classList.contains("empty")) {
        elem.remove();
        elements.pop();
    };
    selectedElemId=null;
};

function select(elem) {
    elem.style.backgroundColor="gray";
    elem.appendChild(infoBtn());
    selectedElemId=elem.id;
};

function fetchUsers(cb) {
    //apireq("get",{target:"users"},cb);
    cb({elements:[{"id":"1", "name":"First User","mail":"firstuser001@gmail.com","points":"0",
    "finishedLessons":[],"takenContests":[]
    }]});
};
function fetchLessons(cb) {
    //apireq("get",{target:"lessons"},cb);
    let obj=[{"quest":"What's your name?","options":["Jack","Jay","John"]},{"quest":"What's your name?","options":["Jack","Jay","John"]}];
    cb({elements:[{"id":"1","title":"The First Lesson","thumbnail":"public/pictures/lesson1.png",
    "video":"public/video/lesson1.mp4",
    "questions":obj},
    {"id":"2","title":"The First Lesson","thumbnail":"https://cdn.pixabay.com/photo/2015/12/01/20/28/road-1072821_960_720.jpg",
    "video":"public/video/lesson1.mp4",
    "questions":obj}]});
};
function fetchContests(cb) {
    //apireq("get",{target:"contests"},cb);
    cb({elements:[
        {"id":"1","title":"The Unnamed Contest","thumbnail":"public/pictures/contest1.png","questions":[{"quest":"",options:[]}]}
    ]});
};
