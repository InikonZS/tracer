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
import { ChunkedArray, deleteElementFromArray, IPositioned} from "../tracelib/traceCore/chunkedArray";
import {getCorrectionPath, indexateCorrect} from "../tracelib/traceCore/correction";
import { smoothPath } from "../tracelib/traceCore/smoothPath";
import { Canvas } from "./canvasRenderer";

const mapSize = 512;

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
    noRetraceCounter: any;
    enemy: Build | Unit;
    health: number = 100;
    onIdle: ()=>void;
    onDestroy: ()=>void;
    destroyed: boolean = false;
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
        if (this.tm>10.5){
            this.tm = 0;
            if (this.enemy && this.clickedPoint.clone().sub(this.enemy.pos).abs()>5){
                this.correctPathEnd(this.enemy.pos.clone(), map);
                this.clickedPoint = this.enemy.pos.clone();
            }
            if (this.enemy && this.enemy.pos.clone().sub(this.pos).abs() <=10){
                //if (this.enemy.health == 0){
                    //this.enemy = null;
                    //this.path = null;
                //    return;
                //}
                this.enemy.damage();
                //if (this.enemy.health == 0){
                    //this.enemy = null;
                    //this.path = null;
                //}
            }
            if (!this.enemy || !this.path || this.path.length<=0){
                if (!this.enemy){
                   // console.log('no enemy')
                }
                this.onIdle?.();
                return;
            }
            if ((!this.path || !this.path.length) && this.clickedPoint && this.clickedPoint.clone().sub(this.pos).abs()>10){
                //return;
                if (this.noRetraceCounter< 150){
                    this.noRetraceCounter++;
                    return;
                }{
                    this.noRetraceCounter =0;
                    this.noCorrectCounter =0;
                }
                const tracer = getUtracer();
                tracer.updateTree([{pos: this.pos, val:0}])
                const nextPath= tracer.trace(this.pos, this.clickedPoint).ph;
                tracer.updateTree([{pos: this.pos, val:1}])
                if (nextPath && nextPath.length){
                    this.path = nextPath;
                }
                verbose && console.log('hard retraced');
            }else
            if (this.path && this.path.length){
                const next = this.path.pop();
                if(this.wait && map[next.y][next.x] != 0 && this.noCorrectCounter>50){
                    this.noCorrectCounter = 0;
                    //return;
                    const tracer =getUtracer();// new TwoLevelHPA(map);
                    if (this.clickedPoint){
                        tracer.updateTree([{pos: this.pos, val:0}])
                        const nextPath= tracer.trace(this.pos, this.clickedPoint).ph;
                        tracer.updateTree([{pos: this.pos, val:1}])
                        if (nextPath){
                            this.path = nextPath;
                        }
                        verbose && console.log('retraced');
                    } else {
                        console.log('no path 0');
                    }
                } else
                if(this.wait && map[next.y][next.x] != 0){
                    this.correctPath(next, map);
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

    correctPath(next:Vector, map: Array2d){
        //const verbose = false;
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

        const res = getCorrectionPath(this.path, this.pos, indMap);
        if (res == null){
            this.noCorrectCounter++;
            this.path.push(next);
            return;
        }
        const {correctPath, correctIndex} = res;
        this.path.length = correctIndex+1;
        this.path = this.path.concat(correctPath);
    }

    correctPathEnd(next:Vector, map: Array2d){
        //const verbose = false;
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
        const res = getCorrectionPath(this.path, next, indMap);
        if (res == null){
            this.noCorrectCounter++;
            this.path.push(next);
            return;
        }
        const {correctPath, correctIndex} = res;
        //this.path.length = correctIndex+1;
        const path = this.path.reverse();
        //console.log(correctIndex);
        path.length = path.length - correctIndex;
        this.path = (path.concat(correctPath)).reverse();
        this.path = smoothPath(this.path, map)
    }

    trace(/*point:Vector*/enemy: Build | Unit){
        this.enemy = enemy;
        const point = enemy.pos.clone();
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

    damage(){
        if (this.destroyed) return;
        this.health -=Math.random()*5 + 5;
        if (this.health<=0){
            this.health = 0;
            this.destroyed = true;
            this.onDestroy?.();
        }
    }
}

class Build{
    pos: Vector;
    health: number;
    tm:number = 0;
    onDestroy: ()=>void;
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

    damage(){
        this.health -=10;
        if (this.health<=0){
            this.health = 0;
            this.onDestroy?.();
        }
    }
}

class Player{
    units:ChunkedArray<Unit>;
    builds:Array<Build> =[];
    tracer: TwoLevelHPA;
    indMap: Array2d;
    map: Array2d;
    getPlayers: () => Array<Player>;

    constructor(tracer: TwoLevelHPA, indMap:Array2d, map: Array2d, getPlayers: ()=>Array<Player>){
        this.tracer = tracer;
        this.indMap = indMap;
        this.map = map;
        this.getPlayers = getPlayers;
        this.units = this.generateUnits();
    }

    generateUnits(){
        const getEnemies = ()=>this.getPlayers().map(player=>player.units.items).flat();
        return generateUnits(this.tracer, this.indMap, this.map, 50, /*this.builds*/()=>getEnemies(), ()=>getEnemies());  
    }
}


function generateUnits(tracer:TwoLevelHPA, indMap:Array2d, map:Array2d, count:number, getEnemies: ()=>Array<Build | Unit>, defendEnemies: ()=>Array<Build | Unit>){
    const units: Array<Unit> = [];
    for (let i=0; i<count; i++){
        const pos = new Vector(Math.floor(Math.random() * mapSize), Math.floor(Math.random() * mapSize));
        if (map[pos.y][pos.x]!=0){
            i--;
            continue;
        }
        const unit = new Unit(tracer, pos, indMap);
        unit.onIdle = ()=>{
            let closestBuild:Build|Unit = null;
            let dist = maxValue;
            getEnemies().forEach(build=>{
                if (build.pos.clone().sub(unit.pos).abs()<dist){
                    const dst = build.pos.clone().sub(unit.pos).abs();
                    const atks = units.reduce(((ac, it)=>ac + (it.enemy == build ? 1 : 0)), 0);
                    //if (atks<3) {
                    dist = dst;// + atks * 50;
                    closestBuild = build;
                    //}
                }
            });
            if (closestBuild){
                unit.trace(closestBuild);
            } else {
                unit.path = [];
            }
        }
        unit.onDestroy = ()=>{
            const enemies = defendEnemies();//this.eUnits.items;/// all enemies
            deleteElementFromArray(units, unit);
            //console.log('destroy unit ', units.length, enemies.length);
            enemies.forEach(unit1=>{
                if (unit1 instanceof Unit){
                    if (unit1.enemy == unit){ 
                        unit1.enemy = null;
                        unit1.path = null;
                    }
                }
            })
        }
        units.push(unit);
    }
    const cUnits = new ChunkedArray(units, mapSize);
    return cUnits;
}

export class TestScene {
    private utracer:TwoLevelHPA = null;
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
    //cUnits: ChunkedArray<Unit>;
    buildCounter: number = 0;
    players: Player[];
    //eUnits: ChunkedArray<Unit>;

    constructor(parentNode: HTMLElement) {
        this.canvas = new Canvas(parentNode, this.render, mapSize);

        this.build();
    }

    destroy(){
        this.canvas.destroy();
    }

    async build() {
        const image = await loadImage(mapFile);
        const map = getMapFromImageData(getImageData(image));
        this.map = map;

        for (let i = 0; i< 1; i++){
            const tracer = new TwoLevelHPA(this.map);//createTracer(map);
            this.tracers.push(tracer);
        }
        //[new Unit(this.tracers[0] as TwoLevelHPA, new Vector(10, 10)), new Unit(this.tracers[0] as TwoLevelHPA, new Vector(100, 100))];
        const indMap = map.map(row=>row.map(cell=> cell != 0 ? -1 : maxValue));
        
        this.builds = [];
        this.players = [];
        const createPlayer = ()=>{
            const player: Player = new Player(this.tracers[0] as TwoLevelHPA, indMap, map, ()=>{
                return this.players.filter(_player=> _player != player)
            })
            this.players.push(player);
        }

        createPlayer();
        createPlayer();
        createPlayer();
        createPlayer();
        createPlayer();
        //this.cUnits = this.generateUnits(indMap, map, 50, /*this.builds*/()=>this.eUnits.items, ()=>this.eUnits.items);
        //this.eUnits = this.generateUnits(indMap, map, 50, ()=>this.cUnits.items, ()=>this.cUnits.items);
        

        //this.eUnits.items.forEach((it, i)=> i<1000 && it.trace(this.cUnits.items[Math.floor(Math.random()*this.cUnits.items.length)]));

        this.chunks = this.tracers[0].chunks;
        const tileSize = 2;
        this.canvas.onClick = (e)=>{
            const vector = new Vector(Math.round(e.offsetX / tileSize), Math.round(e.offsetY / tileSize));
            //this.startPoint = vector;

            const changed:Array<{pos:Vector, val:number}> = [];
           // this.map.forEach((row, y)=>{
             //   row.forEach((cell, x)=>{
    
                    //if (Math.random()<0.01){
                        //row[x] = 1;
                        //const val = (Math.random() < 0.01 ? 1 : row[x]);
                        //if (val != row[x]){
                            for (let y1 = -12; y1<12; y1++){
                                for (let x1 = -12; x1<12; x1++){
                                    //const size = this.chunks[0][0][0].length;
                                    //if (this.canvas.canvasBack[ (pos.y + y)]){
                                     //   this.canvas.canvasBack[ (pos.y + y)][ (pos.x + x)] = '#0ff';
                                    //}
                                    changed.push({pos: new Vector(vector.x + x1, vector.y +y1), val: 0 })
                                    this.map[vector.y +y1][vector.x + x1] = 0;
                                }
                            }
                            
                            //row[x] = val;
                        //};
                   // }
                    //ctx.fillStyle = ['#fff', '#ff0', '#f0f'][cell] || '#0ff';
                   // ctx.fillRect(x * tileSize, y * tileSize, tileSize, tileSize);
               // )
            //});
            if (changed.length){
                this.tracers.forEach(it=> it.updateTree(changed));
            }
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
        this.buildCounter+=delta;
        if (this.buildCounter>1000){
            this.buildCounter = 0;
            for (let i=0; i<10; i++){
                const pos = new Vector(Math.floor(Math.random() * mapSize), Math.floor(Math.random() * mapSize));
                if (this.map[pos.y][pos.x]!=0){
                    i--;
                    continue;
                }
                const build = new Build(pos);
                build.onDestroy = ()=>{
                    deleteElementFromArray(this.builds, build);
                    /*this.cUnits.items.forEach(unit=>{
                        if (unit.enemy == build){ 
                            unit.enemy = null;
                            unit.path = null;
                        }
                    })*/
                }
                this.builds.push(build);
            }
        }
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
                            //changed.push({pos: new Vector(x, y), val: val })
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

        /*if (this.cUnits && this.builds){
            this.processUnits(delta, this.cUnits, 0);
            this.processUnits(delta, this.eUnits, 1);
        }*/
        if (this.players){
            this.players.forEach((player, i)=>{
                this.processUnits(delta, player.units, i);
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

    debugIntersectUnitsValidate(units: ChunkedArray<Unit>){
        units.items.forEach(unit=>{
            units.items.forEach(unit2=>{
                if  (unit == unit2) {
                    return;
                }
                if (unit.pos.x == unit2.pos.x && unit.pos.y == unit2.pos.y){
                    console.log('shit');
                }
            });
        });
    }

    fillUnitsMap(){
        const map1 = this.map.map(row => row.map(cell => cell == 0 ? 0 : 1));
        //this.cUnits.items.forEach(unit2=>{
        this.players.forEach((player, i) => {
            player.units.items.forEach(unit2 => {
                map1[unit2.pos.y][unit2.pos.x] = 1;
                if (unit2.path && unit2.path[unit2.path.length - 1] && !unit2.wait) {
                    const next = unit2.path[unit2.path.length - 1];
                    map1[next.y][next.x] = 1;
                }
                //}); this.processUnits(delta, player.units, i);
            });
        })
        return map1;
    }

    drawMarker(pos:Vector, size:number, color:string){
        for (let y = -size; y<size; y++){
            for (let x = -size; x<size; x++){
                if (this.canvas.canvasBack[ (pos.y + y)]){
                    this.canvas.canvasBack[ (pos.y + y)][ (pos.x + x)] = color;
                }
            }
        }
    }

    processUnits(delta:number, units:ChunkedArray<Unit>, playerIndex: number){
        this.debugIntersectUnitsValidate(units);

        const map1 = this.fillUnitsMap();

        let updatedTree = false;
        let updatedCounter =0;
        if (!this.utracer){
            this.utracer = new TwoLevelHPA(this.map);
            this.tracers.push(this.utracer);
        }
        const ps = units.items.map(it=> ({pos:it.pos.clone(), val:1}));

        units.items.forEach((unit)=>{
        
            const curPoints = [unit.pos.clone()];
            if (unit.path && unit.path[unit.path.length-1] && !unit.wait){
                curPoints.push(unit.path[unit.path.length-1])
            }
            curPoints.forEach(last=>{
                map1[last.y][last.x] = 0;
            })
            
            units.getWithClosestItems(unit.pos).forEach(unit2=>{
                if (unit === unit2) return;
                map1[unit2.pos.y][unit2.pos.x] = 1;
                if (unit2.path && unit2.path[unit2.path.length-1] && !unit2.wait){
                    const next = unit2.path[unit2.path.length-1];
                    map1[next.y][next.x] = 1;
                }
            });
            const lastPos =unit.pos.clone();

            updatedCounter++;
            unit.tick(delta, map1, ()=>{
                
                if (!updatedTree && updatedCounter>50){
                    updatedTree =true;
                    updatedCounter = 0;
                    this.utracer.updateTree(ps.map(it=> ({pos:it.pos, val:1})))
                }

                return this.utracer; 
            });

            const pos = unit.pos;
            map1[pos.y][pos.x] = 1;
            units.updateItem(unit, lastPos);

            this.drawMarker(pos, 2, ["#0ff", "#f90", "#90f", "#ff0", "#f0f", "#9ff"][playerIndex]);

            const drawPath = true;
            if (unit.path && drawPath){
                unit.path.forEach((pos)=>{
                    this.canvas.canvasBack[(pos.y)][(pos.x)] = '#fffe';
                });
            }
            
            
        })
        this.utracer && updatedTree && this.utracer.updateTree(ps.map(it=> ({pos:it.pos, val:0})))

        this.builds.forEach(build=>{
            const pos = build.pos;
            this.drawMarker(pos, 2, "#909");
        })
    }
}
