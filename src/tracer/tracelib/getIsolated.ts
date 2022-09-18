import { Vector } from "../../common/vector";
import { indexate } from "./tracer";

export function getIsolated(map: Array<Array<number>>){
    let mp = map.map(it=>it.map(jt=>jt==0?Number.MAX_SAFE_INTEGER:-1));
    let currentId = 0;
    mp.forEach((row, y)=>{
        row.forEach((cell, x)=>{
            if (cell == Number.MAX_SAFE_INTEGER){
                currentId +=1;
                const nextMap = getAreaFromPoint(mp, new Vector(x, y), -currentId -1);
                mp.forEach((row, y)=>{
                    row.forEach((cell, x)=>{
                        row[x] = nextMap.map[y][x];
                    })
                });
            }
        })
    })
    return mp;
    
}

export function getAreaFromPoint(mp: Array<Array<number>>, indexPoint: Vector, areaId:number){
    //let mp = map.map(it=>it.map(jt=>jt==0?Number.MAX_SAFE_INTEGER:-1));
    let isFound = false;
    indexate(mp, [indexPoint], 0);
    const resultMap = mp.map(it=>it.map(jt=>{
        if (jt != Number.MAX_SAFE_INTEGER &&  jt > -1){
            return areaId;
        } else {
            return jt;
        }     
    }));

    return {
        isFound,
        map: resultMap
    }
}

export function getChunks(map: Array<Array<number>>){
    const chunkSize = 32;
    const chunks = [];
    for (let i = 0; i< map.length; i+=chunkSize){
        const chunksRow = [];
        for (let j = 0; j< map[i].length; j+=chunkSize){
            const chunk:Array<Array<number>> = [];
            for (let ii = 0; ii< chunkSize; ii+=1){
                const chunkRow: Array<number> = [];
                for (let jj = 0; jj< chunkSize; jj+=1){
                    chunkRow.push(map[i+ii][j+jj]);
                }
                chunk.push(chunkRow);
            }
            chunksRow.push(/*{
                map:chunk,
                pos: new Vector(j, i)
            }*/chunk);
        }
        chunks.push(chunksRow);
    }
    return chunks;
}

export function getIsolatedChunks(map: Array<Array<number>>){
    const chunks = getChunks(map);
    return chunks.map((chunkRow, i)=>chunkRow.map((chunk, j)=>{
        const ch = getIsolated(chunk)
        return ch;
    }));
}