import { deleteElementFromArray } from "../tracelib/traceCore/chunkedArray";

const arr = [
    {
        a: 234,
        b: 'a'
    },
    {
        a: 232434,
        b: 'a'
    },
    {
        a: 23434,
        b: 'b'
    }
    , {
        a: 232314,
        b: 'b'
    }
]

arr.filter(it=> it.b == 'a');

arr.push({
    a: 23234314,
    b: 'a'
});

class Indexed<T extends {
    a: number,
    b: string
}>{
    private items:Array<T>
    private indexes: Record<string, Array<T>> = {}

    constructor(initial:Array<T>){
        this.items = initial;
        initial.forEach(item=>{
            if (!this.indexes[item.b]){
                this.indexes[item.b] = [];
            }
            this.indexes[item.b].push(item);
        });
    }

    add(item:T){
        this.items.push(item);
        if (!this.indexes[item.b]){
            this.indexes[item.b] = [];
        }
        this.indexes[item.b].push(item);
    }

    remove(item:T){
        if (this.indexes[item.b]){
            deleteElementFromArray(this.indexes[item.b], item);
        }
        deleteElementFromArray(this.items, item);
    }

    update(item: T, changed:T)/*getItem:(last:T)=>T*/{
        this.remove(item);
        const nextValue = changed;
        this.add(nextValue);
    }

    getIndexed(value: string){
        return this.indexes[value];
    }

    getItems(){
        return this.items;
    }
}

//update(current, (current)=> ({...current, sd:'ds'}))