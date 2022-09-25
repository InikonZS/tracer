import { Vector } from "../../../common/vector";
import { getAllConnections } from "./traceChunks";
import { maxValue } from "./traceTools";

export function getHash(x: number, y: number, z: number): string {
    return `${x}_${y}_${z}`;
}

export interface IChunk {
    original: {
        pos: Vector,
        i: number
    };
    connections: Array<string>;
    index: number;
}

export function getChunkTree(chunks: number[][][][]) {
    const connections = getAllConnections(chunks);
    const tree: Record<string, IChunk> = {}
    chunks.forEach((row, i) => {
        row.forEach((chunk, j) => {
            connections[i][j].forEach(z => {
                const filteredConnections = connections[i][j]
                    .filter(it => it.ci == z.ci)
                    .map(it => getHash(it.pos.x, it.pos.y, it.i));
                tree[getHash(j, i, z.ci)] = {
                    index: maxValue,
                    original: {
                        pos: new Vector(j, i),
                        i: z.ci
                    },
                    connections: filteredConnections
                }
            })
        })
    })
    return tree;
}