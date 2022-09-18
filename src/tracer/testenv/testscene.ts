import Control from "../../common/control";
import { IVector, Vector } from '../../common/vector';
import { RenderTicker } from './ticker';
import { getMapFromImageData, getImageData, loadImage } from '../tracelib/imageDataTools';
import mapFile from './assets/map3.png';
import {tracePath} from '../tracelib/tracer';
import {getAreaFromPoint, getChunks, getIsolated, getIsolatedChunks} from '../tracelib/getIsolated';
export class Canvas extends Control {
    private canvas: Control<HTMLCanvasElement>;
    private ctx: CanvasRenderingContext2D;
    private ticker = new RenderTicker();
    private onRender: (ctx: CanvasRenderingContext2D, delta: number) => void;

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
        ctx.fillStyle = "#000";
        ctx.fillRect(0, 0, this.canvas.node.width, this.canvas.node.height);
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

export class TestScene {
    private canvas: Canvas;
    private map: Array<Array<number>>;
    private path: Array<IVector>;
    private startPoint = new Vector(10, 10);
    private endPoint = new Vector(55, 55);
    area: number[][];
    chunks: number[][][][];

    constructor(parentNode: HTMLElement) {
        this.canvas = new Canvas(parentNode, this.render);

        this.build();
    }

    async build() {
        const image = await loadImage(mapFile);
        const map = getMapFromImageData(getImageData(image));
        tracePath(map, this.startPoint, this.endPoint, (path)=>{
            console.log(path);
            this.path = path;
        });
        this.map = map;

        this.area = getIsolated(this.map);//getAreaFromPoint(this.map, this.startPoint, 1);
        console.log(this.area);
        this.chunks = getIsolatedChunks(this.map)//getChunks(this.map);
    }

    render = (ctx: CanvasRenderingContext2D, delta:number)=>{
        const tileSize = 5;
        if (this.map){
            this.map.forEach((row, y)=>{
                row.forEach((cell, x)=>{
                    ctx.fillStyle = ['#fff', '#ff0', '#f0f'][cell] || '#0ff';
                    ctx.fillRect(x * tileSize, y * tileSize, tileSize, tileSize);
                })
            })
        }

        if (this.area){
            this.area.forEach((row, y)=>{
                //console.log(row[0])
                row.forEach((cell, x)=>{
                    if (cell != -1){
                        ctx.fillStyle = ['#0909', '#ff09', '#f0f9'][-(cell + 2)] || '#0ff9';
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
                            if (cell != -1){
                                ctx.fillStyle = ['#0909', '#ff09', '#f0f9', '#5749'][-(cell + 2)] || '#0ff9';
                                //ctx.fillStyle = ['#0909', '#ff09', '#f0f9', '#0ff9', '#5749'][i % 5];
                                ctx.fillRect((j * row.length + x) * tileSize, (i * chunk.length + y) * tileSize, tileSize, tileSize);
                            }
                        })
                    })
                });
            });
        }

        if (this.path){
            this.path.forEach((pos)=>{
                ctx.fillStyle = '#9f99';
                ctx.fillRect(pos.x * tileSize, pos.y * tileSize, tileSize, tileSize);
            })
        }

        ctx.fillStyle = '#9f0';
        ctx.fillRect(this.startPoint.x * tileSize, this.startPoint.y * tileSize, tileSize, tileSize);

        ctx.fillStyle = '#9f0';
        ctx.fillRect(this.endPoint.x * tileSize, this.endPoint.y * tileSize, tileSize, tileSize);
    }
}