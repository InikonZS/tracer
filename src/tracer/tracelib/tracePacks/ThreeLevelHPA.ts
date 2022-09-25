import { Vector } from "../../../common/vector";
import { IChunk } from "../traceCore/traceTree";
import { getIsolatedChunks } from "../traceCore/traceChunks";
import { Array2d } from "../traceCore/traceTools";
import { getChunkTree, getHash } from "../traceCore/traceTree";
import { dublicateChunkTree, updateChunkTree } from "../traceCore/updateTree";
import { chunkIndexate, findChunkPath, getLimitPathMap, limitTree } from "../traceCore/findChunkPath";
import { findPath, indexate } from "../traceCore/tracerBase";

export class ThreeLevelHPA{
    chunks: Array2d[][];
    traceTreeInitial: Record<string, IChunk>;
    map: number[][];
    chunks2: Array2d[][];
    traceTreeInitial2: Record<string, IChunk>;

    constructor(map: number[][]){
        this.map = map;
        this.chunks = getIsolatedChunks(map, 8)
        this.traceTreeInitial = getChunkTree(this.chunks);

        this.chunks2 = getIsolatedChunks(map, 64)
        this.traceTreeInitial2 = getChunkTree(this.chunks2);
    }

    private getHashByVector(pos: Vector) {
        const chunks = this.chunks;
        const size = chunks[0][0][0].length;
        const z = chunks[Math.floor(pos.y / size)][Math.floor(pos.x / size)][Math.floor(pos.y % size)][Math.floor(pos.x % size)];
        return getHash(Math.floor(pos.x / size), Math.floor(pos.y / size), z);
    }

    private getHashByVector2 = (pos: Vector) => {
        const chunks2 = this.chunks2;
        const size = chunks2[0][0][0].length;
        const z = chunks2[Math.floor(pos.y / size)][Math.floor(pos.x / size)][Math.floor(pos.y % size)][Math.floor(pos.x % size)];
        return getHash(Math.floor(pos.x / size), Math.floor(pos.y / size), z);
    }

    updateTree(changed: Array<{ pos: Vector, val: number }>){
        updateChunkTree(this.map, this.chunks, this.traceTreeInitial, changed);
        updateChunkTree(this.map, this.chunks2, this.traceTreeInitial2, changed);
    }

    trace(startPoint: Vector, endPoint: Vector){
        const result = tracePath(startPoint, endPoint, this.traceTreeInitial, this.chunks, this.traceTreeInitial2, this.chunks2, this.map, (pos:Vector)=>this.getHashByVector(pos),  (pos:Vector)=>this.getHashByVector2(pos));
        return result;
    }
}

function tracePath(startPoint: Vector, endPoint: Vector, tree: Record<string, IChunk>, chunks: number[][][][], tree2: Record<string, IChunk>, chunks2: number[][][][], map: number[][], getHashByVector: (pos: Vector) => string, getHashByVector2: (pos: Vector) => string): { ch: IChunk[], ph: Vector[] } {
    if (!(startPoint.y < map.length && startPoint.x < map[0].length && startPoint.x >= 0 && startPoint.y >= 0)) {
        return { ch: [], ph: [] }
    }
    if (!(endPoint.y < map.length && endPoint.x < map[0].length && endPoint.x >= 0 && endPoint.y >= 0)) {
        return { ch: [], ph: [] }
    }
    const verbose = false;
    const startTime = verbose && Date.now() || 0;

    const traceTree2 = dublicateChunkTree(tree2)
    chunkIndexate(traceTree2, [getHashByVector2(startPoint)], 0);
    const hash2 = getHashByVector2(endPoint);
    const chunkPath2 = findChunkPath(traceTree2, hash2) || [];
    const start2 = getHashByVector2(startPoint)
    if (chunkPath2.length <= 0) {
        return { ch: [], ph: [] };
    }
    if (start2 && traceTree2[start2]) {
        chunkPath2.push(traceTree2[start2])
    }

    verbose && console.log('chunk tree ', Date.now() - startTime);
    const traceTree = limitTree(tree, chunkPath2, chunks2[0][0][0].length, chunks[0][0][0].length); 
    verbose && console.log('chunk tree ', Date.now() - startTime);
    chunkIndexate(traceTree, [getHashByVector(startPoint)], 0);
   

    verbose && console.log('chunk index ', Date.now() - startTime);

    const chunkPath = findChunkPath(traceTree, getHashByVector(endPoint)) || [];
    const start = getHashByVector(startPoint)
    if (start && traceTree[start]) {
        chunkPath.push(traceTree[start])
    }
    verbose && console.log('chunk path ', Date.now() - startTime);
    const lm = getLimitPathMap(chunkPath, chunks, map) as Array<Array<number>>;

    verbose && console.log('limit map ', Date.now() - startTime);
    indexate(lm, [startPoint], 0);
    verbose && console.log('indexate ', Date.now() - startTime);

    const path = findPath(lm, startPoint, endPoint) || [];
    verbose && console.log('result path ', Date.now() - startTime);
    return { ch: chunkPath, ph: path };
}