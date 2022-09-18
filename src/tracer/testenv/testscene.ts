import Control from "../../common/control";
import { IVector, Vector } from '../../common/vector';
import { RenderTicker } from './ticker';
import { render } from './render';

export class Canvas extends Control{
  private canvas: Control<HTMLCanvasElement>;
  private ctx: CanvasRenderingContext2D;
  private ticker = new RenderTicker();

  constructor(parentNode: HTMLElement) {
    super(parentNode, 'div', 'canvas');

    this.canvas = new Control(this.node, 'canvas');
    this.canvas.node.width = 1200;
    this.canvas.node.height = 600;

    const context = this.canvas.node.getContext('2d');
    if (context == null){
        throw new Error('Canvas 2d context is not available.');
    }
    this.ctx = context;

    this.canvas.node.onmousemove = (e)=>{

    }

    this.canvas.node.onclick = (e: MouseEvent) => {

    }

    this.canvas.node.oncontextmenu = (e) => {
      e.preventDefault();
    }
    this.canvas.node.onmousedown = (e: MouseEvent) => {
 
    } 

    this.ticker.onTick.add((delta)=>{
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
    render(delta);
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
