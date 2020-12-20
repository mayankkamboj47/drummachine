/*
To do : 
1. Make the music stop as soon as next step is reached.  Done
2. Make 2 kinds of notes. Sustained ones, and simple ones. Done
3. Add support for custom machine width. Done 
4. Add support for custom tempo. 
5. See if you can add music keys of other octaves. 
6. Ability to export the matrix and import other matrices. Half Done. 
7. Bug : file performance is not good because of poor mp3 files and resetting without checking perhaps. 
8. Bug : Data is lost when matrix is resized. Add feature to matrix class to create a matrix of given width and height with same matrix. Done
9. Matrixes should be able to be created from an existing values key, with a custom width and height. 
10.Machine Display does not work with flexible matrix machine widths, since it's hardcoded 
    into the constructor. While this was good earlier, with the custom widths feature, this gets in
    our way. Fix it. After this, we could add the Load file feature into the matrix itself. 
*/

let keys = {
    'C': './music/c.wav',
    'C#': './music/cs.wav',
    'D': './music/d.wav',
    'D#': './music/eb.wav',
    'E': './music/e.wav',
    'F': './music/f.wav',
    'F#': './music/fs.wav',
    'G': './music/g.wav',
    'G#': './music/gs.wav',
    'A': './music/a.wav',
    'A#': './music/bb.wav',
    'B': './music/b.wav'
}
let musicfiles = Object.keys(keys).map(e => new Audio(keys[e]));
class Matrix {
    constructor(height, width, values) {
        this.rows = height;
        this.columns = width;
        this.values = values;
    }
    get(x, y) {
        return this.values[x + y * this.columns];
    }
    set(x, y, value) {
        let copy = this.values.slice();
        copy[x + y * this.columns] = value;
        return new Matrix(this.rows, this.columns, copy);
    }
    static empty(height, width) {
        return new Matrix(height, width, new Array(height * width).fill(0));
    }
    static resize(matrix,height,width){
        height = height ? height : matrix.rows;
        width = width ? width : matrix.width;
        let values = [];
        for(let i=0;i<height;i++){
            for(let j=0;j<width;j++){
                if(matrix.get(j,i)) values.push(matrix.get(j,i));
                else values.push(0);
            }
        }
        return new Matrix(height,width,values); 
    }
}
class MusicMachine {
    constructor(width) {
        this.playing = false;
        this.matrix = Matrix.empty(musicfiles.length, width);
        this.position = 0;
    }
    next() {
        if (this.playing) {
            for (let [index, file] of musicfiles.entries()) {
                let v;
                if (v = this.matrix.get(this.position, index)) {
                    if (v == 1) {
                        file.load();
                        file.play();
                    }
                } else {
                    //see if you can check whether a file is actually playing before loading it
                    file.load();
                }
            }
            this.position = (this.position + 1) % this.matrix.columns;
        }
    }
    static from(machine) {
        let width = machine.matrix.columns;
        let m = new MusicMachine(width);
        m.playing = machine.playing;
        m.matrix = machine.matrix;
        m.position = machine.position;
        m.timer = machine.timer ? machine.timer : null;
        return m;
    }
}
MusicMachine.prototype.types = 3; //total different kinds of values our grid can take
//see if this is even needed,that is, whether you wil ever change this number. 
function elt(name, attrs = {}, ...elements) {
    let element = document.createElement(name);
    for (let attr of Object.keys(attrs)) {
        element.setAttribute(attr, attrs[attr]);
    }
    for (let e of elements) {
        if (typeof e == 'string')
            element.appendChild(document.createTextNode(e));
        else
            element.appendChild(e);
    }
    return element;
}
class MachineDisplay {
    constructor(machine, parent) {
        this.machine = machine;
        this.machine.playing = true;
        this.boxes = machine.matrix.values.map((a, ind) => {
            let x = elt('div', { class: 'box' });
            let xpos = ind % machine.matrix.columns;
            let ypos = (ind - xpos) / machine.matrix.columns;
            x.addEventListener('click', (e) => {
                let v = (this.machine.matrix.get(xpos, ypos) + 1) % this.machine.types;
                let req = {
                    matrix: this.machine.matrix.set(xpos, ypos, v)
                };
                this.requestStateChange(req);
            });
            return x;
        });
        let boxrows = [];
        for (let i = 0; i < machine.matrix.rows; i++) {
            let row = elt('div', {class: 'boxrow'},
            ...this.boxes.slice(i * machine.matrix.columns, (i + 1) * machine.matrix.columns)
            );
            boxrows.push(row);
        }
        let boxcont = elt('div', {class: 'gridboxes'}, ...boxrows);
        boxcont.style.width = `${40*machine.matrix.columns}px`;
        let keyboxes = elt('div', {class: 'keys'},
            ...Object.keys(keys).map(a =>
            elt('div', {class: `key ${a.charAt(a.length-1)=='#'?"sharp":""}`
            }, a)));
        let pauseplay = elt('div', {
            class: 'pauseplay'
        });
        this.dom = elt('div', {
            class: 'machine'
        }, keyboxes, boxcont, pauseplay);
        this.dom.style.setProperty('--scale', '40px');
        parent.appendChild(this.dom);
        this.syncState(this.machine);
        pauseplay.addEventListener('click', (e) => {
            pauseplay.classList.toggle('playing');
            if (this.machine.timer) {
                clearInterval(this.machine.timer);
                this.machine.timer = null;
            } else {
                this.machine.timer = setInterval(() => {
                    let oldMachine = {
                        ...this.machine//we are keeping the properties of the old state, to draw only the changed parts of UI
                    };
                    this.machine.next();
                    this.syncState(this.machine, oldMachine);
                }, 300);
            }
        })
    }
    syncState(newState, oldState = null) {
        for (let x = 0; x < newState.matrix.columns; x++) {
            for (let y = 0; y < newState.matrix.rows; y++) {
                if (oldState) {
                    if (oldState.matrix.get(x, y) == newState.matrix.get(x, y) && newState.position != x && oldState.position != x) continue;
                }
                let classNames = ['box'];
                let v = newState.matrix.get(x, y);
                if (v) classNames.push('active');
                if (x == newState.position) classNames.push('playing');
                if (v == 2) classNames.push('sustain');
                this.boxes[x + y * newState.matrix.columns].setAttribute('class', classNames.join(' '));
            }
        }
    }
    requestStateChange(change) {
        let oldState = this.machine;
        let newState = Object.assign({}, oldState, change);
        this.syncState(newState, oldState);
        this.machine = MusicMachine.from(newState);
    }
    saveFile(){
        let a = elt('a',{
            download:`${prompt('Save as :')}.json`,
            href:'data:text/json,'+JSON.stringify(this.machine.matrix)
        });
        document.body.appendChild(a);
        a.click();
        a.remove();
    }
    loadFile(){
        return new Promise((resolve,reject)=>{
            let a = elt('input',{type:'file'});
            a.addEventListener('change',()=>{
                let file = a.files[0];
                let fl = new FileReader();
                fl.addEventListener('load',(e)=>resolve(JSON.parse(e.target.result)));
                fl.readAsText(file);
            });
            document.body.appendChild(a);
            a.click();
            a.remove();
        });
    }
}
class UserInterface {
    constructor() {
        this.machinemount = elt('div');
        this.dom = elt('div', {
            class: 'machinemount'
        });
        this.globals = {
            machine_width: 30
        };
        this.recreateMachine();
        this.render();
        document.body.prepend(this.dom);
    }
    render() {
        let i = elt('input', {
            type: 'number',
            value: this.globals.machine_width
        });
        i.addEventListener('change', (a) => this.width_change(a.target.value));
        let save = elt('input',{type:'button',value:'Save file'});
        save.addEventListener('click',()=>this.md.saveFile());
        let load = elt('input',{type:'button',value:'Load file'});
        load.addEventListener('click',()=>this.loadMusicfile());
        this.dom.prepend(i,save,load);
    }
    width_change(v) {
        v = parseInt(v);
        this.globals.machine_width = v;
        this.recreateMachine();
    }
    loadMusicfile(){
        let p = this.md.loadFile();
        p.then(matrix=>{
            matrix = new Matrix(matrix.rows,matrix.columns,matrix.values);
            this.md.machine.matrix = matrix;
            this.globals.machine_width = matrix.columns;
            this.recreateMachine();
        });
    }
    recreateMachine() {
        let newmachine = new MusicMachine(this.globals.machine_width);

        if (this.md) {
            this.md.dom.remove();
            clearInterval(this.md.machine.timer)
            newmachine.matrix = Matrix.resize(this.md.machine.matrix,12,this.globals.machine_width);
        }
        this.md = new MachineDisplay(newmachine, this.dom);
    }
}
let ui = new UserInterface();
//let machine = new MusicMachine(30);
//let md = new MachineDisplay(machine,document.body);
`   class MachineDOM {
        constructor(machine, parent) {
            this.machine = machine;
            let scale = 40;
            let grid = elt('div', {
                class: 'gridboxes'
            });
            for (let y = 0; y < machine.matrix.rows; y++) {
                for (let x = 0; x < machine.matrix.columns; x++) {
                    let box = 
                }
            }
            grid.style.setProperty('--scale', scale + 'px');
            grid.style.width = 
            this.grid = grid;
            this.dom = elt('div', {
                class: 'machine'
            }, this.grid);
            parent.appendChild(this.dom);
        }
    }
    function getClassName(x, y, machine) {
        let classNames = ['box'];
        let v = machine.matrix.get(x, y);
        if (v == 1) classNames.push('active');
        if (machine.position == x) classNames.push('playing');
        return classNames.join(' ');
    }
    function boxFrom(x, y, machine) {
        let v = machine.matrix.get(x, y)
        let box = elt('div', {
            class: getClassName(x,y,machine)
        });
        let renderbox = (function (x, y, machine) {
                let v = !machine.matrix.get(x, y);
                machine.matrix = machine.matrix.set(x, y, v);
                box.setAttribute('class', getClassName(x, y, machine))
        })
        box.addEventListener('click', (e)=>renderbox);
        return box;
    }
    let m = new MachineDOM(new MusicMachine(30), document.body);`;