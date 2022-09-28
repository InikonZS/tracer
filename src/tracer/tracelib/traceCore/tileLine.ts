import { Vector } from "../../../common/vector";

export function tileLine(start:Vector, finish:Vector, onPlot:(x:number, y: number)=>void):number{
    let x1 = finish.x;
    let y1 = finish.y;
    let x0 = start.x;
    let y0 = start.y;

    var steep = Math.abs(y1 - y0) > Math.abs(x1 - x0); // Проверяем рост отрезка по оси икс и по оси игрек
    // Отражаем линию по диагонали, если угол наклона слишком большой
    if (steep){
        x0 = y0;
        y0 = start.x;
        x1 = y1;
        y1 = finish.x;
    }
    // Если линия растёт не слева направо, то меняем начало и конец отрезка местами
    if (x0 > x1){
        let b = 0;
        b = x0;
        x0 = x1;
        x1 = b;

        b=y0;
        y0 = y1;
        y1 = b;
    }

    let deltax = Math.abs(x1 - x0)
    let deltay = Math.abs(y1 - y0)
    let error = 0
    let deltaerr = (deltay + 1)
    let y = y0
    let diry = y1 - y0
    if (diry > 0) {
        diry = 1
    }
    if (diry < 0){
        diry = -1
    }
    for (let x= x0; x<= x1; x++){
        onPlot(steep ? y : x, steep ? x : y);
        error = error + deltaerr
        if (error >= (deltax + 1)){
            y = y + diry
            error = error - (deltax + 1)
        }
    }
    return x0-x1;
  }