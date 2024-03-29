import Control from '../common/control';
import Signal from '../common/signal';


class ItemData implements IItemData{
    title: string;
    price: number;
    id: string;

    static currentId = 1000000;
    static nextId(){
        this.currentId += 1;
        return 'ItemDataId'+this.currentId.toString();
    }

    constructor(data:IItemData){
        this.title = data.title;
        this.price = data.price;
        this.id = /*this.id || */ItemData.nextId(); 
    }
}

export class TodoApp extends Control{
    constructor(parentNode: HTMLElement){
        super(parentNode);
        const el = new Control(this.node, 'div', '', 'hi');

        const appModel = new AppModel({
            items: [{title: 'wert', price: 12}, {title: 'werweerstet', price: 34},]
        });
        ///const appController = new MyServiceAppController(appModel, {});
        const appView = new AppView(this.node, appModel, /*appController*/ {
            add(itemData: IItemData) {
                const newItem = new ItemData(itemData);
                //el.node.textContent = 'ewrtry'
                appModel.setData((last)=> ({...last, items: [...last.items, newItem]}))
            },
            remove(id: string) {
                appModel.setData((last)=> ({...last, items: last.items.filter(it=> it.id !== id)}))
            },
            edit(id:string, itemData:ItemData) {
                appModel.setData((last)=> ({...last, items: last.items.map(it=> {
                   if ( it.id === id){
                        return itemData
                   }
                   return it;
                })}))
            },
        });

    }
}

interface IAppData{
    items: Array<IItemData>
}

interface IAppController{ 
    add: (itemData: IItemData)=>void;
    remove: (id:string)=>void;
    edit: (id:string, itemData:IItemData)=>void;
}

class LocalAppController implements IAppController{
    /*private model: AppModel;
    constructor(model: AppModel){
        this.model = model;
    }*/

    constructor(private model: AppModel){

    }

    add=()=>{
        //this.model.setData((last=> ({...last, items: res}))) 
    }

    remove=()=>{

    }

    edit=()=>{

    }
}

class MyServiceAppController implements IAppController{
    /*private model: AppModel;
    constructor(model: AppModel){
        this.model = model;
    }*/

    constructor(private model: AppModel, private myApi: any){

    }

    add=()=>{
        /*this.myApi.sendRequest().then(res=>{
            this.model.setData((last=> ({...last, items: res})))
        }) */
    }

    remove=()=>{

    }

    edit=()=>{

    }
}

class InputPopup extends Control{
    titleInput: Control<HTMLInputElement>;
    formWrapper: Control<HTMLFormElement>;
    submitButton: Control<HTMLElement>;
    onSubmit: (data:IItemData)=>void;
    id: string;
    constructor(parentNode: HTMLElement){
        super(parentNode);

        this.formWrapper = new Control<HTMLFormElement>(this.node, 'form')

        this.formWrapper.node.onsubmit = (ev)=>{
            ev.preventDefault();
            this.onSubmit(this.getInputData());
        }

        this.titleInput = new Control<HTMLInputElement>(this.formWrapper.node, 'input');
        this.submitButton = new Control(this.formWrapper.node, 'button');
    }

    setInputData(data: IItemData){
        this.id  = data.id;
        this.titleInput.node.value = data.title
    }

    getInputData(){
        return {
            title: this.titleInput.node.value,
            price: 23,
            id: this.id
        }
    }
}

export class AppView extends Control{
    el: Control<HTMLElement>;
    buttonAdd: Control<HTMLButtonElement>;
    model: AppModel;
    listWrapper: Control<HTMLElement>;
    controller: IAppController;
    itemViews: Record<string, TodoItem> = {};
    price: Control<HTMLElement>;

    constructor(parentNode: HTMLElement, model: AppModel, controller: IAppController){
        super(parentNode);
        this.model = model;
        this.controller = controller;
        this.el = new Control(this.node, 'div', '', 'hi');
        this.price = new Control(this.node, 'div', '', 'hi');

        this.buttonAdd = new Control(this.node, 'button', '', 'add');
        this.buttonAdd.node.onclick = ()=>{
            const popup = new InputPopup(this.node);
            popup.onSubmit = (data)=>{
                controller.add(data);//this.handleAdd;
                popup.destroy();
            }
        }
        

        this.listWrapper = new Control(this.node, 'div');

        model.onChange.add(this.update);
        this.update(model.data);
    }
    /*handleAdd = ()=>{
       this.onAdd();     
    }*/

    private addItem(itemData: IItemData){
        const item = new TodoItem(this.listWrapper.node);
        item.onRemoveClick = ()=>{
            this.controller.remove(itemData.id);
            //this.model.setData((last)=> ({...last, items: last.items.filter(it=> it !== itemData)}))
        }

        item.onEditClick = ()=>{
            const popup = new InputPopup(this.node);
            popup.setInputData(this.model.data.items.find(it=> it.id == itemData.id));
            popup.onSubmit = (data)=>{
                this.controller.edit(itemData.id, data);//this.handleAdd;
                popup.destroy();
            }
            //this.controller.remove(itemData);
            //this.model.setData((last)=> ({...last, items: last.items.filter(it=> it !== itemData)}))
        }
        item.update(itemData);
        this.itemViews[itemData.id] = item;
    }

