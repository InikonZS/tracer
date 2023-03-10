import Control from "../common/control";
import { Vector } from "../common/vector";
import {Canvas} from "./canvasRenderer";

export class Dem1 extends Control{
    canvas: Canvas;
    objects: PhysicPoint[];
    iterInput: Control<HTMLInputElement>;

    constructor(parentNode: HTMLElement){
        super(parentNode);
        this.iterInput = new Control<HTMLInputElement>(this.node, 'input');
        this.iterInput.node.value = 0.01.toString();
        this.iterInput.node.min = 0.01.toString();
        this.iterInput.node.max = 1.0.toString();
        this.iterInput.node.type = "number";
        this.iterInput.node.step = (0.01).toString();
        this.iterInput.node.oninput = ()=>{
            
        }
        this.objects = new Array(13).fill(null).map((it, i)=>{
            const obj = new PhysicPoint();
            obj.position = new Vector(Math.random()* 600, Math.random()*500);
            //obj.speed = new Vector((Math.random()-0.5)* 0.1 , (Math.random()-0.5)*0.1)
            obj.radius = 2;
            obj.mass = 0.001
            if (i<4){
                obj.mass = 1;
                obj.radius = 4;
            }
            if (i<1){
                obj.mass = 30;
                obj.radius = 8;
            }
            
            /*obj.position = new Vector((i+1) *200, 200 + i *0);
            if (i==0){
            obj.speed = new Vector(0.03, 0)
            } else {
                obj.speed = new Vector(-0.07, 0)
            }*/
           /* obj.position = new Vector((i+1) *200, (i+1) *200);
            if (i==0){
                obj.speed = new Vector(-0.005, -0.005)
            } else {
                obj.speed = new Vector(-0.07, -0.070 )
            }*/
           /* if (i==3){
                obj.speed = new Vector(-0.02, 0)
                }*/
            //obj.radius = 10//10*(i+1);
            /*const editor = new PointEditor(this.node);
            editor.massInput.node.value = obj.mass.toString();
            editor.data.mass = obj.mass;
            editor.data.position = obj.position.clone();
            editor.data.speed = obj.speed.clone();
            editor.positionEditor.setData(obj.position.clone());
            editor.speedEditor.setData(obj.speed.clone());
            editor.onInput = (value)=>{
                obj.mass = value.mass;
                obj.position = value.position
                obj.speed = value.speed
            }*/
            
            return obj;
        });
        this.canvas = new Canvas(this.node, (ctx, delta)=>{
            const initial = this.objects;
            /*this.objects.map(it=>{
                const obj = new PhysicPoint();
                obj.position = it.position.clone();
                obj.acceleration = it.acceleration.clone();
                obj.speed = it.speed.clone();
                obj.mass = it.mass;
                obj.radius = it.radius;
                return obj;
            });*/
            for (let i =0; i< 1000; i++){
                //let accs:Array<Array<number>> = [];
                initial.forEach(it=>{
                    let acc = new Vector(0, 0); 
                    const timeStep = 16 * this.iterInput.node.valueAsNumber;
                    const nextItPos = it.getNextPosition(timeStep);
                   
                    
                    //const steps = Math.floor(it.position.clone().sub(_nextItPos).abs())* 10;
                    //const optimalTimeStep = steps == 0 ? timeStep : (timeStep)/ (steps );
                    //const realSteps = steps || 1;
                    //for (let i=0; i<realSteps; i++){
                    initial.forEach(jt=>{
                        //const nextItPos = it.getNextPosition(optimalTimeStep * (i +1));
                        if (it == jt){
                            return;
                        }
                        //const nextJtPos = jt.getNextPosition(optimalTimeStep * (i +1));
                        const nextJtPos = jt.getNextPosition(timeStep);
                        const collision = getCirclesCollision(it.position, nextItPos, it.radius, jt.position, nextJtPos, jt.radius);
                        if (it.position.clone().sub(jt.position).abs()<= it.radius +jt.radius){
                            //console.log('shit');
                            //it.acceleration.add(it.position.clone().sub(jt.position).normalize().scale(5));
                            //return;
                            //jt.acceleration = it.position.clone().sub(jt.position).normalize();
                        }
                        if (collision){
                            ctx.fillStyle = "#505";
                            ctx.beginPath();
                            ctx.ellipse(collision[0], collision[1], it.radius, it.radius, 0, 0, Math.PI*2);
                            ctx.fill();
                            ctx.fillStyle = "#505";
                            ctx.beginPath();
                            ctx.ellipse(collision[2], collision[3], jt.radius, jt.radius, 0, 0, Math.PI*2);
                            ctx.fill();
                            const c1 = new Vector(collision[0], collision[1]);
                            const c2 = new Vector(collision[2], collision[3]);
                            //const res = it.speed.clone().reflect(c1.clone().sub(c2).normalize())
                            //if (!Number.isNaN(res.x) && !Number.isNaN(res.y)){

                                //acc.add(it.speed.clone().reflect(c1.clone().sub(c2).normalize()).normalize().scale(0.05));
                                //it.speed.reflect(c1.clone().sub(c2).normalize()).scale(1);
                                /*const spd1 = jt.speed.clone().add(it.speed).normalize().scale(jt.speed.abs()+it.speed.abs()).reflect(c2.clone().sub(c1).normalize()).scale(1)
                                const spd2 = it.speed.clone().add(jt.speed).normalize().scale(jt.speed.abs()+it.speed.abs()).reflect(c2.clone().sub(c1).normalize()).scale(-1)
                                console.log(spd1, spd2, c2.clone().sub(c1).normalize(), c1.clone().sub(c2).normalize())
                                if (it.position.clone().add(it.speed.clone().add(spd1)).sub(jt.position.clone().add(jt.speed.clone().add(spd2))).abs() < (it.position.clone().add(it.speed.clone().add(spd2)).sub(jt.position.clone().add(jt.speed.clone().add(spd1))).abs())){
                                    it.speed.add(spd2);
                                    jt.speed.add(spd1);
                                } else {
                                    it.speed.add(spd1);
                                    jt.speed.add(spd2);
                                }*/
                                const dt1 = it.speed.clone().sub(jt.speed).dot(it.position.clone().sub(jt.position));
                                const s1 = it.speed.clone().sub(it.position.clone().sub(jt.position).scale((2*jt.mass/(it.mass + jt.mass)) * dt1/(it.position.clone().sub(jt.position).abs()**2)));
                                const dt2 = jt.speed.clone().sub(it.speed).dot(jt.position.clone().sub(it.position));
                                const s2 =jt.speed.clone().sub(jt.position.clone().sub(it.position).scale((2*it.mass/(jt.mass + it.mass)) * dt2/(jt.position.clone().sub(it.position).abs()**2)));
                                it.speed = s1.scale(1.00);
                                jt.speed = s2.scale(1.00);
                                //console.log(c2.clone().sub(c1).normalize(), c1.clone().sub(c2).normalize())
                                //.add(it.speed.clone().reflect(c2.clone().sub(c1).normalize()).scale(1)
                                
                            //} else {
                                //it.speed.scale(-0.6);
                            //}
                            //it.speed.scale(-1);
                            //console.log(i);
                            //it.speed.reflect(c2.clone().sub(c1).normalize());
                        } else {
                            if(it.position.clone().sub(jt.position).abs()<= it.radius +jt.radius){}else{
                        const dist = it.position.clone().scale(-1).add(jt.position).abs();
                        const force = it.position.clone().scale(-1).add(jt.position).normalize().scale(0.5 * (it.mass * jt.mass) / ( dist ** 2));
                        acc.add(force.scale(1));
                            }
                        }
                    });
                    //}
                    it.acceleration = acc.scale(1/it.mass).clone();
/*
                    it.step(optimalTimeStep);
                    ctx.fillStyle = "#900";
                    ctx.fillRect(it.position.x, it.position.y, 2, 2);
                    //it.speed.scale(0.99995);*/
                })

                initial.forEach(it=>{
                    it.step(16 * this.iterInput.node.valueAsNumber);
                    ctx.fillStyle = "#900";
                    ctx.fillRect(it.position.x, it.position.y, 2, 2);
                })
            }
            this.objects.forEach(it=>{
                ctx.fillStyle = "#f00";
                ctx.beginPath();
                ctx.ellipse(it.position.x, it.position.y, it.radius, it.radius, 0, 0, Math.PI*2);
                ctx.fill();
                //ctx.fillRect(it.position.x, it.position.y, 6, 6);
            })
        });
        this.canvas.startRender();
    }

