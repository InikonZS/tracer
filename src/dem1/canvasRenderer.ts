import Control from "../common/control";
import { RenderTicker } from "../tracer/testenv/ticker";

export class Canvas extends Control {
    private canvas: Control<HTMLCanvasElement>;
    public ctx: CanvasRenderingContext2D;
    private ticker = new RenderTicker();
    private onRender: (ctx: CanvasRenderingContext2D, delta: number) => void;
    onMove: (e:MouseEvent)=>void;
    onClick: (e:MouseEvent)=>void;

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
        ctx.fillStyle = "#000";
        ctx.fillRect(0, 0, this.canvas.node.width, this.canvas.node.height);
        this.onRender(ctx, delta);
    }

    private autoSize = () => {
        this.canvas.node.width = this.node.clientWidth;
        this.canvas.node.height = this.node.clientHeight;
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