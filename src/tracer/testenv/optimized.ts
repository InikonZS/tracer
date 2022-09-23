import Control from "../../common/control";
import { IVector, Vector } from '../../common/vector';
import { RenderTicker } from './ticker';
import { getMapFromImageData, getImageData, loadImage } from '../tracelib/imageDataTools';
import mapFile from './assets/map5.png';
import {findPath, indexate, tracePath} from '../tracelib/tracer';
import {getAreaFromPoint, getChunks, getIsolated, getIsolatedChunks, getAllConnections, getChunkTree, chunkIndexate, findChunkPath, IChunk, getLimitPathMap, dublicateChunkTree, updateChunkTree, getHash} from '../tracelib/getIsolated';
export class Canvas extends Control {
    private canvas: Control<HTMLCanvasElement>;
    public ctx: CanvasRenderingContext2D;
    private ticker = new RenderTicker();
    private onRender: (ctx: CanvasRenderingContext2D, delta: number) => void;
    public canvasBackLast: Array<Array<string>>;
    public canvasBack: Array<Array<string>>;
    onMove: (e:MouseEvent)=>void;
    onClick: (e:MouseEvent)=>void;

    constructor(parentNode: HTMLElement, onRender: (ctx: CanvasRenderingContext2D, delta: number) => void) {
        super(parentNode, 'div', 'canvas');
        this.onRender = onRender;

        this.canvas = new Control(this.node, 'canvas');
        this.canvas.node.width = 1200;
        this.canvas.node.height = 600;

        const mapSize = 512;
        this.canvasBackLast = new Array(mapSize).fill(0).map(it=> new Array(mapSize).fill(undefined));
        this.canvasBack = new Array(mapSize).fill(0).map(it=> new Array(mapSize).fill(0));

        const context = this.canvas.node.getContext('2d');
        if (context == null) {
            throw new Error('Canvas 2d context is not available.');
        }
        this.ctx = context;

        this.canvas.node.onmousemove = (e) => {
            this.onMove(e);
        }

        this.canvas.node.onclick = (e: MouseEvent) => {
            this.onClick(e);
        }

        this.canvas.node.oncontextmenu = (e) => {
            e.preventDefault();
        }
        this.canvas.node.onmousedown = (e: MouseEvent) => {

        }

        this.ticker.onTick.add((delta) => {
            this.render(delta);
        });
        this.ticker.startRender();

        window.addEventListener('resize', this.autoSize);
        this.autoSize();
    }

    render(delta: number) {
        const ctx = this.ctx;
        //ctx.fillStyle = "#000";
        //ctx.fillRect(0, 0, this.canvas.node.width, this.canvas.node.height);
        this.onRender(ctx, delta);
    }

    private autoSize = () => {
        this.canvas.node.width = this.node.clientWidth;
        this.canvas.node.height = this.node.clientHeight;
        this.render(0);
    }

    destroy(): void {
        window.removeEventListener('resize', this.autoSize);
        super.destroy();
    }
}

export class TestScene {
    private canvas: Canvas;
    private map: Array<Array<number>>;
    private path: Array<IVector>;
    private pathes: Array<Array<IVector>>;
    private startPoint = new Vector(10, 10);
    private endPoint = new Vector(85, 85);
    area: number[][];
    chunks: number[][][][];
    chunkPath: IChunk[];
    traceTreeInitial: Record<string, IChunk>;
    chunkPathes: Array<Array<IChunk>> =[];

    constructor(parentNode: HTMLElement) {
        this.canvas = new Canvas(parentNode, this.render);

        this.build();
    }

