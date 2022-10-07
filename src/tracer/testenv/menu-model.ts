import Signal from "../../common/signal";

export interface IMenuData {
    drawPath: boolean;
    unitStepTime: number;
    destroyed: number;
    spawned: number;
    count: number,
    players: Array<IPlayerData>
}

export interface IPlayerData{
    money:number
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

    setPlayerData(id: number, getData: (lastData: IPlayerData) => IPlayerData) {
        this.data.players[id] = getData(this.data.players[id]);
        this.onChange.emit(this.data);
    }
}