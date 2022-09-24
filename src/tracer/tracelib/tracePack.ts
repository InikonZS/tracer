import { Vector } from "../../common/vector";
import { findPath, indexate, indexate2 } from "./tracer";
import { chunkIndexate, dublicateChunkTree, findChunkPath, getChunkTree, getHash, getIsolatedChunks, getLimitPathMap, IChunk, limitTree, updateChunkTree } from "./getIsolated";

export interface ITracer {
    updateTrees: (changed: Array<{
        pos: Vector;
        val: number;
    }>) => void;
    trace: (startPoint: Vector, endPoint: Vector)=>{
        ch: IChunk[];
        ph: Vector[];
    },
    getInternal: () => {
        chunks: number[][][][]
    }
}

export function createTracer(map: number[][]): ITracer {
    const chunks = getIsolatedChunks(map, 16)
    const traceTreeInitial = getChunkTree(chunks);

    const chunks2 = getIsolatedChunks(map, 64)
    const traceTreeInitial2 = getChunkTree(chunks2);

    const getHashByVector = (pos: Vector) => {
        const size = chunks[0][0][0].length;
        const z = chunks[Math.floor(pos.y / size)][Math.floor(pos.x / size)][Math.floor(pos.y % size)][Math.floor(pos.x % size)];
        return getHash(Math.floor(pos.x / size), Math.floor(pos.y / size), z);//`${Math.floor(pos.x / size)}_${Math.floor(pos.y / size)}_${z}`
    }

    const getHashByVector2 = (pos: Vector) => {
        const size = chunks2[0][0][0].length;
        const z = chunks2[Math.floor(pos.y / size)][Math.floor(pos.x / size)][Math.floor(pos.y % size)][Math.floor(pos.x % size)];
        return getHash(Math.floor(pos.x / size), Math.floor(pos.y / size), z);//`${Math.floor(pos.x / size)}_${Math.floor(pos.y / size)}_${z}`
    }

    const updateTrees = (changed: Array<{ pos: Vector, val: number }>) => {
        updateChunkTree(map, chunks, traceTreeInitial, changed);
        updateChunkTree(map, chunks2, traceTreeInitial2, changed);
    }

    let lastIndexed: {vector:Vector, trace: (endPoint:Vector)=>{
        ch: IChunk[];
        ph: Vector[];
    }} = null

    const [tracep, clearCache] = cachedTracep1();
    const indexate = (startPoint: Vector, endPoint: Vector)=>{
        if (lastIndexed && lastIndexed.vector.x == startPoint.x && lastIndexed.vector.y == startPoint.y){
            return (point:Vector)=>{
                const res = lastIndexed.trace(point);
                if (res.ph.length == 0){
                    lastIndexed = null
                    clearCache();
                    indexate(startPoint, point);
                }
                return res;
            }
        } else {
            const trace = tracep(startPoint, endPoint, traceTreeInitial, chunks, traceTreeInitial2, chunks2, map, getHashByVector, getHashByVector2);
            lastIndexed = {
                vector: startPoint.clone(),
                trace: trace
            } 
            return trace;
        }
       
    }

    const trace = (startPoint: Vector, endPoint: Vector)=>{
        const res =  indexate(startPoint, endPoint)(endPoint);
        return res;
    }

    const getInternal = () => {
        return { chunks }
    }

    return { updateTrees, trace, getInternal }
}

function cachedTracep1():[(startPoint: Vector, endPoint: Vector, tree: Record<string, IChunk>, chunks: number[][][][], tree2: Record<string, IChunk>, chunks2: number[][][][], map: number[][], getHashByVector: (pos: Vector) => string | number, getHashByVector2: (pos: Vector) => string | number)=> (endPoint:Vector)=>{ ch: IChunk[], ph: Vector[] }, ()=>void]{
let lastHash2:string|number = '';
let lastTree2: Record<string, IChunk> = null;

function tracep1(startPoint: Vector, endPoint: Vector, tree: Record<string, IChunk>, chunks: number[][][][], tree2: Record<string, IChunk>, chunks2: number[][][][], map: number[][], getHashByVector: (pos: Vector) => string | number, getHashByVector2: (pos: Vector) => string | number): (endPoint:Vector)=>{ ch: IChunk[], ph: Vector[] } {
    if (!(startPoint.y < map.length && startPoint.x < map[0].length && startPoint.x >= 0 && startPoint.y >= 0)) {
        return ()=>({ ch: [], ph: [] })
    }
    if (!(endPoint.y < map.length && endPoint.x < map[0].length && endPoint.x >= 0 && endPoint.y >= 0)) {
        return ()=>({ ch: [], ph: [] })
    }
    const verbose = false;
    const startTime = verbose && Date.now() || 0;

    const traceTree2 = dublicateChunkTree(tree2)
    chunkIndexate(traceTree2, [getHashByVector2(startPoint)], 0);
    const hash2 = getHashByVector2(endPoint);
    let traceTree;
    if (hash2 != lastHash2 || !lastTree2){
        console.log('reindex 2');
        lastHash2 = hash2;
        const chunkPath2 = findChunkPath(traceTree2, hash2) || [];
        const start2 = getHashByVector2(startPoint)
        if (chunkPath2.length <= 0) {
            return ()=>({ ch: [], ph: [] });
        }
        if (start2 && traceTree2[start2]) {
            chunkPath2.push(traceTree2[start2])
        }

        verbose && console.log('chunk tree ', Date.now() - startTime);
        traceTree = limitTree(tree, chunkPath2, chunks2[0][0][0].length, chunks[0][0][0].length); 
        verbose && console.log('chunk tree ', Date.now() - startTime);
        chunkIndexate(traceTree, [getHashByVector(startPoint)], 0);
        lastTree2 = traceTree;
    } else {
        traceTree = lastTree2;
    }
   

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
    return (endPoint: Vector)=>{
        if (!(endPoint.y < map.length && endPoint.x < map[0].length && endPoint.x >= 0 && endPoint.y >= 0)) {
            return { ch: [], ph: [] }
        }
        const path = findPath(lm, startPoint, endPoint) || [];
        verbose && console.log('result path ', Date.now() - startTime);
        return { ch: chunkPath, ph: path };
    }
}
return [tracep1, ()=>{lastTree2 = null}];
}