    async build() {

        showTime(fill1, [5000], 100, 'fill 1');
        showTime(fill2, [5000], 100, 'fill 2');
        showTime(fill1, [5000], 100, 'fill 1');
        showTime(fill2, [5000], 100, 'fill 2');
        showTime(fill1, [5000], 100, 'fill 1');
        showTime(fill2, [5000], 100, 'fill 2');

        const arr = fill2d1(100);

        showTime(iterate1, [arr], 1000, 'iterate 1');
        showTime(iterate1, [arr], 1000, 'iterate 1');
        showTime(iterate1, [arr], 1000, 'iterate 1');

        showTime(iterate2, [arr], 1000, 'iterate 2');
        showTime(iterate2, [arr], 1000, 'iterate 2');
        showTime(iterate2, [arr], 1000, 'iterate 2');

        showTime(iterate3, [arr], 1000, 'iterate 3');
        showTime(iterate3, [arr], 1000, 'iterate 3');
        showTime(iterate3, [arr], 1000, 'iterate 3');

        showTime(find, [data, data[data.length-1]], 1000, 'find');
        showTime(find, [data, data[data.length-1]], 1000, 'find');
        showTime(find, [data, data[data.length-1]], 1000, 'find');

        const indFind = indexateData(data);
        showTime(indFind, [data[data.length-1]], 1000, 'find i');
        showTime(indFind, [data[data.length-1]], 1000, 'find i');
        showTime(indFind, [data[data.length-1]], 1000, 'find i');

        const image = await loadImage(mapFile);
        const map = getMapFromImageData(getImageData(image));
       /* tracePath(map, this.startPoint, this.endPoint, (path)=>{
            console.log(path);
            this.path = path;
        });*/
        this.map = map;

        this.area = getIsolated(this.map);//getAreaFromPoint(this.map, this.startPoint, 1);
        //console.log(this.area);
        this.chunks = getIsolatedChunks(this.map)//getChunks(this.map);
        const connections = getAllConnections(this.chunks);
        //console.log(connections);
        this.traceTreeInitial = getChunkTree(this.chunks);

        const getHashByVector = (pos: Vector)=>{
            const size =this.chunks[0][0][0].length;
            const z = this.chunks[Math.floor(pos.y / size)][Math.floor(pos.x / size)][Math.floor(pos.y % size)][Math.floor(pos.x % size)];
            return getHash(Math.floor(pos.x / size), Math.floor(pos.y / size), z);//`${Math.floor(pos.x / size)}_${Math.floor(pos.y / size)}_${z}`
        }

        //chunkIndexate(traceTree, [getHashByVector(this.startPoint)], 0); 
        //console.log(traceTree);

        //this.chunkPath = findChunkPath(traceTree, getHashByVector(this.endPoint));
        //console.log(this.chunkPath);

        this.canvas.onClick = (e)=>{
            const vector = new Vector(Math.round(e.offsetX / 5), Math.round(e.offsetY / 5));
            this.startPoint = vector;
        }

        this.canvas.onMove = (e)=>{
            const verbose = false;
            const startTime = Date.now();
            const vector = new Vector(Math.round(e.offsetX / 5), Math.round(e.offsetY / 5));
            this.endPoint = vector;
            if (vector.y < map.length && vector.x < map[0].length && vector.x>=0 && vector.y>=0){
                
                //const traceTree = getChunkTree(this.chunks);
                const traceTree = dublicateChunkTree(this.traceTreeInitial)

                verbose && console.log('chunk tree ',Date.now()- startTime);
        
                chunkIndexate(traceTree, [getHashByVector(this.startPoint)], 0); 
                //console.log(traceTree);
                
                verbose && console.log('chunk index ',Date.now()- startTime);
    
                this.chunkPath = findChunkPath(traceTree, getHashByVector(this.endPoint)) || [];
                const start = getHashByVector(this.startPoint)
                if (start && traceTree[start]){
                this.chunkPath.push(traceTree[start])
                }
                verbose && console.log('chunk path ',Date.now()- startTime);
                const lm = getLimitPathMap(this.chunkPath, this.chunks, this.map) as Array<Array<number>>;//can be same access record<num, record<num, num>>
                //let lm = map.map(it=>it.map(jt=>jt==0?Number.MAX_SAFE_INTEGER:-1));
                verbose && console.log('limit map ',Date.now()- startTime);
                indexate(lm, [this.startPoint], 0);
                verbose && console.log('indexate ',Date.now()- startTime);
                this.path = findPath(lm, this.startPoint, this.endPoint);
                verbose && console.log('result path ',Date.now()- startTime);
               // console.log(this.path);

               const pathes = [
                    tracep1(this.startPoint.clone().add(new Vector(10, 10)), this.endPoint.clone().add(new Vector(10, 10)), this.traceTreeInitial, this.chunks, this.map),
                    tracep1(this.startPoint.clone().add(new Vector(10, 20)), this.endPoint.clone().add(new Vector(-10, 10)), this.traceTreeInitial, this.chunks, this.map),
                    tracep1(this.startPoint.clone().add(new Vector(10, 15)), this.endPoint.clone().add(new Vector(10, -10)), this.traceTreeInitial, this.chunks, this.map),
                    tracep1(this.startPoint.clone().add(new Vector(20, 10)), this.endPoint.clone().add(new Vector(20, 10)), this.traceTreeInitial, this.chunks, this.map),
                    tracep1(this.startPoint.clone().add(new Vector(20, 20)), this.endPoint.clone().add(new Vector(-20, 10)), this.traceTreeInitial, this.chunks, this.map),
                    tracep1(this.startPoint.clone().add(new Vector(20, 15)), this.endPoint.clone().add(new Vector(20, -10)), this.traceTreeInitial, this.chunks, this.map),
                    tracep1(this.startPoint.clone().add(new Vector(30, 10)), this.endPoint.clone().add(new Vector(10, 30)), this.traceTreeInitial, this.chunks, this.map),
                    tracep1(this.startPoint.clone().add(new Vector(40, 20)), this.endPoint.clone().add(new Vector(-10, 30)), this.traceTreeInitial, this.chunks, this.map),
                    tracep1(this.startPoint.clone().add(new Vector(40, 15)), this.endPoint.clone().add(new Vector(10, -30)), this.traceTreeInitial, this.chunks, this.map),
                ]
                this.pathes =[];
                this.chunkPathes = pathes.map(it=>it.ch);
                this.pathes = pathes.map(it=>it.ph);
            } else {
                this.chunkPath = [];
            }
            //console.log(this.chunkPath);
        }
    }

