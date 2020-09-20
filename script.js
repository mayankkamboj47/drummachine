    let musicfiles = ['./music/a.wav','./music/b.wav'].map(url=>new Audio(url));
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
            if(this.playing&&this.position<this.matrix.columns){
                for(let [index,file] of musicfiles.entries()){
                    if(this.matrix.get(this.position,index)){
                        file.play();
                        console.log('playing at',index)
                    }
                }
                this.position++;
            }
            else if(this.position>=this.matrix.columns){
                this.position=0;
                this.next();
            }
        }
    }
    let test = new MusicMachine(5);
    test.playing = true;
    test.matrix.set(0,0,1);
    test.matrix.set(0,1,1);
    test.matrix.set(1,1,1);
    test.matrix.set(2,0,1);
    setInterval(()=>test.next(),500);