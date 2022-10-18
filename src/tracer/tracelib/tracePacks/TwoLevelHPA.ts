import { IVector, Vector } from "../../../common/vector";
import { IChunk } from "../traceCore/traceTree";
import { getIsolatedChunks } from "../traceCore/traceChunks";
import { Array2d, maxValue } from "../traceCore/traceTools";
import { getChunkTree, getHash } from "../traceCore/traceTree";
import { dublicateChunkTree, findChunkHashes, updateChunkTree } from "../traceCore/updateTree";
import { chunkIndexate, findChunkPath, getLimitPathMap, iteration } from "../traceCore/findChunkPath";
import { findPath, indexate, iteration as iterationMap } from "../traceCore/tracerBase";
import { tileLine } from '../traceCore/tileLine';
import { getPathBreaks } from "../getIsolated";
import { smoothPath } from "../traceCore/smoothPath";

export class TwoLevelHPA{
    chunks: Array2d[][];
    traceTreeInitial: Record<string, IChunk>;
    map: number[][];
    chunksEmpty: Array2d[][];
    reverseTreeInitial: Record<string, IChunk>;

    constructor(map: number[][]){
        this.map = map.map(it=>it.map(jt=>jt));
        this.chunks = getIsolatedChunks(map, 16)
        this.traceTreeInitial = getChunkTree(this.chunks);
        
        const _reverseMap = map.map(row => row.map(cell => 0));
        reverseMap = _reverseMap;
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
        //const result = onlyMove(startPoint, endPoint, this.traceTreeInitial, this.chunks, this.map, (pos:Vector)=>this.getHashByVector(pos));
        return result;
    }
}

let reverseMap: Array2d;

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
    rTree[getHashByVector2(endPoint)].index =0;
    const endHash = chunkReverseIndexate(rTree, traceTree, [getHashByVector2(endPoint)], 1);
    if(!traceTree[endHash]) return { ch: [], ph: [] };
    //console.log(endHash, traceTree[endHash].index, maxValue);
    const resHash = findChunkPath(traceTree, getHashByVector(endPoint)) ? getHashByVector(endPoint) : endHash;
    const rHash = getHashByVector2(traceTree[endHash].original.pos.clone().scale(chunks[0][0][0].length));
    const attackChunkPath = findChunkPath(rTree, rHash) || [];
    if (getHashByVector2(endPoint) && rTree[getHashByVector2(endPoint)]) {
        //attackChunkPath.push(rTree[getHashByVector2(endPoint)])
    }
    const chunkPath = findChunkPath(traceTree, resHash) || [];
    const start = getHashByVector(startPoint)
    if (start && traceTree[start]) {
        chunkPath.push(traceTree[start])
    }
    //chunkPath.push(reverseTree[endHash]);
    verbose && console.log('chunk path ', Date.now() - startTime);
    const lm = getLimitPathMap([...chunkPath, /*attackChunkPath[attackChunkPath.length-1]*/ ...attackChunkPath], chunks, map) as Array<Array<number>>;

    verbose && console.log('limit map ', Date.now() - startTime);
    indexate(lm, [startPoint], 0);
    verbose && console.log('indexate ', Date.now() - startTime);

    const amp = getAttackIndexationMap(map);
    
    const lmp = getLimitPathMap([...attackChunkPath, ...chunkPath], chunksEmpty, reverseMap) as Array<Array<number>>;
    const attackPoint = indexateAttack(amp, lm, [endPoint], 0, null);//bug in lmp on atack point and _3 and more chunk index
        if(!attackPoint) return { ch: [...chunkPath, ...attackChunkPath], ph: [] };

    const result = findPath(lm, startPoint, Vector.fromIVector(attackPoint.vec));

    const path = findPath(lm, startPoint, /*endPoint*/ Vector.fromIVector(attackPoint.vec)) || [];

   // const path = findPath(lm, startPoint, endPoint) || [];
    verbose && console.log('result path ', Date.now() - startTime);
    return { ch: [...chunkPath, ...attackChunkPath], ph: smoothPath(path, map)};
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
    let rpoint:string = null;
    const stopPoint = nextPoints.find(point=>{
        
        const hashes = findChunkHashes(moveTree, tree[point].original.pos);
        if (point== '5_17_-2'){ 
            //console.log('evil ', hashes);
          //  return false;//
         }
         rpoint =null;
        return hashes.find(hash=>{
            if (moveTree[hash].index == maxValue){
               // console.log('mx');
            }
            const res =(moveTree[hash].index != -1) && (moveTree[hash].index != null) && (moveTree[hash].index != maxValue);
            if ((res == true) ){
                //console.log('br');
                rpoint = hash;
            }
            if (hash== '5_17_-3'){
                // return false;// console.log('evil ', res, moveTree[hash].index);
            }
            return (moveTree[hash].index != -1) && (moveTree[hash].index != null) && (moveTree[hash].index != maxValue);
        });
    })
    if (rpoint){
        if (moveTree[stopPoint].index == maxValue){
console.log(moveTree[stopPoint].index);
        }
        return rpoint;
    } else {
        //console.log('und')
    }
    if (!points.length) { return null; }
    return chunkReverseIndexate(tree, moveTree, nextPoints, generation + 1);
}

