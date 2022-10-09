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
import { Menu } from "./menu";
import { MenuModel } from "./menu-model";
import {Indexed} from "./indexed";
import { Unit, Build, BuildOreFactory, BuildAttack } from "./unit";

const mapSize = 512;

class Player{
    units:ChunkedArray<Unit> = new ChunkedArray<Unit>([], mapSize);
    builds:Array<Build> =[];
    tracer: TwoLevelHPA;
    indMap: Array2d;
    map: Array2d;
    getPlayers: () => Array<Player>;
    counter: number = 0;
    model: MenuModel;
    getRes: () => Array<Build>;
    id:number;
    money:number = 0;

    constructor(id:number, model: MenuModel, tracer: TwoLevelHPA, indMap:Array2d, map: Array2d, getPlayers: ()=>Array<Player>, getRes: ()=>Array<Build>, game: Game){
        this.model = model;
        this.id = id;
        this.tracer = tracer;
        this.indMap = indMap;
        this.map = map;
        this.getPlayers = getPlayers;
        this.generateUnits(1);  
        this.getRes = getRes;   
        
        const base = new BuildOreFactory(new Vector(Math.floor(Math.random() * mapSize), Math.floor(Math.random() * mapSize)), id);
        this.builds.push(base);
        base.onDamage = (by)=>{
            if (by.rescount>0){
                this.money += by.rescount;
                this.model.setPlayerData(by.playerId, (last)=>({...last, money: this.money}));
                by.rescount = 0;
                by.enemy = null;
                //console.log(by.rescount);
            }
            
        }

        for (let i = 0; i< 30; i++){
            const base = new BuildAttack(new Vector(Math.floor(Math.random() * mapSize), Math.floor(Math.random() * mapSize)), id, game);
            this.builds.push(base);
        }
    }

    getEnemies(){
        return this.getPlayers().map(player=>player.units.items).flat();
    }

    generateUnits(count:number){
        //const getEnemies = ()=>
        if (Math.random()<0.5){
            return generateUnits(this.model, this, this.tracer, this.indMap, this.map, count, /*this.builds*/()=>this.getEnemies(), ()=>this.getEnemies(), 0);  
        } else {
            return generateUnits(this.model, this, this.tracer, this.indMap, this.map, count, 
                /*this.builds*/()=>this.getRes(), ()=>this.getEnemies(), 1);  
        }
    }

    tick(delta:number){
        this.counter+=delta;
        if (this.counter> 1500){
            this.counter = 0;
            const spawned = this.generateUnits(3);
            //spawned.items.forEach(it=>{
            //    this.units.addItem(it);
            //});
        }
    }
}

export class Game{
    map: Array2d;
    tracer: TwoLevelHPA;
    players: Player[];
    model: MenuModel;
    builds: Build[];
    buildCounter: number =0;
    utracer: any;

    constructor(map:Array2d, model: MenuModel){
        this.model = model;
        this.map = map;
        const tracer = new TwoLevelHPA(this.map);//createTracer(map);
        this.tracer = tracer;
        //[new Unit(this.tracers[0] as TwoLevelHPA, new Vector(10, 10)), new Unit(this.tracers[0] as TwoLevelHPA, new Vector(100, 100))];
        const indMap = map.map(row=>row.map(cell=> cell != 0 ? -1 : maxValue));
        
        this.builds = [];
        this.players = [];
        const createPlayer = (id:number)=>{
            const player: Player = new Player(id, this.model, this.tracer as TwoLevelHPA, indMap, map, ()=>{
                return this.players.filter(_player=> _player != player)
            }, ()=>{
                return this.builds
            }, this)
            this.players.push(player);
        }

        createPlayer(1);
        createPlayer(2);
    }

    updateTracers(changed:{pos: Vector, val:number}[]){
        this.tracer.updateTree(changed);
        this.utracer.updateTree(changed);
    }

