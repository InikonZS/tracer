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
   // hashAB: 'a:23234314, b:a'
});

export class Indexed2<T extends Record<string | number, string | number>>{
    private items:Array<T>

    private indexes: Record<keyof T, Record<string | number, Array<T>>> = {} as Record<keyof T, Record<string | number, Array<T>>>;
    private indexFields: Array<keyof T>;
    /* 'a', 'b' */
    constructor(initial:Array<T>, indexFields: Array<keyof T>){
        this.items = initial;
        this.indexFields = indexFields;
        initial.forEach(item=>{
            this.add(item);
            /*indexFields.forEach(index=>{
                if (!this.indexes[index]){
                    this.indexes[index] = {};
                }
                const collection = this.indexes[index];
                if (!collection[item[index]]){
                    collection[item[index]] = [];
                }
                collection[item[index]].push(item);
            })
            */
        });
    }

    add(item:T){
        this.indexFields.forEach(index=>{
            if (!this.indexes[index]){
                this.indexes[index] = {};
            }
            const collection: Record<string | number, Array<T>> = this.indexes[index];
            if (!collection[item[index]]){
                collection[item[index]] = [];
            }
            collection[item[index]].push(item);
        })
    }

    remove(item:T){
       /* if (this.indexes[item.b]){
            deleteElementFromArray(this.indexes[item.b], item);
        }
        deleteElementFromArray(this.items, item);*/
        this.indexFields.forEach(index=>{
            /*if (!this.indexes[index]){
                this.indexes[index] = {};
            }
            const collection = this.indexes[index];
            if (!collection[item[index]]){
                collection[item[index]] = [];
            }*/
            deleteElementFromArray(this.indexes[index][item[index]], item);
            //collection[item[index]].push(item);
        })
        deleteElementFromArray(this.items, item);
    }

    update(item: T, changed:T)/*getItem:(last:T)=>T*/{
        this.remove(item);
        const nextValue = changed;
        this.add(nextValue);
    }

    getIndexed(index:keyof T, value: string | number){
        return this.indexes[index][value];
    }

    getItems(){
        return this.items;
    }
}

export class Indexed<T extends {}>{
    private items:Array<T>
    private indexes: Record<string, Record<string | number, Array<T>>> = {}
    private indexFields: Array<{key: string, indexator: (input: T)=> string | number}>;

    constructor(initial:Array<T>, indexFields: Array<{key: string, indexator: (input: T)=> string | number}>){
        this.items = initial;
        this.indexFields = indexFields;
        initial.forEach(item=>{
            this.add(item);
        });
    }

    add(item:T){
        this.indexFields.forEach(index=>{
            if (!this.indexes[index.key]){
                this.indexes[index.key] = {};
            }
            const collection: Record<string | number, Array<T>> = this.indexes[index.key];
            const hash = index.indexator(item);
            if (!collection[hash]){
                collection[hash] = [];
            }
            collection[hash].push(item);
        })
    }

    remove(item:T){
        this.indexFields.forEach(index=>{
            const collection: Record<string | number, Array<T>> = this.indexes[index.key];
            const hash = index.indexator(item);
            if (!collection[hash]){
                return
            }
            deleteElementFromArray(collection[hash], item);
        })
        deleteElementFromArray(this.items, item);
    }

    update(item: T, changed:T){
        this.remove(item);
        const nextValue = changed;
        this.add(nextValue);
    }

    getIndexed(index:string, value: string){
        return this.indexes[index][value];
    }

    getIndexator(index:string){
        return this.indexFields.find(it=> index == it.key);
    }

    getItems(){
        return this.items;
    }
}