    render = (ctx: CanvasRenderingContext2D, delta:number)=>{
        if (!this.canvas) return;
        
        const tileSize = 5;
        const changed: {pos:Vector, val:number}[] = [];
        if (this.map){
            this.map.forEach((row, y)=>{
                row.forEach((cell, x)=>{
    
                    if (Math.random()<0.01){
                        //row[x] = 1;
                        const val = (Math.random() < 0.01 ? 1 : row[x]);
                        if (val != row[x]){
                            changed.push({pos: new Vector(x, y), val: val })
                        };
                    }
                    //ctx.fillStyle = ['#fff', '#ff0', '#f0f'][cell] || '#0ff';
                   // ctx.fillRect(x * tileSize, y * tileSize, tileSize, tileSize);
                })
            });
            //this.chunks = getIsolatedChunks(this.map)//getChunks(this.map);
            //const connections = getAllConnections(this.chunks);
            //console.log(connections);
            //this.traceTreeInitial = getChunkTree(this.chunks);
            updateChunkTree(this.map, this.chunks, this.traceTreeInitial, changed);
            this.canvas.onMove({offsetX: this.endPoint.x * tileSize, offsetY: this.endPoint.y * tileSize} as MouseEvent);
        }
       

        if (this.area){
            this.area.forEach((row, y)=>{
                //console.log(row[0])
                row.forEach((cell, x)=>{
                    if (cell != -1){
                       // ctx.fillStyle = ['#0909', '#ff09', '#f0f9'][-(cell + 2)] || '#0ff9';
                        //ctx.fillRect(x * tileSize, y * tileSize, tileSize, tileSize);
                    }
                })
            })
        }

        if (this.chunks){
            this.chunks.forEach((chunkRow, i)=>{
                chunkRow.forEach((chunk, j)=>{
                    chunk.forEach((row, y)=>{
                        //console.log(row[0])
                        row.forEach((cell, x)=>{
                            //if (cell != -1){
                                //if (this.canvas.canvasBack[(i * chunk.length + y)]){
                                    this.canvas.canvasBack[(i * chunk.length + y)][(j * row.length + x)] = ['#000','#090', '#ff0', '#f0f', '#574'][-(cell + 1)] || '#0ff';
                                //}// ctx.fillStyle = ['#0909', '#ff09', '#f0f9', '#5749'][-(cell + 2)] || '#0ff9';
                                //ctx.fillStyle = ['#0909', '#ff09', '#f0f9', '#0ff9', '#5749'][i % 5];
                                //ctx.fillRect((j * row.length + x) * tileSize, (i * chunk.length + y) * tileSize, tileSize, tileSize);
                            //}
                        })
                    })
                });
            });
        }

        

        if (this.chunkPath){
            this.chunkPath.forEach((chunk)=>{
                const pos = chunk.original.pos;
                //ctx.fillStyle = '#f009';
                const size = this.chunks[0][0][0].length;
                //ctx.fillRect(pos.x * tileSize * size, pos.y * tileSize * size, tileSize * size, tileSize * size);
            })
        }
        
        

        if (this.chunkPath){
            this.chunkPath.forEach((chunk)=>{
                const pos = chunk.original.pos;
                //ctx.fillStyle = '#f009';
                const size = this.chunks[0][0][0].length;
                this.chunks[pos.y][pos.x].forEach((row, y)=>row.forEach((cell, x)=>{
                    if (cell == chunk.original.i){
                        this.canvas.canvasBack[ (pos.y * size + y)][ (pos.x * size + x)] = '#f00';
                       // ctx.fillRect((pos.x * size + x) * tileSize, (pos.y * size + y) * tileSize, tileSize, tileSize);
                    }
                }))
                
            })
        }

        if (this.chunkPathes){
            this.chunkPathes.forEach(chunkPath=>{chunkPath.forEach((chunk)=>{
                const pos = chunk.original.pos;
                //ctx.fillStyle = '#f009';
                const size = this.chunks[0][0][0].length;
                this.chunks[pos.y][pos.x].forEach((row, y)=>row.forEach((cell, x)=>{
                    if (cell == chunk.original.i){
                        this.canvas.canvasBack[ (pos.y * size + y)][ (pos.x * size + x)] = '#f00';
                       // ctx.fillRect((pos.x * size + x) * tileSize, (pos.y * size + y) * tileSize, tileSize, tileSize);
                    }
                }))
                
            })});
        }
        
        if (this.path){
            this.path.forEach((pos)=>{
                //ctx.fillStyle = '#fffe';
                //ctx.fillRect(pos.x * tileSize, pos.y * tileSize, tileSize, tileSize);
                this.canvas.canvasBack[(pos.y)][(pos.x)] = '#fffe';
            })
        }

                
        if (this.pathes){
            this.pathes.forEach(path=>path.forEach((pos)=>{
                //ctx.fillStyle = '#fffe';
                //ctx.fillRect(pos.x * tileSize, pos.y * tileSize, tileSize, tileSize);
                this.canvas.canvasBack[(pos.y)][(pos.x)] = '#fffe';
            }));
        }


        if (this.canvas){
            this.canvas.canvasBack.forEach((row, y)=>{
                row.forEach((cell, x)=>{ 
                    if (this.canvas.canvasBackLast[y][x] !== this.canvas.canvasBack[y][x]){
                        ctx.fillStyle = this.canvas.canvasBack[y][x];
                        ctx.fillRect(x * tileSize, y * tileSize, tileSize, tileSize);
                    }
                })
            })
            this.canvas.canvasBackLast = this.canvas.canvasBack.map(it=>[...it]);
        }
        ctx.fillStyle = '#9f0';
        //ctx.fillRect(this.startPoint.x * tileSize, this.startPoint.y * tileSize, tileSize, tileSize);

        ctx.fillStyle = '#9f0';
        //ctx.fillRect(this.endPoint.x * tileSize, this.endPoint.y * tileSize, tileSize, tileSize);
    }
}


