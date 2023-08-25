const loadingImg=`<img src="loading-gif.gif" class="loading">`;
var blobs=[];
var types;
addLoading(document.getElementById("app"));
window.onload = () => {
    fetch("types.json")
    .then(res => {if (res.ok) return res.json();})
    .then(data => {types=data;init()});
}

function init() {
    var app = document.getElementById("app");
    removeLoading(app);
    mark(0);
}

function addLoading(elem) {
    deactivate(elem);
    elem.innerHTML+=loadingImg;
}


function removeLoading(elem) {
    activate(elem);
    elem.querySelector(".loading").remove()
}

function activate(elem) {
    elem.style.pointerEvents="";
    elem.style.userSelect="";
    Array(...elem.children).forEach(child => {
        child.style.filter="";
    });
}

function deactivate(elem) {
    elem.style.pointerEvents="none";
    elem.style.userSelect="none";
    Array(...elem.children).forEach(child => {
        child.style.filter="blur(10px)";
    });
}

function apiupload(files,cb) {
    let data = new FormData();
    new Array(...files).forEach(file => {
        data.append(file.name,file);
    });
    console.log(data);
    fetch("/api/upload",{
        method:"POST",
        body:data
    })
    .then(res=>res.json())
    .then(data=>cb(data))
    .catch(err=>console.log(err));
}

function apireq(command,data,cb) {
    fetch(`/api/${command}`,{
        method:"POST",
        headers: {
            "Content-Type":"application/json"
        },
        body: JSON.stringify(data)
    })
    .then(res => res.json())
    .then(data => cb(data))
    .catch(err => {});
}
types
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
    close.innerHTML="CLOSE";
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

var form = {
    prompt: ({type,key,target}) => {
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
            }
        };
        button.onclick = e => {
            e.preventDefault();
            let inp = e.target.parentNode.querySelector("input");
            let data = type=="file"?inp.files[0]:inp.value;
            target.parentNode.replaceChild(form.valueHolder({data,type,key}),target);
            hidePopup();
            document.getElementById("submit").disabled=false;
        };
        openPopup([input,button],capitalize(key));
    },
    valueHolder: ({data,type,key}) => {
        let div=document.createElement("DIV");
        div.className="value";
        div.id=key;
        let label = document.createElement("H3");
        label.innerHTML=capitalize(key)+":";
        let value;
        if (type == "file") {
            if (key == "video") {
                value=document.createElement("VIDEO");
                value.src=URL.createObjectURL(data);value.controls=true;
            } else if (key == "thumbnail") {
                value=document.createElement("IMG");
                value.src=URL.createObjectURL(data);
            }
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
        }
        value.id="data";
        let button=document.createElement("BUTTON");
            button.className="change";
            button.innerHTML="change";
            button.onclick = e => {
                prompt({type,key,target:div});
            };
        div.appendChild(label);
        div.appendChild(value);
        div.appendChild(br);
        div.appendChild(button);
        return div;
    },
    arrayHolder: ({array,key}) => {
        let list=document.createElement("OL");
        array.forEach(elem => {
            let holder=form.valueHolder({data:elem,type:type(key),key});
            let li=document.createElement("LI");
            li.appendChild(holder);
            list.appendChild(li);
        });
    },
    objectHolder: ({object}) => {
        let obj=document.createElement("UL");
        Object.keys(object).forEach(key => {
            let holder=form.valueHolder({data:object[key],type:type(key),key});
            let li=document.createElement("LI");
            li.appendChild(holder);
            obj.appendChild(li);
        });
    },
    new: props => {
        let div = document.createElement("div");
        div.id="form";
        props.values.map(val => {
            let div = document.createElement("div");
            div.className=val.type;
            let value = form.valueHolder(val);
            div.appendChild(value);
            return div;
        }).forEach(childDiv => div.appendChild(childDiv));
        let button = document.createElement("BUTTON");
        button.id="submit";
        button.innerHTML="Submit";
        button.disabled=true;
        div.appendChild(button);
        return div;
    },
    remove: () => {
        let o = document.getElementById("form");
        if (o) o.remove();
        form.open=false;
    }
};

prompt=form.prompt;

var elements;

const markCb = data => {
    elements=data.elements;
    elements.forEach(element => {
    let ind=elements.indexOf(element);
    Object.keys(element).forEach(key => {
        if (type(key) == "file") {
            fetch(element[key])
            .then(res=>res.arrayBuffer())
            .then(buffer=>{
                let fileName=element[key].split("/").pop();
                element[key]=new File([buffer],fileName);
            });
        };
    });URL
    elements[ind]=element;
    });
    app.querySelector("#body").appendChild(list());
    elements.map(e => listElem(e)).forEach(e => {
        document.getElementById("list").appendChild(e);
    });
};

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
    marked=document.getElementById("navbar").children[i];
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
    cb({elements:[{"id":"1","title":"The First Lesson","thumbnail":"public/pictures/lesson1.png",
    "video":"public/video/lesson1.mp4",
    "questions":"public/questions/lesson1.json"},
    {"id":"2","title":"The First Lesson","thumbnail":"public/pictures/lesson1.png",
    "video":"public/video/lesson1.mp4",
    "questions":"public/questions/lesson1.json"}]});
};
function fetchContests(cb) {
    //apireq("get",{target:"contests"},cb);
    cb({elements:[
        {"id":"1","title":"The Unnamed Contest","thumbnail":"public/pictures/contest1.png","questions":"public/questions/contest1.json"}
    ]});
};