    update=(data: IAppData)=>{
        //this.listWrapper.node.textContent = '';
        this.el.node.textContent = this.model.itemsCount.toString();
        this.price.node.textContent = this.model.itemsPrice.toString();

        const dataMap: Record<string, IItemData> = {};
        data.items.forEach(it=>{
            dataMap[it.id] = it;
        });
        //Object.keys(data.items)
        Object.keys(dataMap).forEach(itemId=>{
            const itemData = dataMap[itemId];
            if (this.itemViews[itemData.id]){
                this.itemViews[itemData.id].update(itemData);
            } else {
                this.addItem(itemData);
            } 
        });
        Object.keys(this.itemViews).forEach(itemId=>{
            if (!dataMap[itemId]){
                this.itemViews[itemId].destroy();  
            }
        });
    }

    destroy(): void {
        this.model.onChange.remove(this.update)
        super.destroy();
    }
}

interface IItemData{
    title: string,
    price: number,
    id?: string
}

class TodoItem extends Control{
    title: Control<HTMLElement>;
    buttonRemove: Control<HTMLElement>;
    onRemoveClick: ()=>void;
    buttonEdit: Control<HTMLElement>;
    onEditClick: ()=>void;
    constructor(parentNode:HTMLElement){
        super(parentNode);
        this.title = new Control(this.node, 'div');
        this.buttonRemove = new Control(this.node, 'button', '', 'remove');
        this.buttonRemove.node.onclick = ()=>{
            this.onRemoveClick();
        }

        this.buttonEdit = new Control(this.node, 'button', '', 'edit');
        this.buttonEdit.node.onclick = ()=>{
            this.onEditClick();
        }
    }

    update(data: IItemData){
        this.title.node.textContent = data.title;
    }
}

class AppModel{
    onChange:Signal<IAppData> = new Signal();
    _data: IAppData;

    constructor(initialData:IAppData){
        this._data = {...initialData, items:initialData.items.map(it=> new ItemData(it))};

    }

    setData(getNext: (last: IAppData)=> IAppData){
        this._data = getNext(this._data);
        this.onChange.emit(this._data);
    }

    get data(){
        return this._data;
    }

    get itemsCount(){
        return this._data.items.length;
    }

    get itemsPrice(){
        return this._data.items.reduce((acc, it)=> acc + it.price, 0);
    }
}


class M{
    data: number = 2;
    other: number = 32;
    _doubled: CachedValue;

    constructor(){
        // y = a + b + c; [a, b, c]
        this._doubled = new CachedValue(()=>{
            return this.data * 2;
        }, ()=>[this.data])

        this._doubled.value;
    }

    setData(a: number, b: number){
        this.data = a;
        this.other = b;
    }

    get doubled(){
        return this._doubled.value;
    }
}

class CachedValue{
    private deps: Array<any>;
    private cached: any;
    private func: () => any;
    private getDeps: () => Array<any>;

    constructor(func: ()=>any, deps: ()=>Array<any>){
        this.getDeps = deps;
        this.func = func;
    }

    private getValue(/*deps:Array<any>*/){
        console.log (this.deps);
        let deps = this.getDeps();
        this.deps != null &&console.log(this.deps.findIndex((it, i)=> it != deps[i]));
        if (this.deps == null || ( this.deps.length == deps.length && this.deps.findIndex((it, i)=> it != deps[i]) !== -1)){
            this.deps = deps;
            this.cached = this.func();
            console.log('updated');
            //this.cachedDouble = this.data * 2;
        } 
        return this.cached;
    }

    get value(){
        return this.getValue();
    }
}

const m = new M();

console.log(m.doubled)
console.log(m.doubled)
console.log(m.doubled)

m.data = 4345;

console.log(m.doubled)
console.log(m.doubled)
console.log(m.doubled)

function typeNumber(value: any): value is number{
    if (typeof value == 'number'){
        return true;
    }
    return false;
    //throw new Error('Interface checker: not a number');
}

function typeString(value: any): value is string{
    if (typeof value == 'string'){
        return true;
    }
    return false;
    //throw new Error('Interface checker: not a string');
}

interface IMyRecord{
    a: number,
    b: string,
}

const myRecord = {
    a: typeNumber,
    b: typeString
}

function checkInterface<T>(obj: T ,objType: Record<string, (value: any)=> value is any>): obj is T{
    try{
        const keys = Object.keys(objType);
        for (const it of keys){
            const val = (obj as any)[it]
            const res = objType[it](val); 
            if (!res){
                throw new Error('Interface is not correct');
            }       
        }
        return true;
    } catch (e){
        return false;
    }
}

console.log('IC ', checkInterface<IMyRecord>(JSON.parse(JSON.stringify({a: 1, b: 432})), myRecord))
console.log('IC ',checkInterface<IMyRecord>(JSON.parse(JSON.stringify({a: 1, b: ''})), myRecord));


class Aa2{
    count: number;

    constructor(count: number){
        this.count = count;
    }

    static getSum(){

    }
    static e1(){
        
    }
}
var a = [new Aa2(1), new Aa2(2)];