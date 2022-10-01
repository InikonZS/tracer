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
import { iteration } from "../tracelib/traceCore/tracerBase";
import { Array2d, maxValue } from "../tracelib/traceCore/traceTools";
import { steps } from "../tracelib/traceCore/traceSteps";

const mapSize = 512;
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

interface IPositioned {
    pos: Vector;
}

class ChunkedArray<T extends IPositioned>{
    items: Array<T> = [];
    chunks: T[][][];
    chunkSize = 16;
    length:number;
    constructor(items:Array<T>){
        this.items = items;
        this.chunks = [];
        for (let y = 0; y< mapSize / this.chunkSize; y++){
            const row:T[][] = [];
            for (let x = 0; x< mapSize / this.chunkSize; x++){
                row.push([]);
            }
            this.chunks.push(row);
        }
        items.forEach(it=>{
            const chunk = this.getChunk(it.pos);
            chunk.push(it);
        })
        this.length = items.length;
    }

    updateItem(item:T, lastPos:Vector){
        const lastChunk = this.getChunk(lastPos);
        const chunk = this.getChunk(item.pos);
        if (lastChunk == chunk){
            return;
        }
        //console.log('upd ')
        const index = lastChunk.findIndex(it=> it == item);
        if (index !=-1){
            lastChunk.splice(index, 1);
            this.length--;
        } else {
            console.log('shit no item')
        }
        chunk.push(item);
        this.length++;
    }

    getChunk(pos:Vector){
        //console.log(this.length);
        const row = this.chunks[Math.floor(pos.y / this.chunkSize)];
        if (!row){
            return null;
        }
        return row[Math.floor(pos.x / this.chunkSize)]||null;
    }

    getWithClosest(pos:Vector){
        const chunks:T[][] = [this.getChunk(pos.clone())];
        steps.forEach(step=>{
            const chunk = this.getChunk(pos.clone().add(Vector.fromIVector(step).scale(this.chunkSize)));
            if (chunk){
                chunks.push(chunk);
            }
        })
    }

    getWithClosestItems(pos:Vector){
        const items:T[] = [];
        steps.forEach(step=>{
            const chunk = this.getChunk(pos.clone().add(Vector.fromIVector(step).scale(this.chunkSize)));
            if (chunk){
                chunk.forEach(it=>items.push(it));
            }
        })
        this.getChunk(pos.clone()).forEach(it=> items.push(it));

        return items;
    }
}

class Unit{
    tracer: TwoLevelHPA;
    pos: Vector;
    path: Array<Vector>;
    tm:number = 0;
    wait: boolean = false;
    noCorrectCounter: number = 0;
    indMap: Array2d;
    finishPoint: Vector;
    clickedPoint: Vector;
    //map: number[][];
    constructor(tracer: TwoLevelHPA, pos: Vector, indMap:Array2d){
        this.tracer = tracer;
        //this.map = map;
        this.pos = pos;
        this.path = [];

        this.indMap = indMap;
    }

    tick(delta:number, map:number[][], getUtracer:()=>TwoLevelHPA){
        const verbose = false;
        if (!this.indMap){
            //
        }
        
        this.tm+=delta;
        if (this.tm>1.5){
            this.tm = 0;
            if (this.path && this.path.length){
                const next = this.path.pop();
                if(this.wait && map[next.y][next.x] != 0 && this.noCorrectCounter>50){
                    this.noCorrectCounter = 0;
                    const tracer =getUtracer();// new TwoLevelHPA(map);
                    if (this.clickedPoint){
                        tracer.updateTree([{pos: this.pos, val:0}])
                        this.path = tracer.trace(this.pos, this.clickedPoint).ph;
                        tracer.updateTree([{pos: this.pos, val:1}])
                        console.log('retraced');
                    } else {
                        console.log('no path 0');
                    }
                } else
                if(this.wait && map[next.y][next.x] != 0){
                    //map.forEach(row=>row.forEach((cell, j)=> row[j] != 0 ? -1 : maxValue))
                    const indMap = this.indMap; //not full map to index
                    for (let y=-20; y<20; y++){
                        for (let x=-20; x<20; x++){
                            if (indMap[next.y+y] && indMap[next.y+y][next.x+x]!=null){
                                indMap[next.y+y][next.x+x] = map[next.y+y][next.x+x] !=0 ? -1 : maxValue;
                            }
                            if (x == -10 || x == 10-1 || y==-10 || y ==10-1){
                             //   indMap[next.y+y][next.x+x] = map[next.y+y][next.x+x] = -1;
                            }
                        } 
                    }
                    //const indMap = map.map(row=>row.map(cell=> cell != 0 ? -1 : maxValue))
                    const correctPoint = this.correct(indMap);
                    verbose && console.log('try correct');
                    if (!correctPoint){
                        verbose && console.log('no correct');
                        this.noCorrectCounter++;
                        this.path.push(next);
                        return;
                    }
                    const correctIndex = this.path.findIndex(it=> it.x == correctPoint.x && it.y == correctPoint.y);
                    const correctPath = findPath(indMap, this.pos, correctPoint);
                    verbose && console.log('correct points ', correctPath.length, 'cutted ', this.path.length - correctIndex);
                    this.path.splice(correctIndex);
                    this.path = this.path.concat(correctPath);
                } else
                if (map[next.y][next.x] != 0){
                    this.path.push(next);
                    this.wait = true;
                } else {
                    this.wait = false;
                    this.pos = next.clone();
                }
            }
        }
    }

