import Control from "../../common/control";
import { IVector, Vector } from '../../common/vector';
import { RenderTicker } from './ticker';
import { getMapFromImageData, getImageData, loadImage } from '../tracelib/imageDataTools';
import mapFile from './assets/map5.png';
import {findPath, indexate, tracePath} from '../tracelib/tracer';
import {getAreaFromPoint, getChunks, getIsolated, getIsolatedChunks, getAllConnections, getChunkTree, chunkIndexate, findChunkPath, IChunk, getLimitPathMap, dublicateChunkTree, updateChunkTree, getHash, limitTree, getPathBreaks} from '../tracelib/getIsolated';
import {createTracer, ITracer} from '../tracelib/tracePack';
import {TwoLevelHPA} from '../tracelib/tracePacks/TwoLevelHPA';
import {ThreeLevelHPA} from '../tracelib/tracePacks/ThreeLevelHPA';
import {SimpleWave} from '../tracelib/tracePacks/SimpleWave';
import { Canvas } from "./canvasRenderer";

const mapSize = 512;

export class TestScene {
    private canvas: Canvas;
    private map: Array<Array<number>>;
    private path: Array<IVector>;
    private pathes: Array<Array<IVector>>;
    private startPoint = new Vector(10, 10);
    private endPoint = new Vector(12, 12);
    area: number[][];
    chunks: number[][][][];
    chunkPath: IChunk[];
    traceTreeInitial: Record<string, IChunk>;
    chunkPathes: Array<Array<IChunk>> =[];
    chunks2: number[][][][];
    traceTreeInitial2: Record<string | number, IChunk>;
    chunkPath2: IChunk[];
    tracers: (TwoLevelHPA | ThreeLevelHPA | SimpleWave)[] = [];

    constructor(parentNode: HTMLElement) {
        this.canvas = new Canvas(parentNode, this.render, mapSize);

        this.build();
    }