function showTime(func: Function, args: Array<any>, iterations:number = 1, text:string) {
    const startTime = Date.now();
    for (let i = 0; i< iterations; i++){
       func(...args); 
    }  
    console.log(text + ': ', Date.now()-startTime);
}

function fill1(iterations: number){
    const arr = [];
    for (let i = 0; i< iterations; i++){
        arr.push(Math.random());
    }
}

function fill2(iterations: number){
    const arr = new Array(iterations);
    for (let i = 0; i< iterations; i++){
        arr[i] = Math.random();
    }
}

function fill2d1(iterations: number){
    const arr = new Array(iterations);
    for (let i = 0; i< iterations; i++){
        const row = new Array(iterations);
        for (let j = 0; j< iterations; j++){
            row[j] = Math.random();
        }
        arr[i] = row;
    }
    return arr;
}

function iterate1(arr:Array<Array<any>>){
    for (let i = 0; i< arr.length; i++){
        for (let j = 0; j< arr[i].length; j++){
           const a = arr[i][j] * 2; 
        }
    }
}

function iterate3(arr:Array<Array<any>>){
    for (let j = 0; j< arr[0].length; j++){
        for (let i = 0; i< arr.length; i++){
           const a = arr[i][j] * 2; 
        }
    }
}

function iterate2(arr:Array<Array<any>>){
    for (let i = 0; i< arr.length; i++){
        const row = arr[i];
        const len = row.length;
        for (let j = 0; j< len; j++){
           const a = row[j] * 2; 
        }
    }
}