    destroy(): void {
        this.canvas.destroy();
        super.destroy();
    }
}

class VectorEditor extends Control{
    xInput: Control<HTMLInputElement>;
    yInput: Control<HTMLInputElement>;
    onInput: (value: Vector)=>void;
    data: Vector;

    constructor(parentNode: HTMLElement, header: string){
        super(parentNode, 'div', '', header);
        const xBlock = new Control(this.node, 'div', '', 'x: ')
        this.xInput = new Control<HTMLInputElement>(xBlock.node, 'input');
        this.xInput.node.type = "number";
        this.xInput.node.step = (1).toString();
        this.xInput.node.oninput = ()=>{
            this.data.x = this.xInput.node.valueAsNumber
            this.onInput(this.data);
        }
        const yBlock = new Control(this.node, 'div', '', 'y: ')
        this.yInput = new Control<HTMLInputElement>(yBlock.node, 'input');
        this.yInput.node.type = "number";
        this.yInput.node.step = (1).toString();
        this.yInput.node.oninput = ()=>{
            this.data.y = this.yInput.node.valueAsNumber
            this.onInput(this.data);
        }
    }

    setData(vector:Vector){
        this.data = vector;
        this.xInput.node.value = vector.x.toString();
        this.yInput.node.value = vector.y.toString();
    }
}

