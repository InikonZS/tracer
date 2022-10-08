import Control from "../../common/control";
import { RenderTicker } from "./ticker";

export class Canvas extends Control {
    private canvas: Control<HTMLCanvasElement>;
    public ctx: CanvasRenderingContext2D;
    private ticker = new RenderTicker();
    private onRender: (ctx: CanvasRenderingContext2D, delta: number) => void;
    public canvasBackLast: Array<Array<string>>;
    public canvasBack: Array<Array<string>>;
    onMove: (e:MouseEvent)=>void;
    onClick: (e:MouseEvent)=>void;
    mapSize: number;

    constructor(parentNode: HTMLElement, onRender: (ctx: CanvasRenderingContext2D, delta: number) => void, mapSize:number) {
        super(parentNode, 'div', 'canvas');
        this.onRender = onRender;

        this.canvas = new Control(this.node, 'canvas');
        this.canvas.node.width = 1200;
        this.canvas.node.height = 600;

        this.mapSize = mapSize;
        this.canvasBackLast = new Array(mapSize).fill(0).map(it=> new Array(mapSize).fill(undefined));
        this.canvasBack = new Array(mapSize).fill(0).map(it=> new Array(mapSize).fill(0));

        const context = this.canvas.node.getContext('2d');
        if (context == null) {
            throw new Error('Canvas 2d context is not available.');
        }
        this.ctx = context;

        this.canvas.node.onmousemove = (e) => {
            this.onMove(e);
        }

        this.canvas.node.onclick = (e: MouseEvent) => {
            this.onClick(e);
        }

        this.canvas.node.oncontextmenu = (e) => {
            e.preventDefault();
        }
        this.canvas.node.onmousedown = (e: MouseEvent) => {
            
        }

        this.ticker.onTick.add((delta) => {
            this.render(delta);
        });
        // this.ticker.startRender();

        
    }

    render(delta: number) {
        const ctx = this.ctx;
        //ctx.fillStyle = "#000";
        //ctx.fillRect(0, 0, this.canvas.node.width, this.canvas.node.height);
        this.onRender(ctx, delta);
    }

    private autoSize = () => {
        const mapSize = this.mapSize;
        this.canvas.node.width = this.node.clientWidth;
        this.canvas.node.height = this.node.clientHeight;
        this.canvasBackLast = new Array(mapSize).fill(0).map(it=> new Array(mapSize).fill(undefined));
        this.canvasBack = new Array(mapSize).fill(0).map(it=> new Array(mapSize).fill(0));
        this.render(0);
    }

    startRender() {
        this.ticker.startRender();
        window.addEventListener('resize', this.autoSize);
        this.autoSize();
    }

    destroy(): void {
        window.removeEventListener('resize', this.autoSize);
        this.ticker.stop();
        super.destroy();
    }
}