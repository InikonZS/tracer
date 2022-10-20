import { Vector } from "../../common/vector";
import { getCorrectionPath, indexateCorrect } from "../tracelib/traceCore/correction";
import { smoothPath } from "../tracelib/traceCore/smoothPath";
import { Array2d, maxValue } from "../tracelib/traceCore/traceTools";
import { TwoLevelHPA } from "../tracelib/tracePacks/TwoLevelHPA";
import { Game } from "./animated2";
import { Canvas } from "./canvasRenderer";
import { MenuModel } from "./menu-model";
import { Build, Unit } from "./unit";
import { DefaultGameObject, DefaultUnit } from "./defaultUnit"; 

export class UnitTruck extends DefaultUnit{

    getEnemies = ()=>this.getOwnPlayer().getRes();
    defendEnemies = ()=>this.getOwnPlayer().getEnemies();

    protected onReload(){
        //console.log('reload');
        const player = this.getOwnPlayer();
        const oreFactory = player.getOreFactory();
        if (oreFactory){
            if (this.enemy != oreFactory){
                this.trace(oreFactory);
            }
        }
        /*if (this.enemy!=player.builds[0]){
            this.trace(player.builds[0]);
        }*/
    }

    protected onIdle(){
        let closestEnemy:DefaultGameObject = null;
        let unit = this;
        const player = this.getOwnPlayer();
            let dist = maxValue;
            this.getEnemies().forEach(enemy=>{
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
                this.trace(closestEnemy);
            } else {
                this.path = [];
            }
    }

    protected onDestroy(){
        const player = this.getOwnPlayer();
        const enemies = this.defendEnemies();//this.eUnits.items;/// all enemies
        player.units.removeItem(this);
        //console.log('destroy unit ', units.length, enemies.length);
        enemies.forEach(unit1=>{
            if (unit1 instanceof Unit){
                if (unit1.enemy == this){ 
                    unit1.enemy = null;
                    unit1.path = null;
                }
            }
        })
        this.model.setData((last)=> ({...last, destroyed: last.destroyed+1, count: last.count-1}));
    }

    static spawn(){
        
    }
}

export class UnitSoldier extends DefaultUnit{

    //@ts-ignore
    getEnemies = ()=>this.getOwnPlayer().getBuilds().concat(this.getOwnPlayer().getEnemies());;
    defendEnemies = ()=>this.getOwnPlayer().getEnemies();

    protected onReload(){
       /* const player = this.getOwnPlayer();
        if (this.enemy!=player.builds[0]){
            this.trace(player.builds[0]);
        }*/
    }

    protected onIdle(){
        let closestEnemy:DefaultGameObject = null;
        let unit = this;
        const player = this.getOwnPlayer();
            let dist = maxValue;
            this.getEnemies().forEach(enemy=>{
                if (enemy.pos.clone().sub(unit.pos).abs()<dist){
                    const dst = enemy.pos.clone().sub(unit.pos).abs();
                    const atks = player.units.items.reduce(((ac, it)=>ac + (it.enemy == enemy ? 1 : 0)), 0);
                    //if (atks<3) {
                    
                    //}
                    if (this.mode == 'attack'){
                        dist = dst + atks * 50;
                        closestEnemy = enemy;
                    } else {
                        dist = dst;
                        if (dst<=10){
                            closestEnemy = enemy;
                           /* if (!this.returnPoint){
                                this.returnPoint = this.pos.clone();
                                console.log('set return');
                            }*/
                        } else {
                           /* if (this.returnPoint){
                                this.move(this.returnPoint.clone());
                                this.returnPoint = null;
                            }*/
                        }
                    }
                }
            });
            if (this.mode == 'attack'){
                if (closestEnemy){
                    this.trace(closestEnemy);
                } else {
                    this.path = [];
                }
            } else {
                if (closestEnemy){
                    this.trace(closestEnemy);
                }
            }
    }

    protected onDestroy(){
        const player = this.getOwnPlayer();
        const enemies = this.defendEnemies();//this.eUnits.items;/// all enemies
        player.units.removeItem(this);
        //console.log('destroy unit ', units.length, enemies.length);
        enemies.forEach(unit1=>{
            if (unit1 instanceof Unit){
                if (unit1.enemy == this){ 
                    unit1.enemy = null;
                    unit1.path = null;
                }
            }
        })
        this.model.setData((last)=> ({...last, destroyed: last.destroyed+1, count: last.count-1}));
    }

    drawUnit(canvas:Canvas, unit:Unit){
        //const colorType1 = ["#0ff", "#f90", "#90f", "#ff0", "#f0f", "#9ff"];
        const colorType1 = ["#0fa", "#a90", "#90a", "#fa0", "#f0a", "#9fa"];
        
        this.drawMarker(canvas, unit.pos, 2, colorType1[unit.playerId]);
        /*if (unit.rescount){
            this.drawMarker(canvas, unit.pos, 1, "#f00");
        }*/
        for (let i = 0; i< unit.rescount; i++){
            this.drawMarker(canvas, new Vector(unit.pos.x + (i-2)*3, unit.pos.y), 1, "#f00");
        }
        const hlth = (this.health / this.initialHealth) * 5;
        if (hlth> 5 || isNaN(hlth) || hlth ==null){
            throw new Error();
        }
        for (let i = 0; i< hlth; i++){
            this.drawMarker(canvas, new Vector(unit.pos.x + (i-2)*3, unit.pos.y-3), 1, "#0f0");
        }
    }

    static spawn(){
        
    }
}

class A<T extends keyof HTMLElementTagNameMap>{
    node: HTMLElementTagNameMap[T];
    constructor(tag: T){
       this.node = document.createElement(tag); 
    }
}

const el = new A("a");
//el.node
