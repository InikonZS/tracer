import Control from "./common/control";

export interface IRouteScene{
    destroy: ()=>void
}

export interface IRoute{
    name:string;
    component: (parent:HTMLElement)=> IRouteScene;
}

export class MainRouter extends Control{
    menu: Control<HTMLElement>;
    content: Control<HTMLElement>;
    currentScene: IRouteScene = null;
    selectedIndex: number = null;

    constructor(parentNode:HTMLElement, routes: Array<IRoute>){
        super(parentNode, 'div', 'router');
        this.menu = new Control(this.node, 'div', 'menu');
        this.content = new Control(this.node, 'div', 'screen');   

        const buttons = routes.map((route, index)=>{
            const item = new Control(this.menu.node, 'button', 'menu_button', route.name);
            item.node.onclick = ()=>{
                if (this.selectedIndex != null){
                    buttons[this.selectedIndex].node.classList.remove('menu_button_active');
                }
                this.selectedIndex = index;
                buttons[this.selectedIndex].node.classList.add('menu_button_active');
                if (this.currentScene){
                    this.currentScene.destroy();
                    this.currentScene = null;
                }
                const scene = route.component(this.content.node);
                this.currentScene = scene;
            } 
            return item;
        });

        buttons[1].node.click();
    }
}