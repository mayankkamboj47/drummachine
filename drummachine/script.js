    let keys = {
        'C':'./music/c.wav',
        'C#':'./music/cs.wav',
        'D':'./music/d.wav',
        'D#':'./music/eb.wav',
        'E':'./music/e.wav',
        'F':'./music/f.wav',
        'F#':'./music/fs.wav',
        'G':'./music/g.wav',
        'G#':'./music/gs.wav',
        'A':'./music/a.wav',
        'A#':'./music/bb.wav',
        'B':'./music/b.wav'
    }
    let musicfiles = Object.keys(keys).map(e=>new Audio(keys[e]));
    class Matrix{
        constructor(height,width){
            this.rows = height;
            this.columns = width;
            this.values =  new Array(this.rows*this.columns).fill(0);
        }
        get(x,y){
            return this.values[x+y*this.columns];
        }
        set(x,y,value){
            this.values[x+y*this.columns] = value;
        }
    }
    class MusicMachine{
        constructor(width){
            this.playing = false;
            this.matrix = new Matrix(musicfiles.length,width);
            this.position = 0;
        }
        next(){
            if(this.playing){
                console.log("on column", this.position)
                for(let [index,file] of musicfiles.entries()){
                    if(this.matrix.get(this.position,index)){
                        console.log("cell",index, "is active");
                        file.load();  //resets the file
                        file.play();
                    }
                }
                this.position++;
                this.position = this.position%this.matrix.columns;
            }
        }
        pause(){
            if(this.interval){
                clearInterval(this.interval);
            }
        }
    }
    function createTest(...numbers){
        let test = new MusicMachine(numbers.length);
        for(let [ind,i] of numbers.entries()){
            if(typeof i!=='number'){
                for(let val of i){
                    test.matrix.set(ind,val,1)
                }
            }
            else if(i!==-1) test.matrix.set(ind,i,1);
        }
        mountMachine(test,document.querySelector('#mountpoint'),play);
        function play(){
            return setInterval(()=>{
                mountMachine(test,document.querySelector('#mountpoint'),play);
                test.next();
            },500);
        }
    }
    function mountMachine(m,node,play){
        function elt(name,attrs={},...elements){
            let element = document.createElement(name);
            if(attrs.text) element.appendChild(document.createTextNode(attrs.text));
            for(let attr of Object.keys(attrs)){
                element.setAttribute(attr,attrs[attr]);
            }
            for(let e of elements){
                element.appendChild(e);
            }
            return element;
        }
        let btnscale = 40;
        let musiccols = elt('div',{class:'musiccols'});
        for(let keyname of Object.keys(keys)){
            musiccols.appendChild(elt('div',{class:'key',text:keyname,style:`width:${btnscale}px;height:${btnscale}px`}));
        }
        let buttons = elt('div',{class:'buttons'});
        let pause = elt('div',{class:`pauseplay ${(m.playing?"playing":"")}`});
        pause.addEventListener('click',()=>{
            pause.classList.toggle('playing')
            if(m.interval){
                debugger;
                clearInterval(m.interval);
                delete m.interval;
            } 
            else{
                m.playing = true;
                m.interval = play();
            }
        });
        let machine = elt('div',{class:'music-machine'},musiccols,buttons,pause);
        buttons.style.width = btnscale*m.matrix.columns+'px'
        for(let y=0;y<m.matrix.rows;y++){
            for(let x=0;x<m.matrix.columns;x++){
                let button = elt('div',{class:m.matrix.get(x,y)?x==m.position?'btn active playing':'btn active':x==m.position?'btn playing':'btn'});
                button.style.width = btnscale+'px';
                button.style.height = btnscale+'px';
                buttons.appendChild(button);
                button.addEventListener('click',()=>{
                    let v = m.matrix.get(x,y)
                    if(v==1){
                        m.matrix.set(x,y,0)
                    }
                    else{
                        m.matrix.set(x,y,1)
                    }
                    button.classList.toggle('active')
                });
            }
        }
        while(node.lastChild){node.removeChild(node.lastChild)}
        node.appendChild(machine)
    }
    createTest(0,0,2,-1,0,-1,5,-1,4,-1)