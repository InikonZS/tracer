import { IVector, Vector } from "../../../common/vector";
import { IChunk } from "../traceCore/traceTree";
import { getIsolatedChunks } from "../traceCore/traceChunks";
import { Array2d, maxValue } from "../traceCore/traceTools";
import { getChunkTree, getHash } from "../traceCore/traceTree";
import { dublicateChunkTree, findChunkHashes, updateChunkTree } from "../traceCore/updateTree";
import { chunkIndexate, findChunkPath, getLimitPathMap, iteration } from "../traceCore/findChunkPath";
import { findPath, indexate, iteration as iterationMap } from "../traceCore/tracerBase";

export class TwoLevelHPA{
    chunks: Array2d[][];
    traceTreeInitial: Record<string, IChunk>;
    map: number[][];
    chunksEmpty: Array2d[][];
    reverseTreeInitial: Record<string, IChunk>;

    constructor(map: number[][]){
        this.map = map;
        this.chunks = getIsolatedChunks(map, 16)
        this.traceTreeInitial = getChunkTree(this.chunks);
        
        const reverseMap = map.map(row => row.map(cell => 0));
        this.chunksEmpty = getIsolatedChunks(reverseMap, 16)
        this.reverseTreeInitial = getChunkTree(this.chunksEmpty);
        
    }

    getHashByVector(pos: Vector) {
        const chunks = this.chunks;
        const size = chunks[0][0][0].length;
        const z = chunks[Math.floor(pos.y / size)][Math.floor(pos.x / size)][Math.floor(pos.y % size)][Math.floor(pos.x % size)];
        return getHash(Math.floor(pos.x / size), Math.floor(pos.y / size), z);
    }

    updateTree(changed: Array<{ pos: Vector, val: number }>){
        updateChunkTree(this.map, this.chunks, this.traceTreeInitial, changed);
    }

    trace(startPoint: Vector, endPoint: Vector){
        const result = tracePath(startPoint, endPoint, this.traceTreeInitial, this.reverseTreeInitial, this.chunks, this.chunksEmpty, this.map, (pos:Vector)=>this.getHashByVector(pos));
        return result;
    }
}

//for move and attack
function tracePath(startPoint: Vector, endPoint: Vector, tree: Record<string, IChunk>, reverseTree: Record<string, IChunk>, chunks: number[][][][], chunksEmpty: number[][][][], map: number[][], getHashByVector: (pos: Vector) => string): { ch: IChunk[], ph: Vector[] } {
    if (!(startPoint.y < map.length && startPoint.x < map[0].length && startPoint.x >= 0 && startPoint.y >= 0)) {
        return { ch: [], ph: [] }
    }
    if (!(endPoint.y < map.length && endPoint.x < map[0].length && endPoint.x >= 0 && endPoint.y >= 0)) {
        return { ch: [], ph: [] }
    }
    const verbose = false;
    const startTime = verbose && Date.now() || 0;

    const traceTree = dublicateChunkTree(tree)

    chunkIndexate(traceTree, [getHashByVector(startPoint)], 0);
    verbose && console.log('chunk index ', Date.now() - startTime);

    const getHashByVector2 = (pos: Vector)=> {
        const chunks = chunksEmpty;
        const size = chunks[0][0][0].length;
        const z = chunks[Math.floor(pos.y / size)][Math.floor(pos.x / size)][Math.floor(pos.y % size)][Math.floor(pos.x % size)];
        return getHash(Math.floor(pos.x / size), Math.floor(pos.y / size), z);
    }
    
    const rTree = dublicateChunkTree(reverseTree);
    const endHash = chunkReverseIndexate(rTree, traceTree, [getHashByVector2(endPoint)], 0);

    const resHash = /*traceTree[getHashByVector(endPoint)] ? getHashByVector(endPoint) :*/ endHash;
    const attackChunkPath = findChunkPath(rTree, endHash) || [];
    if (getHashByVector2(endPoint) && rTree[getHashByVector2(endPoint)]) {
        attackChunkPath.push(rTree[getHashByVector2(endPoint)])
    }
    const chunkPath = findChunkPath(traceTree, resHash) || [];
    const start = getHashByVector(startPoint)
    if (start && traceTree[start]) {
        chunkPath.push(traceTree[start])
    }
    verbose && console.log('chunk path ', Date.now() - startTime);
    const lm = getLimitPathMap(chunkPath, chunks, map) as Array<Array<number>>;

    verbose && console.log('limit map ', Date.now() - startTime);
    indexate(lm, [startPoint], 0);
    verbose && console.log('indexate ', Date.now() - startTime);

    const amp = getAttackIndexationMap(map);
    const attackPoint = indexateAttack(amp, lm, [endPoint], 0);
    const result = findPath(lm, startPoint, Vector.fromIVector(attackPoint));

    const path = findPath(lm, startPoint, /*endPoint*/ Vector.fromIVector(attackPoint)) || [];

   // const path = findPath(lm, startPoint, endPoint) || [];
    verbose && console.log('result path ', Date.now() - startTime);
    return { ch: [...chunkPath, ...attackChunkPath], ph: path };
}

function onlyMove(startPoint: Vector, endPoint: Vector, tree: Record<string, IChunk>, chunks: number[][][][], map: number[][], getHashByVector: (pos: Vector) => string): { ch: IChunk[], ph: Vector[] } {
    if (!(startPoint.y < map.length && startPoint.x < map[0].length && startPoint.x >= 0 && startPoint.y >= 0)) {
        return { ch: [], ph: [] }
    }
    if (!(endPoint.y < map.length && endPoint.x < map[0].length && endPoint.x >= 0 && endPoint.y >= 0)) {
        return { ch: [], ph: [] }
    }
    const verbose = false;
    const startTime = verbose && Date.now() || 0;

    const traceTree = dublicateChunkTree(tree)

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

export function chunkReverseIndexate(tree: Record<string, IChunk>, moveTree: Record<string, IChunk>, points: Array<string>, generation: number):string{
    const nextPoints = iteration(tree, points, generation);
    const stopPoint = nextPoints.find(point=>{
        const hashes = findChunkHashes(moveTree, tree[point].original.pos);
        return hashes.find(hash=>{
            return moveTree[hash].index != -1 && moveTree[hash].index != null && moveTree[hash].index != maxValue;
        })  
    })
    if (stopPoint){
        return stopPoint;
    }
    if (!points.length) { return null; }
    return chunkReverseIndexate(tree, moveTree, nextPoints, generation + 1);
}

export function getAttackIndexationMap(map:Array2d): Array2d {
    const indexationMap = map.map(row => row.map(cell => maxValue));
    return indexationMap;
}
  
  export function indexateAttack(map:Array<Array<number>>, moveMap:Array2d, points:Array<{x:number, y:number}>, generation:number):IVector | null{
    const nextPoints = iterationMap(map, points, generation);
    const stopPoint = nextPoints.find(point=>{
        return moveMap[point.y][point.x] != -1 && moveMap[point.y][point.x] != null && moveMap[point.y][point.x] != maxValue;
    })
    if (stopPoint){
        return stopPoint;
    }
    if (!points.length) { return null; }
    return indexateAttack(map, moveMap, nextPoints, generation+1);
  }