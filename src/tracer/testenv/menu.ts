import Control from "../../common/control";
import { IMenuData, IPlayerData, MenuModel } from "./menu-model";
import "./menu.css";

class PlayerView extends Control{
    id: Control<HTMLElement>;
    money: Control<HTMLElement>;
    constructor(parentNode: HTMLElement) {
        super(parentNode);
        this.id = new Control(this.node);
        this.money = new Control(this.node);
    }

    update(data:IPlayerData){
        this.money.node.textContent = 'money '+ data.money.toString();
    }
}

export class Menu extends Control {
    private model: MenuModel;
    drawPath: Control<HTMLInputElement>;
    unitStepTime: Control<HTMLInputElement>;
    destroyed: Control<HTMLElement>;
    count: Control<HTMLElement>;
    spawned: Control<HTMLElement>;
    players: PlayerView[];
    fps: Control<HTMLElement>;
    constructor(parentNode: HTMLElement, model: MenuModel) {
        super(parentNode);
        this.model = model;
    
        this.drawPath = new Control<HTMLInputElement>(this.node, 'input');
        this.drawPath.node.type = 'checkbox';
        this.drawPath.node.onchange = () => {
            model.setData(last => ({
                ...last, drawPath: !last.drawPath
            }))
        } 

        this.unitStepTime = new Control<HTMLInputElement>(this.node, 'input');
        this.unitStepTime.node.type = 'range';
        this.unitStepTime.node.min = '10';
        this.unitStepTime.node.max = '300';
        this.unitStepTime.node.oninput = () => {
            model.setData(last => ({
                ...last, unitStepTime: this.unitStepTime.node.valueAsNumber
            }))
        }

        this.destroyed = new Control(this.node);
        this.count = new Control(this.node);
        this.spawned = new Control(this.node);
        this.fps = new Control(this.node);

        this.players = model.data.players.map(player=> new PlayerView(this.node));
        this.model.onChange.add(this.update);
        this.update(model.data);
    } 
    update = (data: IMenuData) => {
        this.drawPath.node.checked = data.drawPath;
        this.unitStepTime.node.value = data.unitStepTime.toString();
        this.destroyed.node.textContent = 'destroyed ' + data.destroyed.toString();
        this.count.node.textContent = 'count ' + data.count.toString();
        this.spawned.node.textContent = 'spawned ' + data.spawned.toString();
        this.players.forEach((player, id)=> player.update(data.players[id]));
        this.fps.node.textContent = 'fps ' + data.fps.toFixed(2);
    }
    destroy() {
        this.model.onChange.remove(this.update);
        super.destroy();
    }
}

