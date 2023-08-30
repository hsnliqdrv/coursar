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

var marked;

function listElem(props) {
    let div = document.createElement("DIV");
    div.className="elem";
    div.id=props.id;
    div.addEventListener("click",e => {
        let elem=e.target;
        if (elem.id == selectedElemId) {
            unselect(elem);
        } else {
            if (selectedElemId != null)  {
                unselect(document.getElementById("list").children[selectedElemId]);
            };
            select(elem);
            selectedElemId=elem.id;
        };
    });
    let span=document.createElement("SPAN");
    span.className="title";
    span.innerHTML=props.name || props.title;
    div.appendChild(span);
    return div;
};

function list() {
    let div=document.createElement("div");
    div.id="list";
    let h2=document.createElement("H2");
    h2.innerHTML="Elements";
    div.appendChild(h2);
    return div;
};

function openPopup(children,title="Pop Up") {
    let close=document.createElement("BUTTON");
    close.className="close";
    close.onclick=() => {
        hidePopup();
    }
    let h3 = document.createElement("H3");
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

const arrayKeys = {
    "questions":"question",
    "options":"option"
};

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

function undoButton() {
    let undo = document.createElement("BUTTON");
    undo.className="undo";
    undo.onclick = e => {
        let par=e.target.parentNode;
        let prev=par.history[par.history.length-2];
        par.textContent="";
        par.appendChild(form.holder(prev,par.path));
    };
};

var form = {
    prompt: ({type,path,key,target},title) => {
        let input=document.createElement("input"),
            button=document.createElement("button");
        button.innerHTML="Submit";
        button.type="submit";
        input.type=type;
        input.required=true;
        if (type == "file") {
            if (key == "thumbnail") {
                input.accept="image/*";
            } else if (key == "video") {
                input.accept="video/*";
            };
        } else if (type == "text") {
            if (key=="mail") {
                input.type="email";
            };
        };
        button.onclick = e => {
            e.preventDefault();
            let inp = e.target.parentNode.querySelector("input");
            let data = type=="file"?inp.files[0]:inp.value;

            let par = target.querySelector("#data");
            par.parentNode.replaceChild(form.valueElem({data,type,key}),par);

            target.history.push(data);

            form.modified=nestedSet(form.modified,path,data);

            document.getElementById("submit").disabled=false;
            target.querySelector(".undo").disabled=false;
            hidePopup();
        };
        openPopup([input,button],capitalize(title));
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
                    e.target.disabled=true;
                };
            };
            undo.disabled=true;
        let change=document.createElement("BUTTON");
            change.className="change";
            change.onclick = e => {
                prompt({type,path,key,target:e.target.parentNode},key);
            };
        return [value,change,undo];
    },
    arrayHolder: ({array,key},arrayKey,path) => {
        let list=document.createElement("OL");
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
    objectHolder: ({object},objectKey,path) => {
        //console.log(path);
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
        label.innerHTML=capitalize(val.key)+":";

        let div = document.createElement("div");
        let value;
        if (val.data instanceof Array) {
            value=form.arrayHolder({array:val.data,key:arrayKeys[val.key],index:val.index},val.key,path);
            div.className="array";
        } else if (val.data instanceof Object && !(val.data instanceof File)) {
            value=form.objectHolder({object:val.data,index:val.index},val.key,path);
            div.className="object";
        } else {
            value = form.valueHolder(val,path);
            div.history = [val.data];
            div.className=val.type;
        };
        label.innerHTML=capitalize(val.key)+(index?" "+index:"")+":";
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
            apireq("set",{target:{
                type:marked.innerHTML.toLowerCase(),id:selectedElemId
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
                value=document.createElement("VIDEO");
                value.src=URL.createObjectURL(data);value.controls=true;
            } else if (key == "thumbnail") {
                value=document.createElement("IMG");
                value.src=URL.createObjectURL(data);
            };
            blobs.push(value.src);
        } else if (type == "text") {
            value=document.createElement("SPAN");
            value.innerHTML=data;
        } else if (type == "number") {
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
        load(fileUrls,(id,buffer)=>{
            let key = fileKeys[id];
            let fileName=element[key].split("/").pop();
            element[key]=new File([buffer],fileName);
            if (id == fileKeys.length-1 && elements.indexOf(element) == elements.length-1) {
                removeLoading(app);
            };
        });
        elements[ind]=element;
    });
    app.querySelector("#body").appendChild(list());
    elements.map(e => listElem(e)).forEach(e => {
        document.getElementById("list").appendChild(e);
    });
};

function load(files,perCb) {
    files.forEach(file => {
        fetch(file)
        .then(res=>res.arrayBuffer())
        .then(data=>perCb(files.indexOf(file),data));
    });
}
var marked;
function mark(i) {
    if (marked) {
        unmark();
    };
    if (i == 0) {
        fetchLessons(markCb);
    } else if (i == 1) {
        fetchContests(markCb);
    } else {
        fetchUsers(markCb);
    }
    marked=app.querySelector("#navbar").children[i];
    marked.disabled=true;
};

function unmark() {
    if (selectedElemId)
        unselect(document.getElementById("list").children[selectedElemId])
    document.getElementById("list").remove();
    blobs.forEach(blobURL => {
        URL.revokeObjectURL(blobURL);
    });
    blobs=[];
    form.remove();
    marked.disabled=false;
    marked=null;
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
        if (form.open) return;
        let obj = elements.filter(e=> e.id==selectedElem.id)[0]
        form.modified=obj;
        app.querySelector("#body").appendChild(form.new({
            values:Object.keys(obj).slice(1).map(key => {
                return {
                    data:obj[key],
                    type:type(key),
                    key
                };
            })
        }));
        form.open=true;
    });
    return button;
}

function unselect(elem) {
    elem.style.backgroundColor="";
    elem.querySelector(".info").remove();
    form.remove();
    selectedElemId=null;
};

function select(elem) {
    elem.style.backgroundColor="gray";
    elem.appendChild(infoBtn());
    selectedElem=elem;
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
        {"id":"1","title":"The Unnamed Contest","thumbnail":"public/pictures/contest1.png","questions":"public/questions/contest1.json"}
    ]});
};
