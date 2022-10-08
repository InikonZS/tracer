import { deleteElementFromArray } from "../tracelib/traceCore/chunkedArray";

class SysRoot{
    items: Array<SysItem> = [];
    constructor(){
    
    }

    createItem(Ctor: typeof SysItem){
        const item = new Ctor(this);
        this.items.push(item);
    }

    tick(delta:number){
        this.items.forEach(it=> it.tick(delta));
    }

    removeChild(item: SysItem){
        deleteElementFromArray(this.items, item);
    }
}

class SysItem{
    private owner: SysRoot;
    type: string;
    constructor(owner: SysRoot){
        this.owner = owner;
    }

    tick(delta:number){

    }

    damage(attacker: SysItem){
        switch (attacker.type){
            case '': {

                break;
            }
            default: {

            }
        }
    }

    destroy(){
        this.owner.removeChild(this);
    }
}

const root = new SysRoot();
root.createItem(SysItem);