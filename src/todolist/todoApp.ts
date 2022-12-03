import Control from '../common/control';
import Signal from '../common/signal';

export class TodoApp extends Control{
    constructor(parentNode: HTMLElement){
        super(parentNode);
        const el = new Control(this.node, 'div', '', 'hi');

        const appModel = new AppModel({
            items: [{title: 'wert'}, {title: 'werweerstet'},]
        });
        ///const appController = new MyServiceAppController(appModel, {});
        const appView = new AppView(this.node, appModel, /*appController*/ {
            add(itemData: IItemData) {
                //el.node.textContent = 'ewrtry'
                appModel.setData((last)=> ({...last, items: [...last.items, itemData]}))
            },
            remove(itemData: IItemData) {
                appModel.setData((last)=> ({...last, items: last.items.filter(it=> it !== itemData)}))
            },
            edit() {
                
            },
        });

    }
}

interface IAppData{
    items: Array<IItemData>
}

interface IAppController{ 
    add: (itemData: IItemData)=>void;
    remove: (itemData: IItemData)=>void;
    edit: ()=>void;
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

export class AppView extends Control{
    el: Control<HTMLElement>;
    buttonAdd: Control<HTMLButtonElement>;
    model: AppModel;
    listWrapper: Control<HTMLElement>;
    controller: IAppController;
    constructor(parentNode: HTMLElement, model: AppModel, controller: IAppController){
        super(parentNode);
        this.model = model;
        this.controller = controller;
        this.el = new Control(this.node, 'div', '', 'hi');

        this.buttonAdd = new Control(this.node, 'button', '', 'add');
        this.buttonAdd.node.onclick = ()=>controller.add({title: 'wertrew'});//this.handleAdd;

        this.listWrapper = new Control(this.node, 'div');

        model.onChange.add(this.update);
        this.update(model.data);
    }
    /*handleAdd = ()=>{
       this.onAdd();     
    }*/

    update=(data: IAppData)=>{
        this.listWrapper.node.textContent = '';
        data.items.map(itemData=>{
            const item = new TodoItem(this.listWrapper.node);
            item.onRemoveClick = ()=>{
                this.controller.remove(itemData);
                //this.model.setData((last)=> ({...last, items: last.items.filter(it=> it !== itemData)}))
            }
            item.update(itemData);
        })
    }

    destroy(): void {
        this.model.onChange.remove(this.update)
        super.destroy();
    }
}

interface IItemData{
    title: string
}

class TodoItem extends Control{
    title: Control<HTMLElement>;
    buttonRemove: Control<HTMLElement>;
    onRemoveClick: any;
    constructor(parentNode:HTMLElement){
        super(parentNode);
        this.title = new Control(this.node, 'div');
        this.buttonRemove = new Control(this.node, 'button', '', 'remove');
        this.buttonRemove.node.onclick = ()=>{
            this.onRemoveClick();
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
        this._data = initialData;
    }

    setData(getNext: (last: IAppData)=> IAppData){
        this._data = getNext(this._data);
        this.onChange.emit(this._data);
    }

    get data(){
        return this._data;
    }
}


//setData((last)=> ({...last, field: 4}))