class PointEditor extends Control{
    massInput: Control<HTMLInputElement>;
    onInput: (data: IPhysic)=>void;
    positionEditor: VectorEditor;
    data: IPhysic = {
        position: new Vector(0,0),
        speed: new Vector(0,0),
        acceleration: new Vector(0,0),
        mass: 0
    }
    speedEditor: VectorEditor;

    constructor(parentNode: HTMLElement){
        super(parentNode);
        this.massInput = new Control<HTMLInputElement>(this.node, 'input');
        this.massInput.node.type = "number";
        this.massInput.node.step = (0.0001).toString();
        this.massInput.node.oninput = ()=>{
           // const lp = this.massInput.node.value.split('.')[1] || "00";
           // this.massInput.node.step = (1 / 10 ** lp.length).toString();
            this.data.mass = this.massInput.node.valueAsNumber;
            this.onInput(this.data);
        }

        this.positionEditor = new VectorEditor(this.node, 'position');
        this.positionEditor.onInput = (value)=>{
            this.data.position = value.clone();
            this.onInput(this.data);
        }
        this.speedEditor = new VectorEditor(this.node, 'speed');
        this.speedEditor.onInput = (value)=>{
            this.data.speed = value.clone();
            this.onInput(this.data);
        }
    }
}

interface IPhysic{
    position: Vector;
    speed: Vector;
    acceleration: Vector;
    mass:number;
}

class PhysicPoint{
    position: Vector;
    speed: Vector;
    acceleration: Vector;
    mass:number;
    radius: number;

    constructor(){
        this.position = new Vector(0, 0);
        this.speed = new Vector(0, 0);
        this.acceleration = new Vector(0, 0);
        this.mass = 1;
        this.radius = 1;
    }

    getNextPosition(time:number){
        const pos = this.position.clone().add(this.speed.clone().scale(time)).add(this.acceleration.clone().scale((time ** 2) / 2));
        return pos;
    }

    step(time:number){
        const pos = this.getNextPosition(time);
        const speed = this.speed.clone().add(this.acceleration.clone().scale(time));
        this.position = pos;
        this.speed = speed;
    }
}


function getCirclesCollision(p11: Vector, p12: Vector, r1: number, p21: Vector, p22: Vector, r2: number): any{
    const {x:x11, y:y11} = p11;
    const {x:x12, y:y12} = p12;
    const {x:x21, y:y21} = p21;
    const {x:x22, y:y22} = p22;

    const a = x11 * x11 + x12 * x12 + y11 * y11 + y12 * y12 + x21 * x21 + x22 * x22 + y21 * y21 + y22 * y22
    + 2 * (- x11 * x12 - x21 * x22 - y11 * y12 - y21 * y22 - x11 * x21 - y11 * y21 + x11 * x22 + y11 * y22 + x12 * x21 + y12 * y21 - x12 * x22 - y12 * y22);
    const b = 2 * (
    - x11 * x11 - x21 * x21 - y11 * y11 - y21 * y21 +
    x11 * x12 + y11 * y12 + x21 * x22 + y21 * y22 - x11 * x22 - y11 * y22 - x12 * x21 - y12 * y21 + 2 * x11 * x21 + 2 * y11 * y21)
    const c = x11 * x11 - 2 * x11 * x21 + x21 * x21 + y11 * y11 - 2 * y11 * y21 + y21 * y21 - (r1 + r2) * (r1 + r2);
    const times1 = solveSquare(a, b, c)//
    if (times1.length){
    //console.log(times1)
    }
    const times = times1.filter(it=> !((it<= 0) || (it>=1)) );
    if (a==0){
        //return null;
    }
    if (times.length == 0){
        //console.log('null')
        return null;
    }

    const t = Math.min(...times);
    /*if ((t<= 0) || (t>=1)){
        //console.log('null')
        return null;
    }*/

    const x1 = x11 + (x12 - x11) * t
    const y1 = y11 + (y12 - y11) * t

    const x2 = x21 + (x22 - x21) * t
    const y2 = y21 + (y22 - y21) * t
    //console.log([x1, y1, x2, y2])
    return [x1, y1, x2, y2];
}

function solveSquare(a: number, b:number, c:number){
    const d = b**2 - 4*a*c;
    const res: Array<number> = [];
    if (a == 0){
        res.push(-c/b);
        return res;
    }
    if (d==0){
        res.push(-b/(2*a));

    }
    if (d>0){
        res.push((-b+ d**0.5)/(2*a));
        res.push((-b- d**0.5)/(2*a));
    }
    return res;
}

(window as any).cc = getCirclesCollision;