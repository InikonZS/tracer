import { Vector } from "../../../common/vector";
import { findPath, iteration } from "./tracerBase";
import { Array2d } from "./traceTools";

export function getCorrectionPath(path:Vector[], pos:Vector, indMap:Array2d){
    const verbose = false;
    const correctPoint = indexateCorrect(indMap, path, [pos], 0);
        verbose && console.log('try correct');
        if (!correctPoint){
            verbose && console.log('no correct');
            //this.noCorrectCounter++;
            //this.path.push(next);
            return null;
        }
        const correctIndex = path.findIndex(it=> it.x == correctPoint.x && it.y == correctPoint.y);
        const correctPath = findPath(indMap, pos, correctPoint);
        //this.noCorrectCounter=0;
        verbose && console.log('correct points ', correctPath.length, 'cutted ', path.length - correctIndex);
        //this.path.splice(correctIndex);
        //path.length = correctIndex+1;
        //path = this.path.concat(correctPath);
        return {correctPath, correctIndex};
}

export function indexateCorrect(map:Array<Array<number>>, path:Array<Vector>, points:Array<{x:number, y:number}>, generation:number):Vector | null{
    const nextPoints = iteration(map, points, generation);
    let stopPoint =
    nextPoints.find(point=>{
        const pathPoint = path.find(pp=> pp.x == point.x && pp.y == point.y);
        return pathPoint;
    })
    if (generation>100){
        return null;
    }
    if (stopPoint){
        return Vector.fromIVector(stopPoint);
    }
    if (!points.length) { return null; }
    return indexateCorrect(map, path, nextPoints, generation+1);
  }