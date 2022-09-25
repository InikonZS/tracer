import { Vector } from "../../../common/vector";
import { IChunk } from "../traceCore/traceTree";
import { getIsolatedChunks } from "../traceCore/traceChunks";
import { Array2d, getEmptyIndexationMap } from "../traceCore/traceTools";
import { getChunkTree, getHash } from "../traceCore/traceTree";
import { dublicateChunkTree, updateChunkTree } from "../traceCore/updateTree";
import { chunkIndexate, findChunkPath, getLimitPathMap, limitTree } from "../traceCore/findChunkPath";
import { findPath, indexate } from "../traceCore/tracerBase";

export class SimpleWave{
    map: number[][];
    chunks: []

    constructor(map: number[][]){
        this.map = map;
    }

    updateTree(changed: Array<{ pos: Vector, val: number }>){

    }

    trace(startPoint: Vector, endPoint: Vector):{ph:Vector[], ch:IChunk[]}{
        const mp = getEmptyIndexationMap(this.map);
        indexate(mp, [startPoint], 0);
        const result = findPath(mp, startPoint, endPoint);
        return {ph:result, ch:[]};
    }
}