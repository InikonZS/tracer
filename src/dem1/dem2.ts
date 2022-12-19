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
        this.iterInput.node.value = 0.1.toString();
        this.iterInput.node.min = 0.1.toString();
        this.iterInput.node.max = 1.0.toString();
        this.iterInput.node.type = "number";
        this.iterInput.node.step = (0.01).toString();
        this.iterInput.node.oninput = ()=>{
            
        }
        this.objects = new Array(5).fill(null).map(it=>{
            const obj = new PhysicPoint();
            obj.position = new Vector(Math.random()* 200, Math.random()*200);
            obj.radius = 10;
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
            }
            */
            return obj;
        });
        this.canvas = new Canvas(this.node, (ctx, delta)=>{
            const initial = this.objects;/*this.objects.map(it=>{
                const obj = new PhysicPoint();
                obj.position = it.position.clone();
                obj.acceleration = it.acceleration.clone();
                obj.speed = it.speed.clone();
                obj.mass = it.mass;
                obj.radius = it.radius;
                return obj;
            });*/
            for (let i =0; i< 10; i++){
                initial.forEach(it=>{
                    let acc = new Vector(0, 0);
                    const nextItPos = it.getNextPosition(16 * this.iterInput.node.valueAsNumber);
                    initial.forEach(jt=>{
                        if (it == jt){
                            return;
                        }
                        const nextJtPos = jt.getNextPosition(16 * this.iterInput.node.valueAsNumber);
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
                            const res = it.speed.clone().reflect(c1.clone().sub(c2).normalize())
                            if (!Number.isNaN(res.x) && !Number.isNaN(res.y)){

                                acc.add(it.speed.clone().reflect(c1.clone().sub(c2).normalize()).normalize().scale(0.05));
                                //it.speed.reflect(c1.clone().sub(c2).normalize()).scale(0.95);
                                //jt.speed.reflect(c2.clone().sub(c1).normalize()).scale(1);
                            } else {
                                //it.speed.scale(-0.6);
                            }
                            //it.speed.scale(-1);
                            //console.log(i);
                            //it.speed.reflect(c2.clone().sub(c1).normalize());
                        } else {
                            if(it.position.clone().sub(jt.position).abs()<= it.radius +jt.radius){}else{
                        const dist = it.position.clone().scale(-1).add(jt.position).abs();
                        const force = it.position.clone().scale(-1).add(jt.position).normalize().scale(0.5 * (it.mass * jt.mass) / ( dist ** 2));
                        acc.add(force);
                            }
                        }
                    });
                    it.acceleration = acc.scale(1/it.mass).clone();
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
    const times = solveSquare(a, b, c).filter(it=> !(it<= 0) || (it>=1) );
    if (times.length == 0){
        return null;
    }

    const t = Math.min(...times);
    if ((t<= 0) || (t>=1)){
        return null;
    }

    const x1 = x11 + (x12 - x11) * t
    const y1 = y11 + (y12 - y11) * t

    const x2 = x21 + (x22 - x21) * t
    const y2 = y21 + (y22 - y21) * t
    return [x1, y1, x2, y2];
}

function solveSquare(a: number, b:number, c:number){
    const d = b**2 - 4*a*c;
    const res: Array<number> = [];
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