    correct(map:number[][]){
        return indexateCorrect(map, this.path, [this.pos], 0);
    }

    trace(point:Vector){
        this.clickedPoint = point;
        this.path = this.tracer.trace(this.pos, point).ph;
        if (!this.path[0]){
            console.log('path 0 error');
        }
        this.finishPoint = this.path[0];
    }

    render(ctx:CanvasRenderingContext2D){
       // ctx.fillRect()
    }
}

function indexateCorrect(map:Array<Array<number>>, path:Array<Vector>, points:Array<{x:number, y:number}>, generation:number):Vector | null{
    const nextPoints = iteration(map, points, generation);
    let stopPoint =
    nextPoints.find(point=>{
        const pathPoint = path.find(pp=> pp.x == point.x && pp.y == point.y);
        return pathPoint;
    })
    if (generation>100){
        return null;
    }
    if (stopPoint){
        return Vector.fromIVector(stopPoint);
    }
    if (!points.length) { return null; }
    return indexateCorrect(map, path, nextPoints, generation+1);
  }

class Build{
    pos: Vector;
    health: number;
    tm:number = 0;
    //map: number[][];
    constructor(pos: Vector){
        this.health = 100;
        this.pos = pos;
    }

    tick(delta:number){
        
    }

    render(ctx:CanvasRenderingContext2D){
       // ctx.fillRect()
    }
}

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
    units: Array<Unit>;
    builds: Build[];
    cUnits: ChunkedArray<Unit>;

    constructor(parentNode: HTMLElement) {
        this.canvas = new Canvas(parentNode, this.render);

        this.build();
    }

    async build() {
        const image = await loadImage(mapFile);
        const map = getMapFromImageData(getImageData(image));
        this.map = map;

        for (let i = 0; i< 1; i++){
            const tracer = new TwoLevelHPA(this.map);//createTracer(map);
            this.tracers.push(tracer);
        }
        this.units = [];//[new Unit(this.tracers[0] as TwoLevelHPA, new Vector(10, 10)), new Unit(this.tracers[0] as TwoLevelHPA, new Vector(100, 100))];
        const indMap = map.map(row=>row.map(cell=> cell != 0 ? -1 : maxValue));
        for (let i=0; i<2500; i++){
            const pos = new Vector(Math.floor(Math.random() * mapSize), Math.floor(Math.random() * mapSize));
            if (map[pos.y][pos.x]!=0){
                i--;
                continue;
            }
            const unit = new Unit(this.tracers[0] as TwoLevelHPA, pos, indMap);
            this.units.push(unit);
        }
        this.cUnits = new ChunkedArray(this.units);

        this.builds = [];//[new Unit(this.tracers[0] as TwoLevelHPA, new Vector(10, 10)), new Unit(this.tracers[0] as TwoLevelHPA, new Vector(100, 100))];
        for (let i=0; i<10; i++){
            const build = new Build(new Vector(Math.floor(Math.random() * mapSize), Math.floor(Math.random() * mapSize)));
            this.builds.push(build);
        }

        this.units.forEach((it, i)=> i<1000 && it.trace(this.builds[Math.floor(Math.random()*this.builds.length)].pos))
        setTimeout(()=>{
            this.units.forEach((it, i)=> i>=1000 && it.trace(this.builds[Math.floor(Math.random()*this.builds.length)].pos))
        },1000);
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

            //this.units.forEach(it=> it.trace(this.endPoint))

            if (vector.y < map.length && vector.x < map[0].length && vector.x>=0 && vector.y>=0){
                const paths = this.tracers.map(tracer=>tracer.trace(this.startPoint, this.endPoint));
                this.chunkPathes =  paths.map(it=> it.ch); 
                this.pathes =paths.map(it=> it.ph);
            } else {
                this.chunkPath = [];
            }
  
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
                          //  changed.push({pos: new Vector(x, y), val: val })
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

            if (this.pathes && this.pathes[0] && getPathBreaks(this.pathes[0] as Vector[], this.map).length){
                //this.canvas.onMove({offsetX: this.endPoint.x * tileSize, offsetY: this.endPoint.y * tileSize} as MouseEvent);
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
                      //  this.canvas.canvasBack[ (pos.y * size + y)][ (pos.x * size + x)] = '#f00';
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
                     //   this.canvas.canvasBack[ (pos.y * size + y)][ (pos.x * size + x)] = '#f00';
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

        if (this.units && this.builds){
            //const map = this.map.map(row=>row.map(cell=>cell == 0 ? 0 : 1));
            this.units.forEach(unit=>{
                this.units.forEach(unit2=>{
                    if  (unit == unit2) {
                        return;
                    }
                    if (unit.pos.x == unit2.pos.x && unit.pos.y == unit2.pos.y){
                        console.log('shit');
                    }
                });
            });
            /*this.units.forEach(unit=>{
                map[unit.pos.y][unit.pos.x] = 1;
                if (unit.path && unit.path[unit.path.length-1]){
                    const next = unit.path[unit.path.length-1];
                    map[next.y][next.x] = 1;
                }
            });*/
            const map1 = this.map.map(row=>row.map(cell=>cell == 0 ? 0 : 1));
            //this.units.forEach(unit2=>{
                this.units.forEach(unit2=>{
                    //if (unit === unit2) return;
                    map1[unit2.pos.y][unit2.pos.x] = 1;
                    if (unit2.path && unit2.path[unit2.path.length-1] && !unit2.wait){
                        const next = unit2.path[unit2.path.length-1];
                        map1[next.y][next.x] = 1;
                    }
                });
                //const u1 = this.units.find(u=>{
                //    return u.noCorrectCounter>=50;
                //})
                let utracer:TwoLevelHPA = null;
            this.units.forEach((unit)=>{
                
                /*if (unit.path && unit.path[unit.path.length-1]){
                    const next = unit.path[unit.path.length-1];
                    map[next.y][next.x] = 0;//this.map[next.y][next.x];
                
                
                    unit.tick(delta, map);
                    //if (unit.path && unit.path[unit.path.length-1]){
                      //  const next = unit.path[unit.path.length-1];
                        map[next.y][next.x] = 1;//this.map[next.y][next.x];
                    //}
                }*/
                const curPoints = [unit.pos.clone()];
                if (unit.path && unit.path[unit.path.length-1] && !unit.wait){
                    curPoints.push(unit.path[unit.path.length-1])
                }
                curPoints.forEach(last=>{
                    map1[last.y][last.x] = 0;
                })
                
                //this.units.forEach(unit2=>{
                this.cUnits.getWithClosestItems(unit.pos).forEach(unit2=>{
                    if (unit === unit2) return;
                    map1[unit2.pos.y][unit2.pos.x] = 1;
                    if (unit2.path && unit2.path[unit2.path.length-1] && !unit2.wait){
                        const next = unit2.path[unit2.path.length-1];
                        map1[next.y][next.x] = 1;
                    }
                });
                const lastPos =unit.pos.clone();
                const lastPoints = [lastPos];
                if (unit.path && unit.path[unit.path.length-1] && !unit.wait){
                    lastPoints.push(unit.path[unit.path.length-1])
                }
                unit.tick(delta, map1, ()=>{
                    if (!utracer){
                        utracer = new TwoLevelHPA(map1);
                    }
                    return utracer; 
                });
                lastPoints.forEach(last=>{
                    map1[last.y][last.x] = 1;
                })
                const pos = unit.pos;
                map1[pos.y][pos.x] = 1;
                this.cUnits.updateItem(unit, lastPos);
              /*  this.cUnits.getWithClosestItems(lastPos).forEach(unit2=>{
                    if (unit === unit2) return;
                    map1[unit2.pos.y][unit2.pos.x] = 0;
                    if (unit2.path && unit2.path[unit2.path.length-1] && !unit2.wait){
                        const next = unit2.path[unit2.path.length-1];
                        map1[next.y][next.x] = 0;
                    }
                });*/
                //ctx.fillStyle = '#f009';
                const usize = 1;
                for (let y = -2; y<2; y++){
                    for (let x = -2; x<2; x++){
                        //const size = this.chunks[0][0][0].length;
                        if (this.canvas.canvasBack[ (pos.y + y)]){
                            this.canvas.canvasBack[ (pos.y + y)][ (pos.x + x)] = '#0ff';
                        }
                    }
                }

                const drawPath = true;
                if (unit.path && drawPath){
                    unit.path.forEach((pos)=>{
                        //ctx.fillStyle = '#fffe';
                        //ctx.fillRect(pos.x * tileSize, pos.y * tileSize, tileSize, tileSize);
                        this.canvas.canvasBack[(pos.y)][(pos.x)] = '#fffe';
                    });
                }
                
                
            })

            this.builds.forEach(build=>{
                const pos = build.pos;
                for (let y = -2; y<2; y++){
                    for (let x = -2; x<2; x++){
                        //const size = this.chunks[0][0][0].length;
                        this.canvas.canvasBack[ (pos.y + y)][ (pos.x + x)] = '#909';
                    }
                }
            })
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
