import { Vector } from "../../../common/vector";
import { maxValue } from "./traceTools";
import { getHash, IChunk } from "./traceTree";

function iteration(tree: Record<string, IChunk>, points: Array<string>, generation: number) {
    const nextPoints: Array<string> = [];
    if (!points.length) { 
        return []; 
    }
    points.forEach(point => {
        const pointItem = tree[point];
        if (!pointItem) {
            return;
        }
        pointItem.connections.forEach(step => {
            const treeItem = tree[step];
            if (treeItem && treeItem.index > generation) {
                treeItem.index = generation;
                nextPoints.push(step);
            }
        })
    });
    return nextPoints;
}

export function chunkIndexate(tree: Record<string, IChunk>, points: Array<string>, generation: number) {
    const nextPoints = iteration(tree, points, generation);
    if (!points.length) { return generation; }
    chunkIndexate(tree, nextPoints, generation + 1);
}

export function findChunkPath(tree: Record<string , IChunk>, destHash: string) {
    let path: Array<IChunk> = [];
    if (!tree[destHash]) {
        return null;
    }
    let currentValue = tree[destHash].index;
    path.push(tree[destHash]);
    if (currentValue == Number.MAX_SAFE_INTEGER) {
        return null;
    }
    let currentPoint: string = destHash;
    let crashDetector = 10000;
    while (currentValue != 0 && crashDetector > 0) {
        crashDetector--;
        let nextStep = tree[currentPoint].connections.findIndex((step) => {
            if (!tree[step]) {
                return false;
            }
            let result = tree[step].index < currentValue
            if (result) {
                currentPoint = step;
                currentValue = tree[step].index;
                path.push(tree[step]);
            }
            return result;
        });

    }
    if (crashDetector <= 0) {
        throw new Error('Infinity cycle');
    }
    return path;
}

export function limitTree(tree:Record<string | number, IChunk>, chunkPath: IChunk[], cw:number, mw:number){
    const ra = Math.floor(cw / mw);
    const allowed: Record<string | number, boolean> ={}
    chunkPath.forEach(chunk=>{
        const chp = chunk.original.pos;
        allowed[getHash(chp.x, chp.y, 0)] = true;
    });

    const dub:Record<string, IChunk> = {};
    for (let chunkIndex in tree){
        const o = tree[chunkIndex].original.pos;
        const hash = getHash(Math.floor(o.x / ra), Math.floor(o.y / ra), 0);
        if (allowed[hash]){
            dub[chunkIndex] = {...tree[chunkIndex]}
            //delete tree[chunkIndex];
        } 
    }
    return dub;
}

export function getLimitPathMap(chunkPath:IChunk[], chunks: number[][][][], map:Array<Array<number>>){ 
    const mp = new Array(map.length).fill(0).map((it, i)=> new Array(map[i].length).fill(-1));
    const size = chunks[0][0][0].length;
    chunkPath.forEach((chunk)=>{
        const pos = chunk.original.pos;
        const py = pos.y*size;
        const px = pos.x *size;
        const oi = chunk.original.i;
        chunks[pos.y][pos.x].forEach((row, y)=>{
            const my = py + y;
            let mpy = mp[my];
            const mapy = map[my];
            row.forEach((cell, x)=>{
                const mx = px + x;
                if (cell == oi){
                    mpy[mx] = mapy[mx]==0?maxValue:-1
                }
            })
        })
        
    })
    return mp;
}

export function getPathBreaks(path:Array<Vector>, map:number[][]){
    return path.filter(point=>{
        return map[point.y][point.x] != 0;
    })
}