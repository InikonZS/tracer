import Signal from "../../common/signal";

export class RenderTicker{
  onTick: Signal<number> = new Signal();

  constructor(){

  }

  startRender(){
    let lastTime: number = null;
    const render = () => {
      requestAnimationFrame((timeStamp) => {
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
}
