import { Vector } from "../../../common/vector";
import { steps } from "./traceSteps";

export interface IPositioned {
    pos: Vector;
}

export function deleteElementFromArray<T>(array:Array<T>, element:T):T | null{
    const index = array.findIndex(it=> it === element);
    if (index !=-1){
        //array.splice(index, 1);
        array[index] = array[array.length - 1];
        array.pop();
        return element;
    }
    return null;
}

export class ChunkedArray<T extends IPositioned>{
    items: Array<T> = [];
    chunks: T[][][];
    chunkSize = 16;
    length:number;
    constructor(items:Array<T>, mapSize:number){
        this.items = items;
        this.chunks = [];
        for (let y = 0; y< mapSize / this.chunkSize; y++){
            const row:T[][] = [];
            for (let x = 0; x< mapSize / this.chunkSize; x++){
                row.push([]);
            }
            this.chunks.push(row);
        }
        items.forEach(it=>{
            const chunk = this.getChunk(it.pos);
            chunk.push(it);
        })
        this.length = items.length;
    }

    updateItem(item:T, lastPos:Vector){
        const lastChunk = this.getChunk(lastPos);
        const chunk = this.getChunk(item.pos);
        if (lastChunk == chunk){
            return;
        }
        const deleted = deleteElementFromArray(lastChunk, item);
        chunk.push(item);
        this.length++;
    }

    getChunk(pos:Vector){
        //console.log(this.length);
        const row = this.chunks[Math.floor(pos.y / this.chunkSize)];
        if (!row){
            return null;
        }
        return row[Math.floor(pos.x / this.chunkSize)]||null;
    }

    getWithClosest(pos:Vector){
        const chunks:T[][] = [this.getChunk(pos.clone())];
        steps.forEach(step=>{
            const chunk = this.getChunk(pos.clone().add(Vector.fromIVector(step).scale(this.chunkSize)));
            if (chunk){
                chunks.push(chunk);
            }
        })
    }

    getWithClosestItems(pos:Vector){
        const items:T[] = [];
        steps.forEach(step=>{
            const chunk = this.getChunk(pos.clone().add(Vector.fromIVector(step).scale(this.chunkSize)));
            if (chunk){
                chunk.forEach(it=>items.push(it));
            }
        })
        this.getChunk(pos.clone()).forEach(it=> items.push(it));

        return items;
    }
}