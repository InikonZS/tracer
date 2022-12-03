import Control from '../common/control';
import Signal from '../common/signal';

export class TodoApp extends Control{
    constructor(parentNode: HTMLElement){
        super(parentNode);
        const el = new Control(this.node, 'div', '', 'hi');

        const appModel = new AppModel({});
        ///const appController = new MyServiceAppController(appModel, {});
        const appView = new AppView(this.node, appModel, /*appController*/ {
            add() {
                el.node.textContent = 'ewrtry'
            },
            remove() {
                
            },
            edit() {
                
            },
        });

    }
}

interface IAppData{

}

interface IAppController{ 
    add: ()=>void;
    remove: ()=>void;
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
        this.model.setData((last=> ({...last, items: res}))) 
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
        this.myApi.sendRequest().then(res=>{
            this.model.setData((last=> ({...last, items: res})))
        }) 
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
    constructor(parentNode: HTMLElement, model: AppModel, controller: IAppController){
        super(parentNode);
        this.el = new Control(this.node, 'div', '', 'hi');
        this.buttonAdd = new Control(this.node, 'button');
        this.buttonAdd.node.onclick = ()=>controller.add();//this.handleAdd;
        this.model = model;
        model.onChange.add(this.update);
        this.update(model.data);
    }
    /*handleAdd = ()=>{
       this.onAdd();     
    }*/

    update=(data: IAppData)=>{

    }

    destroy(): void {
        this.model.onChange.remove(this.update)
        super.destroy();
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