const data = new Array(100).fill(null).map((it, i)=>{
    return new Array(1000).fill(null).map((jt, j)=>{
        return Math.random();
    })
});

function find(data:Array<Array<number>>, obj:Array<number>){
    const isEqual = (a: Array<number>, b: Array<number>)=>{
        let findex = -1;
        a.forEach((jt, j)=>{
            if (b[j]===jt) {
                findex = j
            }
            //return b[j] !== jt
        });
        return findex !== -1;
    }
    const res = data.find(it=> isEqual(it, obj));
    return res;
}

function indexateData(data:Array<Array<number>>){
    //const map: Record<number, Array<number>> = {};
    const getHash = (item:Array<number>)=>{
        return Math.floor(item.reduce((a, it) => (a + it) % 1000, 0));
    }
    const indexated = data.map(it=>{
        return {original: it, hash: getHash(it)}
    })

    return (obj:Array<number>)=>{
        const objHash = getHash(obj);
        /*const isEqual = (a: Array<number>, b: Array<number>)=>{
            return a.find((jt, j)=>{
                return b[j] !== jt
            }) == null;
        }*/
        const isEqual = (a: Array<number>, b: Array<number>)=>{
            let findex = -1;
            a.forEach((jt, j)=>{
                if (b[j]===jt) {
                    findex = j
                }
                //return b[j] !== jt
            });
            return findex !== -1;
        }
    
        const res = indexated.find(it=> {
            if (objHash !== it.hash){
                return false;
            }
            return isEqual(it.original, obj)
        });
        return res;
    }
}
let mp = new Array(512).fill(0).map((it, i)=> new Array(512).fill(-1));
function tracep1(startPoint:Vector, endPoint:Vector, tree:Record<string, IChunk>, chunks: number[][][][], map:number[][]): {ch:IChunk[], ph:Vector[]}{
    if (!(startPoint.y < map.length && startPoint.x < map[0].length && startPoint.x>=0 && startPoint.y>=0)){
        return {ch:[], ph:[]}
    }
    if (!(endPoint.y < map.length && endPoint.x < map[0].length && endPoint.x>=0 && endPoint.y>=0)){
        return {ch:[], ph:[]}
    }
    const verbose = false;
    const startTime = Date.now();
    const traceTree = dublicateChunkTree(tree)
    const getHashByVector = (pos: Vector)=>{
        const size =chunks[0][0][0].length;
        const z = chunks[Math.floor(pos.y / size)][Math.floor(pos.x / size)][Math.floor(pos.y % size)][Math.floor(pos.x % size)];
        return getHash(Math.floor(pos.x / size), Math.floor(pos.y / size), z);// `${Math.floor(pos.x / size)}_${Math.floor(pos.y / size)}_${z}`
    }
    verbose && console.log('chunk tree ',Date.now()- startTime);
    

    chunkIndexate(traceTree, [getHashByVector(startPoint)], 0); 
    //console.log(traceTree);
    
    verbose && console.log('chunk index ',Date.now()- startTime);

    const chunkPath = findChunkPath(traceTree, getHashByVector(endPoint)) || [];
    const start = getHashByVector(startPoint)
    if (start && traceTree[start]){
    chunkPath.push(traceTree[start])
    }
    verbose && console.log('chunk path ',Date.now()- startTime);
    const lm = getLimitPathMap(chunkPath, chunks, map, mp) as Array<Array<number>>;//can be same access record<num, record<num, num>>
    //let lm = map.map(it=>it.map(jt=>jt==0?Number.MAX_SAFE_INTEGER:-1));
    verbose && console.log('limit map ',Date.now()- startTime);
    indexate(lm, [startPoint], 0);
    verbose && console.log('indexate ',Date.now()- startTime);
    const path = findPath(lm, startPoint, endPoint);
    verbose && console.log('result path ',Date.now()- startTime);
    return {ch:chunkPath, ph:path};
}