import Control from "../../common/control";
import { IVector, Vector } from '../../common/vector';
import { Canvas } from "../../tracer/testenv/canvasRenderer";
import { RenderTicker } from '../../tracer/testenv/ticker';

/*export class Canvas extends Control {
    private canvas: Control<HTMLCanvasElement>;
    public ctx: CanvasRenderingContext2D;
    private ticker = new RenderTicker();
    private onRender: (ctx: CanvasRenderingContext2D, delta: number) => void;
    onMove: (e:MouseEvent)=>void;

    constructor(parentNode: HTMLElement, onRender: (ctx: CanvasRenderingContext2D, delta: number) => void) {
        super(parentNode, 'div', 'canvas');
        this.onRender = onRender;

        this.canvas = new Control(this.node, 'canvas');
        this.canvas.node.width = 1200;
        this.canvas.node.height = 600;

        const context = this.canvas.node.getContext('2d');
        if (context == null) {
            throw new Error('Canvas 2d context is not available.');
        }
        this.ctx = context;

        this.canvas.node.onmousemove = (e) => {
            //this.onMove(e);
        }

        this.canvas.node.onclick = (e: MouseEvent) => {

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
}*/

export class MiniMapTestScene {
    private canvas: Canvas;
    private map: Array<Array<number>>;

    destroy(){
        this.canvas.destroy();
    }

    constructor(parentNode: HTMLElement) {
        this.canvas = new Canvas(parentNode, this.render, 128);

        this.build();
    }

    async build() {
        this.map = fill2d1(256);

        showTime(()=>{
            this.map.forEach((row, y)=>{
                row.forEach((cell, x)=>{
                    row[x] = Math.random() < 0.01 ? 1 : (Math.random() < 0.01 ? 0 : row[x]);
                })
            })
        }, [], 10, 'map change ');

        showTime(()=>{
            const newMap = this.map.map((row, y)=>{
            return row.map((cell, x)=>{
                return Math.random() < 0.01 ? 1 : (Math.random() < 0.01 ? 0 : row[x]);
            })
        })
        }, [], 10, 'map dublicate ');
      

        showTime(()=>{
            const tileSize = 3;
            this.map.forEach((row, y)=>{
                row.forEach((cell, x)=>{
                    this.canvas.ctx.fillStyle = ['#ff9', '#f50', '#f0f'][cell] || '#0ff';
                    this.canvas.ctx.fillRect(x * tileSize, y * tileSize, tileSize, tileSize);
                })
            })
        }, [], 10, 'map draw ');

        for (let i=0; i< 5; i++){
            showTime(()=>{
                const tileSize = 3;
                const newMap = this.map.map((row, y)=>{
                    return row.map((cell, x)=>{
                        return Math.random() < 0.01 ? 1 : (Math.random() < 0.01 ? 0 : row[x]);
                    })
                });
                this.map.forEach((row, y)=>{
                    row.forEach((cell, x)=>{ 
                        if (newMap[y][x] !== this.map[y][x]){
                            this.canvas.ctx.fillStyle = ['#ff9', '#f50', '#f0f'][cell] || '#0ff';
                            this.canvas.ctx.fillRect(x * tileSize, y * tileSize, tileSize, tileSize);
                        }
                    })
                })
                this.map = newMap;
            }, [], 10, 'map draw optimized');
        }



    }

    render = (ctx: CanvasRenderingContext2D, delta:number)=>{
        const tileSize = 3;
        if (this.map){

            /*this.map.forEach((row, y)=>{
                row.forEach((cell, x)=>{
                    row[x] = Math.random() < 0.01 ? 1 : (Math.random() < 0.01 ? 0 : row[x]);
                })
            })*/

            const newMap = this.map.map((row, y)=>{
                return row.map((cell, x)=>{
                    return Math.random() < 0.01 ? 1 : (Math.random() < 0.01 ? 0 : row[x]);
                })
            })


            this.map.forEach((row, y)=>{
                row.forEach((cell, x)=>{
                    if (newMap[y][x] !== this.map[y][x]){
                        ctx.fillStyle = ['#ff9', '#f50', '#f0f'][cell] || '#0ff';
                        ctx.fillRect(x * tileSize, y * tileSize, tileSize, tileSize);
                    }
                })
            })

            this.map = newMap;
        }

    }
}

function fill2d1(iterations: number){
    const arr:Array<Array<number>> = new Array(iterations);
    for (let i = 0; i< iterations; i++){
        const row = new Array(iterations);
        for (let j = 0; j< iterations; j++){
            row[j] = 0;
        }
        arr[i] = row;
    }
    return arr;
}

function showTime(func: Function, args: Array<any>, iterations:number = 1, text:string) {
    const startTime = Date.now();
    for (let i = 0; i< iterations; i++){
       func(...args); 
    }  
    console.log(text + ': ', Date.now()-startTime);
}