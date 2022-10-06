import Control from "../../common/control";
import { IMenuData, MenuModel } from "./menu-model";
import "./menu.css";

export class Menu extends Control {
    private model: MenuModel;
    drawPath: Control<HTMLInputElement>;
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
        this.model.onChange.add(this.update);
        this.update(model.data);
    } 
    update = (data: IMenuData) => {
        this.drawPath.node.checked = data.drawPath;
    }
    destroy() {
        this.model.onChange.remove(this.update);
        super.destroy();
    }
}

