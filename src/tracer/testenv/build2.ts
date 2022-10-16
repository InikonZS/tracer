import { Vector } from "../../common/vector";
import { deleteElementFromArray } from "../tracelib/traceCore/chunkedArray";
import { Game } from "./animated2";
import { Canvas } from "./canvasRenderer";
import { DefaultBuild, DefaultGameObject } from "./defaultUnit";
import { ITechBuild } from "./techController";
import { mask } from "./unit";

export class Build extends DefaultBuild{
    pos: Vector;
    health: number;
    tm:number = 0;
    destroyed: boolean = false;
    //onDestroy: (by:Unit)=>void;
    playerId: number;
    mask = mask;
    ti: ITechBuild;
    //map: number[][];
    constructor(game: Game, pos: Vector, playerId:number){
        super(game, pos, playerId);
        this.health = 100;
        this.pos = pos;
        this.playerId = playerId;
    }

    tick(delta:number){
        
    }

    render(canvas: Canvas){
        const pos = this.pos;
        this.drawMarker(canvas, pos, 2, "#909");
    }

    damage(by:DefaultGameObject){
        if (this.destroyed){
            console.log('damage destroyed')
            return;
        }
        this.health -=10;
        if (this.health<=0){
            this.health = 0;
            this.destroyed = true;
            this.onDestroy?.(by);
        }
    }

    drawMarker(canvas: Canvas, pos:Vector, size:number, color:string){
        for (let y = -size; y<size; y++){
            for (let x = -size; x<size; x++){
                if (canvas.canvasBack[ (pos.y + y)]){
                    canvas.canvasBack[ (pos.y + y)][ (pos.x + x)] = color;
                }
            }
        }
    }
}

export class BuildOreFactory extends Build{
    //pos: Vector;
    //health: number;
    tm:number = 0;
    destroyed: boolean = false;
    //onDestroy: (by:Unit)=>void;
    //onDamage: (by:Unit | DefaultUnit)=>void;
    //map: number[][];
    constructor(game: Game, pos: Vector, playerId: number){
        super(game, pos, playerId);
        this.health = 100;
        this.pos = pos;
    }

    tick(delta:number){
        
    }

    render(canvas:Canvas){
        this.drawMarker(canvas, this.pos, 4, ["#0ff", "#f90", "#90f", "#ff0", "#f0f", "#9ff"][this.playerId])
    }

    damage(by:){
        if (this.destroyed){
            console.log('damage destroyed')
            return;
        }
        //this.health -=10;
        if (this.health<=0){
            this.health = 0;
            this.destroyed = true;
            this.onDestroy?.(by);
        }
        this.onDamage?.(by);
    }

    onDamage(by: DefaultGameObject){

    }
}

export class BuildAttack extends Build{
    //pos: Vector;
    //health: number;
    tm:number = 0;
    destroyed: boolean = false;
    //onDestroy: (by:Unit)=>void;
    //onDamage: (by:Unit)=>void;
    //private game: Game;
    enemy: DefaultGameObject;
    attactCounter: number =0;
    
    //map: number[][];
    constructor(game: Game, pos: Vector, playerId: number, ti?:ITechBuild){
        super(game, pos, playerId);
        this.health = 100;
        this.pos = pos;
        this.game = game;
        this.ti = ti;
        if (ti){
            this.mask = ti.mtx.map(row=>row.map(cell=> cell=='0'?0:1));
        }
    }

    tick(delta:number){
        if (!this.enemy){
            this.attactCounter = 0;
            this.game.players.forEach(it=>{
                const enemies = it.units.getWithClosestItems(this.pos);
                const enemy = enemies.find(en=> en.playerId != this.playerId && (en.pos.clone().sub(this.pos).abs() < 20));
                if (enemy){
                    this.enemy = enemy as DefaultGameObject;
                    //console.log('enemy in radius');
                }
            })   
        } else {
            this.attactCounter+=delta;
            if (this.attactCounter>2500){
                this.attactCounter = 0;
                this.enemy.damage(this);
                //console.log('enemy in radius damaged');
                this.enemy = null;
            }
        }
    }

    render(canvas:Canvas){
        //this.drawMarker(canvas, this.pos, 3, ["#0ff", "#f90", "#90f", "#ff0", "#f0f", "#9ff"][this.playerId])
        this.mask.forEach((row, y)=>{
            row.forEach((cell, x)=>{
                if (this.mask[y][x] != 0){
                    const canvasRow = canvas.canvasBack[(this.pos.y + y)];
                    if (canvasRow){
                        canvasRow [(this.pos.x + x)] = ["#0ff", "#f90", "#90f", "#ff0", "#f0f", "#9ff"][this.playerId];//['#09f', '#f00'][cell];
                    }
                }
            })
        })
        if (this.enemy){
            this.drawMarker(canvas, this.enemy.pos, 3, "#f00")
        }
    }

    damage(by:DefaultGameObject){
        if (this.destroyed){
            console.log('damage destroyed')
            return;
        }
        this.health -=10;
        if (this.health<=0){
            this.health = 0;
            this.destroyed = true;
            deleteElementFromArray(this.game.players.find(pl => pl.id == this.playerId).builds, this);
            this.onDestroy?.(by);
        }
        this.onDamage?.(by);
    }

    onDamage(by: DefaultGameObject){
        
    }
}
