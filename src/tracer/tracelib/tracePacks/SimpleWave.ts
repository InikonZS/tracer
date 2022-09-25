import { IVector, Vector } from "../../../common/vector";
import { IChunk } from "../traceCore/traceTree";
import { getIsolatedChunks } from "../traceCore/traceChunks";
import { Array2d, getEmptyIndexationMap, maxValue } from "../traceCore/traceTools";
import { getChunkTree, getHash } from "../traceCore/traceTree";
import { dublicateChunkTree, updateChunkTree } from "../traceCore/updateTree";
import { chunkIndexate, findChunkPath, getLimitPathMap, limitTree } from "../traceCore/findChunkPath";
import { findPath, indexate, iteration } from "../traceCore/tracerBase";
import { steps } from "../traceCore/traceSteps";

export class SimpleWave{
    map: number[][];
    chunks: Array2d[][];

    constructor(map: number[][]){
        this.map = map;
        this.chunks = getIsolatedChunks(map, 16)
    }

    updateTree(changed: Array<{ pos: Vector, val: number }>){

    }

    /*trace(startPoint: Vector, endPoint: Vector):{ph:Vector[], ch:IChunk[]}{
        const mp = getEmptyIndexationMap(this.map);
        indexate(mp, [startPoint], 0);
        const result = findPath(mp, startPoint, endPoint);
        return {ph:result, ch:[]};
    }*/

    trace(startPoint: Vector, endPoint: Vector):{ph:Vector[], ch:IChunk[]}{
        const mp = getEmptyIndexationMap(this.map);
        indexate(mp, [startPoint], 0);
        const amp = getAttackIndexationMap(this.map);
        const attackPoint = indexateAttack(amp, mp, [endPoint], 0);
        const result = findPath(mp, startPoint, Vector.fromIVector(attackPoint));
        return {ph:result, ch:[]};
    }
}

export function getAttackIndexationMap(map:Array2d): Array2d {
    const indexationMap = map.map(row => row.map(cell => maxValue));
    return indexationMap;
}
  
  export function indexateAttack(map:Array<Array<number>>, moveMap:Array2d, points:Array<{x:number, y:number}>, generation:number):IVector | null{
    const nextPoints = iteration(map, points, generation);
    const stopPoint = nextPoints.find(point=>{
        return moveMap[point.y][point.x] != -1 && moveMap[point.y][point.x] != null && moveMap[point.y][point.x] != maxValue;
    })
    if (stopPoint){
        return stopPoint;
    }
    if (!points.length) { return null; }
    return indexateAttack(map, moveMap, nextPoints, generation+1);
  }