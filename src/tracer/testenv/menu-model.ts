import Signal from "../../common/signal";

export interface IMenuData {
    drawPath: boolean;
    unitStepTime: number;
    destroyed: number;
    spawned: number;
    count: number
}

export class MenuModel {   
    data: IMenuData;
    onChange: Signal<IMenuData> = new Signal();
    constructor(initial: IMenuData){
       this.data = initial;
    }

    setData(getData: (lastData: IMenuData) => IMenuData) {
        this.data = getData(this.data);
        this.onChange.emit(this.data);
    }
}