    destroy(){
        this.canvas.destroy();
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

        const arr1 = fill2(10000);
       /* showTime(fill2, [10000], 100, 'fill 10000');
        showTime(filterTest, [10000, 1000], 100, 'filter');
        showTime(spliceTest, [10000, 1000], 100, 'splice');
        showTime(swapRemoveTest, [10000, 1000], 100, 'swap');
        showTime(swap2RemoveTest, [10000, 1000], 100, 'swap2');
        showTime(swap2EachRemoveTest, [10000, 1000], 100, 'swap2each');
        showTime(fill2, [100000], 100, 'fill 100000');
        showTime(filterTest, [100000, 1000], 100, 'filter');
        showTime(spliceTest, [100000, 1000], 100, 'splice');
        showTime(swapRemoveTest, [100000, 1000], 100, 'swap');
        showTime(swap2RemoveTest, [100000, 1000], 100, 'swap2');
        showTime(swap2EachRemoveTest, [100000, 1000], 100, 'swap2each');
        showTime(fill2, [100000], 100, 'fill 100000');
        showTime(filterTest, [100000, 10000], 100, 'filter');
        showTime(spliceTest, [100000, 10000], 100, 'splice');
        showTime(swapRemoveTest, [100000, 10000], 100, 'swap');
        showTime(swap2RemoveTest, [100000, 10000], 100, 'swap2');
        showTime(swap2EachRemoveTest, [100000, 10000], 100, 'swap2each');*/

        const image = await loadImage(mapFile);
        const map = getMapFromImageData(getImageData(image));
       /* tracePath(map, this.startPoint, this.endPoint, (path)=>{
            console.log(path);
            this.path = path;
        });*/
        this.map = map;

        /*this.area = getIsolated(this.map);//getAreaFromPoint(this.map, this.startPoint, 1);
        //console.log(this.area);
        this.chunks = getIsolatedChunks(this.map, 8)//getChunks(this.map);
        //const connections = getAllConnections(this.chunks);
        //console.log(connections);
        this.traceTreeInitial = getChunkTree(this.chunks);

        this.chunks2 = getIsolatedChunks(this.map, 32)//getChunks(this.map);
        //const connections = getAllConnections(this.chunks);
        //console.log(connections);
        this.traceTreeInitial2 = getChunkTree(this.chunks2);

        const getHashByVector = (pos: Vector)=>{
            const size =this.chunks[0][0][0].length;
            const z = this.chunks[Math.floor(pos.y / size)][Math.floor(pos.x / size)][Math.floor(pos.y % size)][Math.floor(pos.x % size)];
            return getHash(Math.floor(pos.x / size), Math.floor(pos.y / size), z);//`${Math.floor(pos.x / size)}_${Math.floor(pos.y / size)}_${z}`
        }

        const getHashByVector2 = (pos: Vector)=>{
            const size =this.chunks2[0][0][0].length;
            const z = this.chunks2[Math.floor(pos.y / size)][Math.floor(pos.x / size)][Math.floor(pos.y % size)][Math.floor(pos.x % size)];
            return getHash(Math.floor(pos.x / size), Math.floor(pos.y / size), z);//`${Math.floor(pos.x / size)}_${Math.floor(pos.y / size)}_${z}`
        }
        */
        //chunkIndexate(traceTree, [getHashByVector(this.startPoint)], 0); 
        //console.log(traceTree);

        //this.chunkPath = findChunkPath(traceTree, getHashByVector(this.endPoint));
        //console.log(this.chunkPath);
        for (let i = 0; i< 1; i++){
            const tracer = new TwoLevelHPA(this.map);//createTracer(map);
            this.tracers.push(tracer);
        }
        
        this.chunks = this.tracers[0].chunks;
        const tileSize = 2;
        this.canvas.onClick = (e)=>{
            const vector = new Vector(Math.round(e.offsetX / tileSize), Math.round(e.offsetY / tileSize));
            this.startPoint = vector;
        }

        this.canvas.onMove = (e)=>{
            const verbose = false;
            const startTime = Date.now();
            const vector = new Vector(Math.round(e.offsetX / tileSize), Math.round(e.offsetY / tileSize));
            this.endPoint = vector;
            tileLine(new Vector(100, 100), this.endPoint, (x, y)=>{
                this.canvas.canvasBack[(y)][(x)] = '#00f'
            })
            
            if (vector.y < map.length && vector.x < map[0].length && vector.x>=0 && vector.y>=0){
             /*
                //const traceTree = getChunkTree(this.chunks);
                const traceTree2 = dublicateChunkTree(this.traceTreeInitial2)
                chunkIndexate(traceTree2, [getHashByVector2(this.startPoint)], 0); 
                this.chunkPath2 = findChunkPath(traceTree2, getHashByVector2(this.endPoint)) || [];
                const start2 = getHashByVector2(this.startPoint)
                if (start2 && traceTree2[start2]){
                    this.chunkPath2.push(traceTree2[start2])
                }

                //let traceTree = dublicateChunkTree(this.traceTreeInitial)

                //verbose && console.log('chunk tree ',Date.now()- startTime);
                verbose && console.log('first step ',Date.now()- startTime);
                const traceTree = limitTree(this.traceTreeInitial, this.chunkPath2, this.chunks2[0][0][0].length, this.chunks[0][0][0].length);
                verbose && console.log('limit tree ',Date.now()- startTime);
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
                */
               const pathes = [
                    //tracep1(this.startPoint.clone().add(new Vector(10, 10)), this.endPoint.clone().add(new Vector(10, 10)), this.traceTreeInitial, this.chunks, this.traceTreeInitial2, this.chunks2, this.map),
               /*     tracep1(this.startPoint.clone().add(new Vector(10, 20)), this.endPoint.clone().add(new Vector(-10, 10)), this.traceTreeInitial, this.chunks, this.traceTreeInitial2, this.chunks2, this.map),
                    tracep1(this.startPoint.clone().add(new Vector(10, 15)), this.endPoint.clone().add(new Vector(10, -10)), this.traceTreeInitial, this.chunks, this.traceTreeInitial2, this.chunks2,this.map),
                    tracep1(this.startPoint.clone().add(new Vector(20, 10)), this.endPoint.clone().add(new Vector(20, 10)), this.traceTreeInitial, this.chunks, this.traceTreeInitial2, this.chunks2,this.map),
                    tracep1(this.startPoint.clone().add(new Vector(20, 20)), this.endPoint.clone().add(new Vector(-20, 10)), this.traceTreeInitial, this.chunks, this.traceTreeInitial2, this.chunks2,this.map),
                    tracep1(this.startPoint.clone().add(new Vector(20, 15)), this.endPoint.clone().add(new Vector(20, -10)), this.traceTreeInitial, this.chunks,this.traceTreeInitial2, this.chunks2, this.map),
                    tracep1(this.startPoint.clone().add(new Vector(30, 10)), this.endPoint.clone().add(new Vector(10, 30)), this.traceTreeInitial, this.chunks,this.traceTreeInitial2, this.chunks2, this.map),
                    tracep1(this.startPoint.clone().add(new Vector(40, 20)), this.endPoint.clone().add(new Vector(-10, 30)), this.traceTreeInitial, this.chunks,this.traceTreeInitial2, this.chunks2, this.map),
                    tracep1(this.startPoint.clone().add(new Vector(40, 15)), this.endPoint.clone().add(new Vector(10, -30)), this.traceTreeInitial, this.chunks,this.traceTreeInitial2, this.chunks2, this.map),*/
                ]
                const paths = this.tracers.map(tracer=>tracer.trace(this.startPoint, this.endPoint));
                this.chunkPathes =  paths.map(it=> it.ch); 
                this.pathes =paths.map(it=> it.ph);
                //this.chunkPathes =pathes.map(it=>it.ch);
                //this.pathes = pathes.map(it=>it.ph);
            } else {
                this.chunkPath = [];
            }
            //console.log(this.chunkPath);
        }
    }

