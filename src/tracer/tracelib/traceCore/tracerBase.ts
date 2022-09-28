import { IVector, Vector } from "../../../common/vector";
import { steps } from "./traceSteps";


export function iteration(map:Array<Array<number>>, points:Array<{x:number, y:number}>, generation:number){
  const nextPoints: Array<{x:number, y:number}> = [];
  if (!points.length) { return; }
  points.forEach(point=>{
    steps.forEach(step=>{
      const px = point.x+step.x;
      const py = point.y+step.y;
      const row = map[py];
      if (row && row[px]!=null && row[px]>generation){
        row[px] = generation;
        /*if (Math.abs(step.x) +Math.abs(step.y) == 2){
          row[px] = generation + 0.5;
        }*/
        nextPoints.push({x:px, y:py});
      }
    })
  });
  return nextPoints;
}

export function indexate(map:Array<Array<number>>, points:Array<{x:number, y:number}>, generation:number){
  const nextPoints = iteration(map, points, generation);
  if (!points.length) { return generation; }
  indexate(map, nextPoints, generation+1);
}


export function findPath(map:Array<Array<number>>, indexPoint:Vector, destPoint:Vector){
  let path:Array<Vector> = [];
  let currentValue = map[destPoint.y][destPoint.x]
  if (currentValue == Number.MAX_SAFE_INTEGER) {
    return null;
  }
  let currentPoint:Vector = destPoint.clone();
  let crashDetector = 10000;
  while (currentValue != 0 && crashDetector>0){
    crashDetector--;
    let nextStep = steps.find(step=>{
      let point = currentPoint.clone().add(Vector.fromIVector(step));
      let result = map[point.y]?.[point.x]!=-1 && map[point.y]?.[point.x]< currentValue;
      if (result){
        currentPoint = point;
        currentValue = map[point.y][point.x];
        path.push(Vector.fromIVector(point));
      }
      return result;
    });
    
  }
if (crashDetector<0){
    throw new Error('Infinity cycle');
  }
  return path;
}

export function inBox(point:Vector, _start:Vector, _end:Vector){
  const start = new Vector(Math.min(_start.x, _end.x), Math.min(_start.y, _end.y));
  const end = new Vector(Math.max(_start.x, _end.x), Math.max(_start.y, _end.y));
  return point.x>start.x && point.y>start.y && point.x<end.x && point.y<end.y;
}