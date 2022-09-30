import Control from "../../common/control";
import Signal from "../../common/signal";
import { Vector } from "../../common/vector";
import './style.css';

export class Demo{
    constructor(parentNode:HTMLElement){
        const wrapper = document.createElement('div');
        parentNode.append(wrapper);

        const model = new Model(data);
        const view = new View(wrapper, model);
        const scoreView = new ScoreView(wrapper, model);
        const btn = new Control(wrapper, 'button', '', 'add');
        btn.node.onclick = ()=>{
            const view = new View(wrapper, model);
            const scoreView = new ScoreView(wrapper, model);
            const removeBtn = new Control(wrapper, 'button', '', 'remove');
            removeBtn.node.onclick = ()=>{
                view.destroy();
                scoreView.destroy();
                removeBtn.destroy();
            }
        }
        /*const view1 = new View(wrapper, model);
        const view2 = new View(wrapper, model);*/
    }
}

class ScoreView extends Control{
    model: Model;
    killedView: Control<HTMLElement>;
    constructor(parentNode:HTMLElement, model:Model){
        super(parentNode); 
        this.model = model;
        this.killedView = new Control(this.node);
        model.onChange.add(()=>{
            this.update();
        })
        this.update();
    }

    update(){
        let killed: number = 0;
        this.model.field.forEach(row=>row.forEach(cell=>{
            if (cell.health == 0){
                killed+=1;
            }
        }));
        this.killedView.node.textContent = 'killed ' + killed.toString();
    }
}


class View extends Control{
    field: ICellView[][];

    constructor(parentNode:HTMLElement, model:Model){
        super(parentNode); 
    
        this.field = model.field.map((row, y)=>{
            const rowView = new Control(this.node, 'div', 'row');
            return row.map((cellData, x)=>{
                const ctor = viewMap[cellData.type];
                const view = new ctor(rowView.node, cellData);
                view.update(cellData.health);
                /*view.onClick = ()=>{
                    cellData.damage(5);
                }*/
                return view;
            })
        });

        //model.onChange.add((position)=>{
           // this.field[position.y][position.x].update(model.field[position.y][position.x].health);
        //});
    }

    destroy(): void {
        this.field.forEach(row=>row.forEach(cell=>{
            cell.destroy();
        }))
        super.destroy();
    }
}

interface ICellView{
    onClick: ()=>void;

    handleChange: ()=>void

    update:(data: number)=>void;

    destroy(): void
}

const d:ICellView = {
    onClick: function (): void {
        throw new Error("Function not implemented.");
    },
    handleChange: function (): void {
        throw new Error("Function not implemented.");
    },
    update: function (data: number): void {
        throw new Error("Function not implemented.");
    },
    destroy: function (): void {
        throw new Error("Function not implemented.");
    }
}
class CellView extends Control implements ICellView{
    onClick: ()=>void;
    protected cellModel: CellModel;

    constructor(parentNode:HTMLElement, cellModel: CellModel){
        super(parentNode, 'button', 'cell');
        this.cellModel = cellModel;
        cellModel.onChange.add(this.handleChange);
        this.node.onclick = ()=>{
            this.damage();
            this.onClick?.();
        }
    }

    protected damage(){
        this.cellModel.damage(5);
    }

    handleChange = ()=>{
        this.update(this.cellModel.health);
    }

    update(data: number){
        this.node.textContent = data.toString();
    }

    destroy(): void {
        this.cellModel.onChange.remove(this.handleChange);
        super.destroy();
    }
}

class CellView1 extends CellView{
    constructor(parentNode:HTMLElement, cellModel: CellModel){
        super(parentNode, cellModel);
        this.node.className = 'cell cell1';
    }

    protected damage(): void {
        this.cellModel.damage(10);
    }
}

const data = [
    [1, 2, 1, 0, 2],
    [2, 2, 2, 1, 2],
    [1, 0, 1, 0, 2]
]

class Model{
    field: Array<Array<CellModel>>;
    onChange: Signal<Vector> = new Signal();
    constructor(initial:Array<Array<number>>){
        this.field = initial.map((row, y)=>row.map((cellData, x)=>{
            const cell = new CellModel(cellData);
            cell.onChange.add(()=>{
                this.onChange.emit(new Vector(x, y));
            })
            return cell;
        }))
    }
}

class CellModel{
    health: number;
    type: number;
    onChange: Signal<void> = new Signal();

    constructor(data:number){
        this.type = data;
        this.health = (data + 1) * 10;
    }

    damage(value:number){
        this.health -= value;
        if (this.health<=0){
            this.health = 0;
        }
        this.onChange.emit();
    }
}

const viewMap: Record<number, typeof CellView> = {
    0: CellView,
    1: CellView1,
    2: CellView
};