export function getAttackIndexationMap(map:Array2d): Array2d {
    const indexationMap = map.map(row => row.map(cell => maxValue));
    return indexationMap;
}
  
  export function indexateAttack2(map:Array<Array<number>>, moveMap:Array2d, points:Array<{x:number, y:number}>, generation:number):IVector | null{
    const nextPoints = iterationMap(map, points, generation);
    const stopPoint = nextPoints.find(point=>{
        return moveMap[point.y][point.x] != -1 && moveMap[point.y][point.x] != null && moveMap[point.y][point.x] != maxValue;
    })
    if (stopPoint){
        return stopPoint;
    }
    if (!points.length) { return null; }
    return indexateAttack2(map, moveMap, nextPoints, generation+1);
  }

  export function indexateAttack(map:Array<Array<number>>, moveMap:Array2d, points:Array<{x:number, y:number}>, generation:number, bestPoint:{vec: Vector, val:number}):{vec: IVector, val:number} | null{
    const nextPoints = iterationMap(map, points, generation);
    let stopPoint = bestPoint;
    nextPoints.forEach(point=>{
        const yes = moveMap[point.y][point.x] != -1 && moveMap[point.y][point.x] != null && moveMap[point.y][point.x] != maxValue;
        if (yes && moveMap[point.y][point.x] < (stopPoint?.val || maxValue)){
            stopPoint = {
                vec: Vector.fromIVector(point),
                val:moveMap[point.y][point.x]
            }
        }
    })
    if (stopPoint && generation>=2){
        return stopPoint;
    }
    if (!points.length) { return null; }
    return indexateAttack(map, moveMap, nextPoints, generation+1, stopPoint);
  }


/*function smoothPath(path:Vector[], map:Array2d){
    //bug with direction of smooth path
    let currentPoint = 0;
    if (path.length<2){
        return path;
    }
    let smPath:Vector[] = [path[0]];
    let spch = [];//[new Vector(100, 100),new Vector(101, 100),new Vector(101, 101)];
   // for (let i=0; i<path.length; i++){
        for (let j=1; j<path.length; j++){
            let intersected = false;
            let intVec:Vector = null;
            const res = tileLine(path[currentPoint], path[j], (x, y)=>{
                if (map[Math.floor(y)][Math.floor(x)] !=0 ){
                    intersected = true;
                    // new Vector(x, y);
                } else {
                    if (intersected == false){
                     //   intVec = path[j]
                    }
                }
            });
            if (intersected){
                currentPoint = j-1;
                //j++;
                intersected = false;

                smPath.push(path[j-1]);
                
                //intVec = null;
               // break;
            }
            //(j % 5 == 0) && smPath.push(path[j])
        }
        smPath.push(path[path.length-1])
        
   //     if (currentPoint==path.length-1){
    
            
   //         break;
    //    }
    //}
    const outPath: Vector[] = [];
    smPath.forEach((pth, i)=>{
        if (i>0){ 
            //console.log('len ', smPath[i-1].clone().sub(smPath[i]).abs());
            const res = tileLine(smPath[i-1], smPath[i], (x, y)=>{
               
                outPath.push(new Vector(x, y));
            });
            //console.log('res ',res);
        }
    })
    if (getPathBreaks(outPath, map).length){
        console.log(getPathBreaks(outPath, map));
    }
    return outPath;
}*/