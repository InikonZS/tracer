import { Vector } from "../../common/vector";
import { deleteElementFromArray } from "../tracelib/traceCore/chunkedArray";
import { Game } from "./animated2";
import { Canvas } from "./canvasRenderer";
import { DefaultBuild, DefaultGameObject } from "./defaultUnit";
import { ITechBuild } from "./techController";
import { tech } from "./techTree";
import { mask } from "./unit";
import { UnitTruck } from "./unitTruck";

export class Build extends DefaultBuild{
    //pos: Vector;
    //health: number;
    tm:number = 0;
    destroyed: boolean = false;
    //onDestroy: (by:Unit)=>void;
    //playerId: number;
    mask = mask;
    //ti: ITechBuild;
    //map: number[][];
    constructor(game: Game, pos: Vector, playerId:number){
        super(game, pos, playerId);
        this.game = game;
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

export class BuildRes extends Build{
    onDestroy(by: DefaultGameObject){
        if (by instanceof UnitTruck){
            deleteElementFromArray(this.game.builds, this);
            //this.players[by.playerId].money+=1;
            by.rescount +=1;
            //console.log(by.rescount);
            //this.model.setPlayerData(by.playerId, (last)=>({...last, money: this.players[by.playerId].money}));
            this.game.players.forEach(it=>it.units.items.forEach(unit=>{
                if (unit.enemy == this){
                    unit.enemy = null;
                }
            }))
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
        setTimeout(()=>{
          this.onBuild();  
        }, 0)
        
    }

    onBuild(){
        const player = this.getOwnPlayer();
        const bp = this.game.getBuildingPoints([[1]],  player.builds);
        const rnp = bp[Math.floor(Math.random() * bp.length)];
        if (!rnp) {
            console.log('unit spawn error');
            return;
        }
        const buildInfo = tech.units.find(it=>it.name == 'truck');
        if (!buildInfo){
            return;
        }
        const unit = new UnitTruck(this.game, player.tracer, rnp, player.indMap, player.model, player.id);
        player.model.setData(last=>({...last, spawned: last.spawned+1, count: last.count+1}))
    
        player.units.addItem(unit);
    }

    tick(delta:number){
        
    }

    render(canvas:Canvas){
        this.drawMarker(canvas, this.pos, 4, ["#0ff", "#f90", "#90f", "#ff0", "#f0f", "#9ff"][this.playerId])
    }

    damage(by:DefaultGameObject){
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
        if (by instanceof UnitTruck){
            const player = this.getOwnPlayer();
            if (by.rescount>0){
                player.money += by.rescount;
                player.model.setPlayerData(by.playerId, (last)=>({...last, money: player.money}));
                by.rescount = 0;
                by.enemy = null;
                //console.log(by.rescount);
            }
        }
    }
}

export class BuildW extends Build{
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
       /* if (!this.enemy){
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
        }*/
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

export class BuildBarrack extends BuildW{

}

export class BuildCarFactory extends BuildW{
    
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
