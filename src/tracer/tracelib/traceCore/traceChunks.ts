import { IVector, Vector } from "../../../common/vector";
import { steps, stepsDiagonal, stepsOrthogonal } from "./traceSteps";
import { getIsolated } from "./traceTools";

export function getChunks(map: Array<Array<number>>, chunkSize: number) {
    const chunks: number[][][][] = [];
    for (let i = 0; i < map.length; i += chunkSize) {
        const chunksRow: number[][][] = [];
        for (let j = 0; j < map[i].length; j += chunkSize) {
            const chunk: Array<Array<number>> = [];
            for (let ii = 0; ii < chunkSize; ii += 1) {
                const chunkRow: Array<number> = [];
                for (let jj = 0; jj < chunkSize; jj += 1) {
                    chunkRow.push(map[i + ii][j + jj]);
                }
                chunk.push(chunkRow);
            }
            chunksRow.push(chunk);
        }
        chunks.push(chunksRow);
    }
    return chunks;
}

export function getChunk(map: Array<Array<number>>, pos: Vector, chunkSize: number) {
    const chunk: number[][] = [];
    for (let y = 0; y < chunkSize; y += 1) {
        const chunkRow: Array<number> = [];
        const mapYPoint = Math.floor(pos.y / chunkSize) * chunkSize;
        for (let x = 0; x < chunkSize; x += 1) {
            chunkRow.push(map[mapYPoint + y][Math.floor(pos.x / chunkSize) * chunkSize + x]);
        }
        chunk.push(chunkRow);
    }
    return chunk;
}

export function getIsolatedChunks(map: Array<Array<number>>, chunkSize: number) {
    const chunks = getChunks(map, chunkSize);
    return chunks.map((chunkRow, i) => chunkRow.map((chunk, j) => {
        const ch = getIsolated(chunk)
        return ch;
    }));
}

export interface IChunkConnection {
    pos: IVector,
    i: number,
    ci: number
}

export function getConnections(chunks: number[][][][], pos: Vector) {
    const chunk = chunks[pos.y][pos.x];
    const connections: IChunkConnection[] = [];
    const addConnection = (obj: IChunkConnection) => {
        if (connections.find(it => {
            return it.pos.x == obj.pos.x && it.pos.y == obj.pos.y && it.i == obj.i && it.ci == obj.ci
        }) == null) {
            connections.push(obj);
        }
    }
    stepsOrthogonal.forEach(step => {
        const nextVector = pos.clone().add(Vector.fromIVector(step));
        const nextChunk = chunks[nextVector.y]?.[nextVector.x];
        if (!nextChunk) return;
        if (step.x == 1) {
            chunk.forEach((row, y) => {
                const cell = row[row.length - 1];
                const nextCell = nextChunk[y][0];
                if (nextCell < -1 && cell < -1) {
                    addConnection({ pos: nextVector, i: nextCell, ci: cell });
                }
            })
        } else if (step.x == -1) {
            chunk.forEach((row, y) => {
                const cell = row[0];
                const nextCell = nextChunk[y][row.length - 1];
                if (nextCell < -1 && cell < -1) {
                    addConnection({ pos: nextVector, i: nextCell, ci: cell });
                }
            })
        } else if (step.y == 1) {
            chunk[chunk.length - 1].forEach((cell, x) => {
                const nextCell = nextChunk[0][x];
                if (nextCell < -1 && cell < -1) {
                    addConnection({ pos: nextVector, i: nextCell, ci: cell });
                }
            })
        } else if (step.y == -1) {
            chunk[0].forEach((cell, x) => {
                const nextCell = nextChunk[chunk.length - 1][x];
                if (nextCell < -1 && cell < -1) {
                    addConnection({ pos: nextVector, i: nextCell, ci: cell });
                }
            })
        }
    });

    stepsDiagonal.forEach(step => {
        const nextVector = pos.clone().add(Vector.fromIVector(step));
        const nextChunk = chunks[nextVector.y]?.[nextVector.x];
        if (!nextChunk) return;
        if (step.x == 1 && step.y == 1) {
            const cell = chunk[chunk.length - 1][chunk[0].length - 1];
            const nextCell = nextChunk[0][0];
            if (nextCell < -1 && cell < -1) {
                addConnection({ pos: nextVector, i: nextCell, ci: cell });
            }
        } else if (step.x == -1 && step.y == 1) {
            const cell = chunk[chunk.length - 1][0];
            const nextCell = nextChunk[0][nextChunk[0].length - 1];
            if (nextCell < -1 && cell < -1) {
                addConnection({ pos: nextVector, i: nextCell, ci: cell });
            }
        } else if (step.y == -1 && step.x == 1) {
            const cell = chunk[0][chunk[0].length - 1];
            const nextCell = nextChunk[nextChunk.length - 1][0];
            if (nextCell < -1 && cell < -1) {
                addConnection({ pos: nextVector, i: nextCell, ci: cell });
            }
        } else if (step.y == -1 && step.x == -1) {
            const cell = chunk[0][0];
            const nextCell = nextChunk[nextChunk.length - 1][nextChunk[0].length - 1];
            if (nextCell < -1 && cell < -1) {
                addConnection({ pos: nextVector, i: nextCell, ci: cell });
            }
        }
    });
    return connections;
}

export function getAllConnections(chunks:number[][][][]){
    return chunks.map((row, j)=> row.map((chunk, i)=>{
        return getConnections(chunks, new Vector(i, j));
    }));
}