    render = (ctx: CanvasRenderingContext2D, delta:number)=>{
        if (!this.canvas) return;
        
        const tileSize = 2;
        const changed: {pos:Vector, val:number}[] = [];
        if (this.map){
            this.map.forEach((row, y)=>{
                row.forEach((cell, x)=>{
    
                    if (Math.random()<0.01){
                        //row[x] = 1;
                        const val = (Math.random() < 0.01 ? 1 : row[x]);
                        if (val != row[x]){
                            changed.push({pos: new Vector(x, y), val: val })
                            //row[x] = val;
                        };
                    }
                    //ctx.fillStyle = ['#fff', '#ff0', '#f0f'][cell] || '#0ff';
                   // ctx.fillRect(x * tileSize, y * tileSize, tileSize, tileSize);
                })
            });
            if (changed.length){
                this.tracers.forEach(it=> it.updateTree(changed));
            }
            //this.chunks = getIsolatedChunks(this.map)//getChunks(this.map);
            //const connections = getAllConnections(this.chunks);
            //console.log(connections);
            //this.traceTreeInitial = getChunkTree(this.chunks);
            //updateChunkTree(this.map, this.chunks, this.traceTreeInitial, changed);
            //updateChunkTree(this.map, this.chunks2, this.traceTreeInitial2, changed);
            if (this.pathes && this.pathes[0] && getPathBreaks(this.pathes[0] as Vector[], this.map).length){
                this.canvas.onMove({offsetX: this.endPoint.x * tileSize, offsetY: this.endPoint.y * tileSize} as MouseEvent);
            }
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
        
        if (this.chunkPath2){
            this.chunkPath2.forEach((chunk)=>{
                const pos = chunk.original.pos;
                //ctx.fillStyle = '#f009';
                const size = this.chunks2[0][0][0].length;
                this.chunks2[pos.y][pos.x].forEach((row, y)=>row.forEach((cell, x)=>{
                    if (cell == chunk.original.i){
                        //this.canvas.canvasBack[ (pos.y * size + y)][ (pos.x * size + x)] = '#f90';
                       // ctx.fillRect((pos.x * size + x) * tileSize, (pos.y * size + y) * tileSize, tileSize, tileSize);
                    }
                }))
                
            })
        }
        

        if (this.chunkPath){
            this.chunkPath.forEach((chunk)=>{
                const pos = chunk.original.pos;
                //ctx.fillStyle = '#f009';
                const size = this.chunks[0][0][0].length;
                this.chunks[pos.y][pos.x].forEach((row, y)=>row.forEach((cell, x)=>{
                    //if (cell == chunk.original.i){
                        this.canvas.canvasBack[ (pos.y * size + y)][ (pos.x * size + x)] = '#f00';
                       // ctx.fillRect((pos.x * size + x) * tileSize, (pos.y * size + y) * tileSize, tileSize, tileSize);
                    //}
                }))
                
            })
        }

        if (this.chunkPathes){
            this.chunkPathes.forEach(chunkPath=>{chunkPath.forEach((chunk)=>{
                const pos = chunk.original.pos;
                //ctx.fillStyle = '#f009';
                const size = this.chunks[0][0][0].length;
                this.chunks[pos.y][pos.x].forEach((row, y)=>row.forEach((cell, x)=>{
                   // if (cell == chunk.original.i){
                        this.canvas.canvasBack[ (pos.y * size + y)][ (pos.x * size + x)] = '#f00';
                       // ctx.fillRect((pos.x * size + x) * tileSize, (pos.y * size + y) * tileSize, tileSize, tileSize);
                  //  }
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
    return arr;
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

let testArr = fill2(10000);


function filterTest(la:number, ld:number){
    const arr = fill2(la);
    return arr.filter((it, i)=>{return i>=100 && i<100+ld});
}

function spliceTest(la:number, ld:number){
    const arr = fill2(la);
    for (let i = 0; i< ld; i++){
        arr.splice(100, 1);
    }
    return arr;
}

function swapRemoveTest(la:number, ld:number){
    const arr = fill2(la);
    for (let i = 0; i< ld; i++){
        //const buf = arr[100];
        arr[100] = arr[arr.length-1];
        arr.pop();
    }
    return arr;
}

function swap2RemoveTest(la:number, ld:number){
    const arr = fill2(la);
    for (let i = 0; i< ld; i++){
        //const buf = arr[100];
        arr[100] = arr[arr.length-1 - i];
    }
    arr.length = arr.length-ld;
    return arr;
}

function swap2EachRemoveTest(la:number, ld:number){
    const arr = fill2(la);
    arr.forEach((it, i)=>{
        if(i>=100 && i<100+ld){
            arr[100] = arr[arr.length-1 - i];
        }
    });
    arr.length = arr.length-ld;
    return arr;
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
let mp = new Array(mapSize).fill(0).map((it, i)=> new Array(mapSize).fill(-1));
function tracep1(startPoint:Vector, endPoint:Vector, tree:Record<string, IChunk>, chunks: number[][][][], tree2:Record<string, IChunk>, chunks2: number[][][][], map:number[][]): {ch:IChunk[], ph:Vector[]}{
    if (!(startPoint.y < map.length && startPoint.x < map[0].length && startPoint.x>=0 && startPoint.y>=0)){
        return {ch:[], ph:[]}
    }
    if (!(endPoint.y < map.length && endPoint.x < map[0].length && endPoint.x>=0 && endPoint.y>=0)){
        return {ch:[], ph:[]}
    }
    const verbose = false;
    const startTime = Date.now();
    const getHashByVector2 = (pos: Vector)=>{
        const size =chunks2[0][0][0].length;
        const z = chunks2[Math.floor(pos.y / size)][Math.floor(pos.x / size)][Math.floor(pos.y % size)][Math.floor(pos.x % size)];
        return getHash(Math.floor(pos.x / size), Math.floor(pos.y / size), z);//`${Math.floor(pos.x / size)}_${Math.floor(pos.y / size)}_${z}`
    }

    const traceTree2 = dublicateChunkTree(tree2)
    chunkIndexate(traceTree2, [getHashByVector2(startPoint)], 0); 
    const chunkPath2 = findChunkPath(traceTree2, getHashByVector2(endPoint)) || [];
    const start2 = getHashByVector2(startPoint)
    if (chunkPath2.length <=1){
        return {ch:[], ph:[]};
    }
    if (start2 && traceTree2[start2]){
        chunkPath2.push(traceTree2[start2])
    }

    //const traceTree = dublicateChunkTree(this.traceTreeInitial)
//const traceTree = dublicateChunkTree(tree)
    verbose && console.log('chunk tree ',Date.now()- startTime);
    const traceTree  = limitTree(tree, chunkPath2, chunks2[0][0][0].length, chunks[0][0][0].length);


    
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

function tileLine(start:Vector, finish:Vector, onPlot:(x:number, y: number)=>void):number{
    let x1 = finish.x;
    let y1 = finish.y;
    let x0 = start.x;
    let y0 = start.y;

    var steep = Math.abs(y1 - y0) > Math.abs(x1 - x0); // Проверяем рост отрезка по оси икс и по оси игрек
    // Отражаем линию по диагонали, если угол наклона слишком большой
    if (steep){
        x0 = y0;
        y0 = start.x;
        x1 = y1;
        y1 = finish.x;
    }
    // Если линия растёт не слева направо, то меняем начало и конец отрезка местами
    if (x0 > x1){
        x0 = x1;
        x1 = start.x;
        y0 = y1;
        y1 = start.y;
    }

    let deltax = Math.abs(x1 - x0)
    let deltay = Math.abs(y1 - y0)
    let error = 0
    let deltaerr = (deltay + 1)
    let y = y0
    let diry = y1 - y0
    if (diry > 0) {
        diry = 1
    }
    if (diry < 0){
        diry = -1
    }
    for (let x= x0; x< x1; x++){
        onPlot(steep ? y : x, steep ? x : y);
        error = error + deltaerr
        if (error >= (deltax + 1)){
            y = y + diry
            error = error - (deltax + 1)
        }
    }
    return x0-x1;
  }