    renderChunks(canvas:Canvas, delta:number){
        this.tracer.chunks.forEach((chunkRow, i)=>{
            chunkRow.forEach((chunk, j)=>{
                chunk.forEach((row, y)=>{
                    row.forEach((cell, x)=>{
                        canvas.canvasBack[(i * chunk.length + y)][(j * row.length + x)] = ['#000','#090', '#ff0', '#f0f', '#574'][-(cell + 1)] || '#0ff';
                    })
                })
            });
        });
    }

    render(canvas:Canvas, delta:number){
        this.renderChunks(canvas, delta);
        this.buildCounter+=delta;
        if (this.buildCounter>1000){
            this.buildCounter = 0;
            this.generateRes();
        }

        this.players.forEach((player, i)=>{
            player.tick(delta);
            this.processUnits(canvas, delta, player.units, i);
            player.builds.forEach(build=>{
                build.tick(delta);
                build.render(canvas);
                //this.drawMarker(canvas, build.pos, 4, ["#0ff", "#f90", "#90f", "#ff0", "#f0f", "#9ff"][player.id])
            })
        })
    }

    generateRes(){
        for (let i=0; i<1; i++){
            const pos = new Vector(Math.floor(Math.random() * mapSize), Math.floor(Math.random() * mapSize));
            if (this.map[pos.y][pos.x]!=0){
                i--;
                continue;
            }
            const build = new Build(pos, 0);
            build.onDestroy = (by)=>{
                deleteElementFromArray(this.builds, build);
                //this.players[by.playerId].money+=1;
                by.rescount +=1;
                //console.log(by.rescount);
                //this.model.setPlayerData(by.playerId, (last)=>({...last, money: this.players[by.playerId].money}));
                this.players.forEach(it=>it.units.items.forEach(unit=>{
                    if (unit.enemy == build){
                        unit.enemy = null;
                    }
                }))
            }
            this.builds.push(build);
        }
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

    /*drawMarker(canvas: Canvas, pos:Vector, size:number, color:string){
        for (let y = -size; y<size; y++){
            for (let x = -size; x<size; x++){
                if (canvas.canvasBack[ (pos.y + y)]){
                    canvas.canvasBack[ (pos.y + y)][ (pos.x + x)] = color;
                }
            }
        }
    }

    drawUnit(canvas:Canvas, unit:Unit){
        const colorType1 = ["#0ff", "#f90", "#90f", "#ff0", "#f0f", "#9ff"];
        const colorType2 = ["#0fa", "#a90", "#90a", "#fa0", "#f0a", "#9fa"];
        
        this.drawMarker(canvas, unit.pos, 2, (unit.tp==1? colorType1 : colorType2)[unit.playerId]);
        if (unit.rescount){
            this.drawMarker(canvas, unit.pos, 1, "#f00");
        }
    }*/

    processUnits(canvas:Canvas, delta:number, units:ChunkedArray<Unit>, playerIndex: number){
        this.debugIntersectUnitsValidate(units);

        const map1 = this.fillUnitsMap();

        let updatedTree = false;
        let updatedCounter =0;
        if (!this.utracer){
            this.utracer = new TwoLevelHPA(this.map);
            //this.tracers.push(this.utracer);
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

            //this.drawMarker(canvas, pos, 2, ["#0ff", "#f90", "#90f", "#ff0", "#f0f", "#9ff"][playerIndex]);
            //this.drawUnit(canvas, unit);
            unit.render(canvas);
            const drawPath = this.model.data.drawPath;
            if (unit.path && drawPath){
                unit.path.forEach((pos)=>{
                    canvas.canvasBack[(pos.y)][(pos.x)] = '#fffe';
                });
            }
            
            
        })
        this.utracer && updatedTree && this.utracer.updateTree(ps.map(it=> ({pos:it.pos, val:0})))

        this.builds.forEach(build=>{
            build.tick(delta);
            build.render(canvas);
            //const pos = build.pos;
           // this.drawMarker(canvas, pos, 2, "#909");
        })
    }
}


