import Signal from "../../common/signal";

export class RenderTicker{
  onTick: Signal<number> = new Signal();
  tickId: number = null;

  constructor(){

  }

  startRender(){
    let lastTime: number = null;
    const render = () => {
      this.tickId = requestAnimationFrame((timeStamp) => {
        if (!lastTime) {
          lastTime = timeStamp;
        }
        const delta = timeStamp - lastTime;
        this.onTick.emit(delta);
        lastTime = timeStamp;
        render();
      })
      
    }
    render();
  }

  stop(){
    if (this.tickId !=null){
      cancelAnimationFrame(this.tickId);
      this.tickId = null;
    }
  }
}
