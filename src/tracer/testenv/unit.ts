import { Vector } from "../../common/vector";
import { getCorrectionPath, indexateCorrect } from "../tracelib/traceCore/correction";
import { smoothPath } from "../tracelib/traceCore/smoothPath";
import { Array2d, maxValue } from "../tracelib/traceCore/traceTools";
import { TwoLevelHPA } from "../tracelib/tracePacks/TwoLevelHPA";
import { Canvas } from "./canvasRenderer";
import { MenuModel } from "./menu-model";

export class Unit{
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
    model: MenuModel;
    type: number;
    playerId: number;
    rescount:number = 0;
    onReload: ()=>void;
    tp: number;
    //map: number[][];
    constructor(tracer: TwoLevelHPA, pos: Vector, indMap:Array2d, model: MenuModel, type:number, playerId:number, tp:number =0){
        this.tracer = tracer;
        this.playerId = playerId;
        //this.map = map;
        this.pos = pos;
        this.path = [];
        this.model = model;
        this.tp = tp;

        this.indMap = indMap;
        this.type = type;
        this.health = 100 * (this.type==0?1 : 5)
    }

    tick(delta:number, map:number[][], getUtracer:()=>TwoLevelHPA){
        const verbose = false;
        if (!this.indMap){
            //
        }
        
        this.tm+=delta;
        if (this.tm>this.model.data.unitStepTime * (this.type==0?1 : 15)){
            this.tm = 0;
            if (this.rescount>=1){
                this.onReload();
            }
            if (this.enemy && this.clickedPoint.clone().sub(this.enemy.pos).abs()>1){
                this.correctPathEnd(this.enemy.pos.clone(), map);
                this.clickedPoint = this.enemy.pos.clone();
            }
            if (this.enemy && this.enemy.health>0 && this.enemy.pos.clone().sub(this.pos).abs() <=10){
                //if (this.enemy.health == 0){
                    //this.enemy = null;
                    //this.path = null;
                //    return;
                //}
                this.enemy.damage(this);
                //return;
                //if (this.enemy.health == 0){
                    //this.enemy = null;
                    //this.path = null;
                //}
            } else
            if (!this.enemy || (this.enemy && (!this.path || this.path.length<=0))){
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
            //this.path.push(next);
            return;
        }
        const {correctPath, correctIndex} = res;
        if (!correctPath){
            console.log('no corrected end');
        }
        if (this.path.length - correctIndex < 0){
            console.log('wrong path length');
        }
        //this.path.length = correctIndex+1;
        const path = this.path.reverse();
        //console.log(correctIndex);
        path.length = path.length - correctIndex/*-1*/;
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

    render(canvas:Canvas){
        this.drawUnit(canvas, this);
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
        //this.onDamage();
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

    drawUnit(canvas:Canvas, unit:Unit){
        const colorType1 = ["#0ff", "#f90", "#90f", "#ff0", "#f0f", "#9ff"];
        const colorType2 = ["#0fa", "#a90", "#90a", "#fa0", "#f0a", "#9fa"];
        
        this.drawMarker(canvas, unit.pos, 2, (unit.tp==1? colorType1 : colorType2)[unit.playerId]);
        if (unit.rescount){
            this.drawMarker(canvas, unit.pos, 1, "#f00");
        }
    }
}

export class Build{
    pos: Vector;
    health: number;
    tm:number = 0;
    destroyed: boolean = false;
    onDestroy: (by:Unit)=>void;
    playerId: number;
    //map: number[][];
    constructor(pos: Vector, playerId:number){
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

    damage(by:Unit){
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
    pos: Vector;
    health: number;
    tm:number = 0;
    destroyed: boolean = false;
    onDestroy: (by:Unit)=>void;
    onDamage: (by:Unit)=>void;
    //map: number[][];
    constructor(pos: Vector, playerId: number){
        super(pos, playerId);
        this.health = 100;
        this.pos = pos;
    }

    tick(delta:number){
        
    }

    render(canvas:Canvas){
        this.drawMarker(canvas, this.pos, 4, ["#0ff", "#f90", "#90f", "#ff0", "#f0f", "#9ff"][this.playerId])
    }

    damage(by:Unit){
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
        this.onDamage(by);
    }

}