function generateUnits(model: MenuModel, player:Player, tracer:TwoLevelHPA, indMap:Array2d, map:Array2d, count:number, getEnemies: ()=>Array<Build | Unit>, defendEnemies: ()=>Array<Build | Unit>, tp:number){
    //const units: Array<Unit> = [];
    for (let i=0; i<count; i++){
        const pos = new Vector(Math.floor(Math.random() * mapSize), Math.floor(Math.random() * mapSize));
        if (map[pos.y][pos.x]!=0){
            i--;
            continue;
        }
        const unit = new Unit(tracer, pos, indMap, model, Math.random()<0.5? 0: 1, player.id, tp);
        model.setData(last=>({...last, spawned: last.spawned+1, count: last.count+1}))
        unit.onReload = ()=>{
            if (unit.enemy!=player.builds[0]){
                unit.trace(player.builds[0]);
            }
        }
        unit.onIdle = ()=>{
            let closestEnemy:Build|Unit = null;
            let dist = maxValue;
            getEnemies().forEach(enemy=>{
                if (enemy.pos.clone().sub(unit.pos).abs()<dist){
                    const dst = enemy.pos.clone().sub(unit.pos).abs();
                    const atks = player.units.items.reduce(((ac, it)=>ac + (it.enemy == enemy ? 1 : 0)), 0);
                    //if (atks<3) {
                    dist = dst + atks * 50;
                    closestEnemy = enemy;
                    //}
                }
            });
            if (closestEnemy){
                unit.trace(closestEnemy);
            } else {
                unit.path = [];
            }
        }
        unit.onDestroy = ()=>{
            const enemies = defendEnemies();//this.eUnits.items;/// all enemies
            player.units.removeItem(unit);
            //console.log('destroy unit ', units.length, enemies.length);
            enemies.forEach(unit1=>{
                if (unit1 instanceof Unit){
                    if (unit1.enemy == unit){ 
                        unit1.enemy = null;
                        unit1.path = null;
                    }
                }
            })
            model.setData((last)=> ({...last, destroyed: last.destroyed+1, count: last.count-1}));
        }
        player.units.addItem(unit);
        //units.push(unit);
    }
    //const cUnits = new ChunkedArray(units, mapSize);
    //return cUnits;
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
    model: MenuModel;
    menu: Menu;
    game: Game;
    //eUnits: ChunkedArray<Unit>;

    constructor(parentNode: HTMLElement) {        
        this.model = new MenuModel({
            drawPath: true,
            unitStepTime: 50,
            destroyed: 0,
            count:0,
            spawned: 0,
            players: [{money:0}, {money:0}, {money:0}]
        })
        this.menu = new Menu(parentNode, this.model);
        this.canvas = new Canvas(parentNode, this.render, mapSize);

        this.build().then(() => {
            this.canvas.startRender();
        });
    }

    destroy(){
        this.canvas.destroy();
        this.menu.destroy();
    }

    async build() {
        const image = await loadImage(mapFile);
        const map = getMapFromImageData(getImageData(image));
        this.game = new Game(map, this.model);

        const tileSize = 2;

        this.canvas.onClick = (e)=>{
            const vector = new Vector(Math.round(e.offsetX / tileSize), Math.round(e.offsetY / tileSize));
            const changed:Array<{pos:Vector, val:number}> = [];
            for (let y1 = -12; y1<12; y1++){
                for (let x1 = -12; x1<12; x1++){
                    changed.push({pos: new Vector(vector.x + x1, vector.y +y1), val: 0 })
                    this.game.map[vector.y +y1][vector.x + x1] = 0;
                }
            }

            if (changed.length){
                this.game.updateTracers(changed);
            }
        }

        this.canvas.onMove = (e)=>{
            const vector = new Vector(Math.round(e.offsetX / tileSize), Math.round(e.offsetY / tileSize));
        }
    }

    visualize(){
        const tileSize = 2;
        const ctx = this.canvas.ctx;
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

    render = (ctx: CanvasRenderingContext2D, delta:number)=>{
        this.game.render(this.canvas, delta);
        this.visualize();
    }
}
