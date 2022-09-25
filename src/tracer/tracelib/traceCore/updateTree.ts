import { Vector } from "../../../common/vector";
import { getChunk, getConnections } from "./traceChunks";
import { steps } from "./traceSteps";
import { getIsolated } from "./traceTools";
import { getHash, IChunk } from "./traceTree";

const getChunkPosByVector = (chunks:number[][][][], pos: Vector)=>{
    const size = chunks[0][0][0].length;
    return new Vector(Math.floor(pos.x / size), Math.floor(pos.y / size));
}

export function getAffected(chunks:number[][][][], tree: Record<string, IChunk>, point: Vector){
    const affectedChunkPos = getChunkPosByVector(chunks, point);
    //make only if border point or restructurized zones;
    return affectedChunkPos
}

export function getClosest(chunks:number[][][][], tree: Record<string, IChunk>, point: Vector){
    //make only if border point or restructurized zones;
    const closest: Array<Vector> = [];
    steps.forEach(step=>{
        const next = point.clone().add(Vector.fromIVector(step));
        const chunk = chunks[next.y]?.[next.x];
        if (chunk){
            closest.push(next)
        }
    });
    return closest;
}

export function findChunkHashes(tree: Record<string, IChunk>, pos:Vector){
    const hashes:Array<string> = [];
    for (let i = -2; i>-100; i--){
        const hash = getHash(pos.x, pos.y, i);
        if (tree[hash]){
            hashes.push(hash);
        } else {
            break;
        }
    }
    return hashes;
}

export function updateChunkTree(map:number[][],chunks:number[][][][], tree: Record<string, IChunk>, points: {pos: Vector, val:number}[]){
    const affected: Vector[] = [];
    const size = chunks[0][0][0].length;
    points.forEach(point=>{
        const affectedChunk = getAffected(chunks, tree, point.pos);
        map[point.pos.y][point.pos.x] = point.val;
        const chunk = getChunk(map, point.pos, size);
        chunks[affectedChunk.y][affectedChunk.x] = getIsolated(chunk);
        if (affected.find(it=> it.x == affectedChunk.x && it.y == affectedChunk.y) == null){
            affected.push(affectedChunk);
        }
    })

    const closest:Vector[] = [];
    affected.forEach(it=>{
        const closestChunks = getClosest(chunks, tree, it);
        closestChunks.forEach(jt=>{
            if (closest.find(iit=> iit.x == jt.x && iit.y == jt.y) == null){
                closest.push(jt);
            }
        })
    });

    const all = [...affected, ...closest];

    const hashes:Array<string| number> = [];
    all.forEach(it=>{
        const newh = findChunkHashes(tree, it);
        newh.forEach(jt=>{
            hashes.push(jt);
        })
    })

    hashes.forEach(hash=>{
        delete tree[hash];
        //tree[hash] = undefined;
    })

    all.forEach((vec, i)=>{
        const connections = getConnections(chunks, vec);
        connections.forEach(z=>{
            tree[getHash(vec.x, vec.y, z.ci)] = {
                index: Number.MAX_SAFE_INTEGER,
                original: {
                    pos: new Vector(vec.x, vec.y),
                    i: z.ci
                },
                connections: connections.filter(it=> it.ci == z.ci).map(it=>getHash(it.pos.x, it.pos.y, it.i))
            }
        })
    });
    return tree;
}

export function dublicateChunkTree(tree: Record<string, IChunk>){
    const dub:Record<string, IChunk> = {};
    for (let key in tree){
        dub[key] = {...tree[key]}
    }
    return dub;
}